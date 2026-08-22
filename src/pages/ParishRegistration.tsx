import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";

type MapEngine = "osm" | "google";
type Coordinates = { latitude: number; longitude: number };
type CountryOption = { code: string; label: string };
type ParishRecord = Coordinates & {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
};

type FormState = {
  parishName: string;
  address: string;
  city: string;
  countryCode: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

declare global {
  interface Window {
    L?: any;
    google?: any;
    __celeoneGoogleMapsReady?: () => void;
  }
}

const DEFAULT_POINT: Coordinates = { latitude: 6.3703, longitude: 2.3912 };
const DUPLICATE_RADIUS_METERS = 100;
const LEAFLET_CSS_ID = "celeone-leaflet-css";
const LEAFLET_SCRIPT_ID = "celeone-leaflet-js";
const GOOGLE_SCRIPT_ID = "celeone-google-maps-js";

const initialForm: FormState = {
  parishName: "",
  address: "",
  city: "",
  countryCode: "",
  country: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

const FALLBACK_COUNTRY_CODES = [
  "BJ",
  "FR",
  "NG",
  "CI",
  "TG",
  "GH",
  "CM",
  "CD",
  "CG",
  "GA",
  "SN",
  "US",
  "CA",
  "GB",
  "ES",
  "IT",
  "DE",
  "NL",
  "BE",
  "BR",
  "ZA",
];

function countryCodes() {
  const supportedValuesOf = (Intl as any).supportedValuesOf;
  if (typeof supportedValuesOf === "function") {
    try {
      return supportedValuesOf("region").filter((code: string) => /^[A-Z]{2}$/.test(code));
    } catch {
      return FALLBACK_COUNTRY_CODES;
    }
  }
  return FALLBACK_COUNTRY_CODES;
}

function countryOptions(lang: string): CountryOption[] {
  const displayNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([lang], { type: "region" }) : null;
  return countryCodes()
    .map((code: string): CountryOption => ({ code, label: displayNames?.of(code) || code }))
    .sort((a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label, lang));
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, String(value)), template);
}

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function normalizeParish(id: string, data: any): ParishRecord | null {
  const location = data.location || {};
  const latitude = toNumber(data.latitude ?? data.lat ?? location.latitude);
  const longitude = toNumber(data.longitude ?? data.lng ?? data.lon ?? location.longitude);
  if (latitude === undefined || longitude === undefined) return null;
  return {
    id,
    name: String(data.name || data.parishName || data.title || "Parish"),
    address: String(data.address || data.locationText || ""),
    city: String(data.city || ""),
    country: String(data.country || ""),
    status: String(data.status || "active"),
    latitude,
    longitude,
  };
}

function distanceMeters(from: Coordinates, to: Coordinates) {
  const radius = 6371000;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geoKey(point: Coordinates) {
  const lat = point.latitude.toFixed(3).replace(".", "_").replace("-", "m");
  const lng = point.longitude.toFixed(3).replace(".", "_").replace("-", "m");
  return `parish_${lat}_${lng}`;
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

function ensureLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

function formatPoint(point: Coordinates) {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}

function nearbyParish(parishes: ParishRecord[], point: Coordinates) {
  return parishes
    .map((parish) => ({ parish, meters: distanceMeters(point, parish) }))
    .filter((item) => item.meters <= DUPLICATE_RADIUS_METERS)
    .sort((a, b) => a.meters - b.meters)[0];
}

export default function ParishRegistration() {
  const { lang, t } = useI18n();
  const [form, setForm] = useState<FormState>(initialForm);
  const [point, setPoint] = useState<Coordinates>(DEFAULT_POINT);
  const [engine, setEngine] = useState<MapEngine>("osm");
  const [parishes, setParishes] = useState<ParishRecord[]>([]);
  const [loadingParishes, setLoadingParishes] = useState(true);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "");

  const duplicate = useMemo(() => nearbyParish(parishes, point), [parishes, point]);
  const countries = useMemo(() => countryOptions(lang), [lang]);

  function msg(key: string, fallback: string, values?: Record<string, string | number>) {
    const template = t(key, fallback);
    return values ? interpolate(template, values) : template;
  }

  useEffect(() => {
    let mounted = true;
    async function loadParishes() {
      setLoadingParishes(true);
      try {
        const snap = await getDocs(query(collection(db, "parishes")));
        if (!mounted) return;
        setParishes(
          snap.docs
            .map((item) => normalizeParish(item.id, item.data()))
            .filter((item): item is ParishRecord => !!item && item.status !== "inactive"),
        );
      } catch {
        if (mounted) {
          setStatus({ tone: "warn", text: t("parish_register.status.load_failed", "Existing parishes could not be loaded. You can still place the marker before submitting.") });
        }
      } finally {
        if (mounted) setLoadingParishes(false);
      }
    }
    loadParishes();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || engine !== "osm") return;
    let cancelled = false;
    let map: any;

    async function mountOsmMap() {
      ensureLeafletCss();
      await loadScript(LEAFLET_SCRIPT_ID, "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      if (cancelled || !mapRef.current || !window.L) return;

      mapRef.current.innerHTML = "";
      map = window.L.map(mapRef.current, { zoomControl: true }).setView([point.latitude, point.longitude], 15);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const marker = window.L.marker([point.latitude, point.longitude], { draggable: true }).addTo(map);
      parishes.forEach((parish) => {
        window.L.circleMarker([parish.latitude, parish.longitude], {
          radius: 7,
          color: "#0f766e",
          fillColor: "#f5c451",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${parish.name}</strong><br>${[parish.address, parish.city, parish.country].filter(Boolean).join(", ")}`);
      });

      marker.on("dragend", () => {
        const next = marker.getLatLng();
        setPoint({ latitude: next.lat, longitude: next.lng });
      });
      map.on("click", (event: any) => {
        marker.setLatLng(event.latlng);
        setPoint({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
    }

    mountOsmMap().catch(() => setStatus({ tone: "error", text: t("parish_register.status.osm_failed", "OpenStreetMap could not be loaded. Try the Google map option or enter coordinates by locating yourself.") }));
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [engine, parishes, point.latitude, point.longitude, t]);

  useEffect(() => {
    if (!mapRef.current || engine !== "google") return;
    if (!googleKey) {
      mapRef.current.innerHTML = `<div class='flex h-full items-center justify-center p-6 text-center text-sm font-bold text-slate-600'>${t("parish_register.map.google_key_missing", "Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps. OpenStreetMap is ready now.")}</div>`;
      return;
    }
    let cancelled = false;

    async function mountGoogleMap() {
      window.__celeoneGoogleMapsReady = () => undefined;
      await loadScript(GOOGLE_SCRIPT_ID, `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleKey)}&callback=__celeoneGoogleMapsReady`);
      if (cancelled || !mapRef.current || !window.google) return;

      const center = { lat: point.latitude, lng: point.longitude };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: t("parish_register.map.selected_marker", "Selected parish location"),
      });
      parishes.forEach((parish) => {
        new window.google.maps.Marker({
          position: { lat: parish.latitude, lng: parish.longitude },
          map,
          title: parish.name,
          icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        });
      });
      marker.addListener("dragend", () => {
        const next = marker.getPosition();
        setPoint({ latitude: next.lat(), longitude: next.lng() });
      });
      map.addListener("click", (event: any) => {
        marker.setPosition(event.latLng);
        setPoint({ latitude: event.latLng.lat(), longitude: event.latLng.lng() });
      });
    }

    mountGoogleMap().catch(() => setStatus({ tone: "error", text: t("parish_register.status.google_failed", "Google Maps could not be loaded. OpenStreetMap remains available.") }));
    return () => {
      cancelled = true;
    };
  }, [engine, googleKey, parishes, point.latitude, point.longitude, t]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCountry(countryCode: string) {
    const selected = countries.find((country) => country.code === countryCode);
    setForm((current) => ({
      ...current,
      countryCode,
      country: selected?.label || "",
    }));
  }

  function snapToCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus({ tone: "error", text: t("parish_register.status.geolocation_unsupported", "This browser does not support geolocation.") });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setStatus({ tone: "ok", text: t("parish_register.status.location_snapped", "Marker snapped to your current location. Move it if the parish is nearby but not exactly here.") });
        setLocating(false);
      },
      () => {
        setStatus({ tone: "error", text: t("parish_register.status.location_denied", "Location permission was denied or unavailable. You can still click the map to choose the parish.") });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function submitParish(event: React.FormEvent) {
    event.preventDefault();
    const name = form.parishName.trim();
    if (!name) {
      setStatus({ tone: "error", text: t("parish_register.status.name_required", "Enter the parish name before submitting.") });
      return;
    }
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
      setStatus({ tone: "error", text: t("parish_register.status.location_required", "Choose a valid parish location on the map.") });
      return;
    }
    if (duplicate) {
      setStatus({
        tone: "warn",
        text: msg("parish_register.status.duplicate", "{name} is already registered about {meters} m from this point. Move the marker if this is a different parish.", {
          name: duplicate.parish.name,
          meters: Math.round(duplicate.meters),
        }),
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const id = geoKey(point);
      await setDoc(
        doc(db, "parish_registration_requests", id),
        {
          name,
          parishName: name,
          address: form.address.trim(),
          city: form.city.trim(),
          countryCode: form.countryCode,
          country: form.country.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          notes: form.notes.trim(),
          latitude: Number(point.latitude.toFixed(6)),
          longitude: Number(point.longitude.toFixed(6)),
          location: {
            latitude: Number(point.latitude.toFixed(6)),
            longitude: Number(point.longitude.toFixed(6)),
          },
          geoKey: id,
          status: "pending",
          source: "public_portal",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false },
      );
      setForm(initialForm);
      setStatus({ tone: "ok", text: t("parish_register.status.success", "Thank you. The parish was submitted for review and will appear after approval.") });
    } catch (error: any) {
      const alreadyExists = String(error?.code || "").includes("already-exists") || String(error?.message || "").includes("already exists");
      setStatus({
        tone: alreadyExists ? "warn" : "error",
        text: alreadyExists
          ? t("parish_register.status.already_exists", "A parish request already exists for this exact map area. Admins can review the pending submission.")
          : t("parish_register.status.submit_failed", "The parish could not be submitted. Check the Firestore rule deployment and try again."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="portal-badge">{t("parish_register.badge", "Global parish map")}</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-[#081828] md:text-5xl">
            {t("parish_register.title", "Register your parish location")}
          </h1>
          <p className="portal-body mt-4 max-w-2xl">
            {t("parish_register.subtitle", "Add your parish to the Cele One map without signing in. Choose the exact point, use your current location if you are at the parish, and we will review it before publishing.")}
          </p>
        </div>
        <div className="rounded-[8px] border border-[#dbe8ef] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
          <div className="grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
            <div>
              <div className="text-2xl font-black text-[#0f766e]">{loadingParishes ? "--" : parishes.length}</div>
              {t("parish_register.stats.approved", "approved locations")}
            </div>
            <div>
              <div className="text-2xl font-black text-[#0f766e]">100 m</div>
              {t("parish_register.stats.duplicate_guard", "duplicate guard")}
            </div>
            <div>
              <div className="text-2xl font-black text-[#0f766e]">{t("parish_register.stats.no_login_value", "No login")}</div>
              {t("parish_register.stats.pending_review", "pending review")}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={submitParish} className="order-2 rounded-[8px] border border-[#e6edf3] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)] xl:order-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#081828]">{t("parish_register.form.title", "Parish details")}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t("parish_register.form.subtitle", "Only the parish and location are required.")}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              {t("parish_register.form.parish_name", "Parish name")}
              <input value={form.parishName} onChange={(event) => updateField("parishName", event.target.value)} placeholder={t("parish_register.form.parish_name_ph", "Celestial Church parish name")} maxLength={120} required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              {t("parish_register.form.address", "Address or landmark")}
              <input value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder={t("parish_register.form.address_ph", "Street, neighborhood, nearest landmark")} maxLength={180} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                {t("parish_register.form.city", "City")}
                <input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder={t("parish_register.form.city_ph", "City")} maxLength={80} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                {t("parish_register.form.country", "Country")}
                <select value={form.countryCode} onChange={(event) => updateCountry(event.target.value)}>
                  <option value="">{t("parish_register.form.country_ph", "Choose a country")}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                {t("parish_register.form.contact_name", "Contact name")}
                <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} placeholder={t("parish_register.form.optional", "Optional")} maxLength={80} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                {t("parish_register.form.contact_phone", "Contact phone")}
                <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} placeholder={t("parish_register.form.optional", "Optional")} maxLength={40} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              {t("parish_register.form.contact_email", "Contact email")}
              <input value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} placeholder={t("parish_register.form.optional", "Optional")} type="email" maxLength={120} />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              {t("parish_register.form.notes", "Notes for review")}
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder={t("parish_register.form.notes_ph", "Service times, leader name, or anything admins should verify")} rows={4} maxLength={600} />
            </label>
          </div>

          <div className="mt-5 rounded-[8px] border border-[#dbe8ef] bg-[#f8fbfd] p-4 text-sm font-bold text-slate-600">
            {t("parish_register.form.selected_coordinates", "Selected coordinates:")} <span className="text-[#081828]">{formatPoint(point)}</span>
          </div>

          {duplicate ? (
            <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              {msg("parish_register.form.duplicate_notice", "Possible duplicate: {name} is about {meters} m from this point.", {
                name: duplicate.parish.name,
                meters: Math.round(duplicate.meters),
              })}
            </div>
          ) : null}

          {status ? (
            <div
              className={`mt-4 rounded-[8px] border p-4 text-sm font-bold ${
                status.tone === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : status.tone === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {status.text}
            </div>
          ) : null}

          <button type="submit" disabled={submitting || !!duplicate} className="portal-btn portal-btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-55">
            {submitting ? t("parish_register.form.submitting", "Submitting...") : t("parish_register.form.submit", "Submit parish for review")}
          </button>
        </form>

        <div className="order-1 rounded-[8px] border border-[#e6edf3] bg-white p-4 shadow-[0_12px_35px_rgba(8,24,40,0.06)] xl:order-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#081828]">{t("parish_register.map.title", "Choose the location")}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t("parish_register.map.subtitle", "Click or drag the marker to the parish entrance or main building.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEngine("osm")} className={`rounded-[8px] px-4 py-2 text-sm font-black ${engine === "osm" ? "bg-[#0f766e] text-white" : "bg-[#eef7f5] text-[#0f766e]"}`}>
                OSM
              </button>
              <button type="button" onClick={() => setEngine("google")} className={`rounded-[8px] px-4 py-2 text-sm font-black ${engine === "google" ? "bg-[#081828] text-white" : "bg-[#f1f5f9] text-[#081828]"}`}>
                Google
              </button>
              <button type="button" onClick={snapToCurrentLocation} disabled={locating} className="rounded-[8px] bg-[#f5c451] px-4 py-2 text-sm font-black text-[#081828] disabled:opacity-60">
                {locating ? t("parish_register.map.locating", "Locating...") : t("parish_register.map.use_my_location", "Use my location")}
              </button>
            </div>
          </div>

          <div ref={mapRef} className="h-[520px] overflow-hidden rounded-[8px] border border-[#dbe8ef] bg-[#dff4f0]" />

          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 md:grid-cols-2">
            <div className="rounded-[8px] bg-[#f8fbfd] p-4">
              {t("parish_register.rules.public_pending_prefix", "Public users create pending requests only. Admins approve clean records into")} <span className="text-[#081828]">parishes</span>.
            </div>
            <div className="rounded-[8px] bg-[#f8fbfd] p-4">
              {t("parish_register.rules.mobile_reads_prefix", "The mobile app reads approved locations from")} <span className="text-[#081828]">parishes</span> {t("parish_register.rules.mobile_reads_suffix", "using latitude and longitude fields.")}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
