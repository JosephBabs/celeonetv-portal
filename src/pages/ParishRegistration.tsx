import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

type MapEngine = "osm" | "google";
type Coordinates = { latitude: number; longitude: number };
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
  country: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

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
          setStatus({ tone: "warn", text: "Existing parishes could not be loaded. You can still place the marker before submitting." });
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

    mountOsmMap().catch(() => setStatus({ tone: "error", text: "OpenStreetMap could not be loaded. Try the Google map option or enter coordinates by locating yourself." }));
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [engine, parishes, point.latitude, point.longitude]);

  useEffect(() => {
    if (!mapRef.current || engine !== "google") return;
    if (!googleKey) {
      mapRef.current.innerHTML = "<div class='flex h-full items-center justify-center p-6 text-center text-sm font-bold text-slate-600'>Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps. OpenStreetMap is ready now.</div>";
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
        title: "Selected parish location",
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

    mountGoogleMap().catch(() => setStatus({ tone: "error", text: "Google Maps could not be loaded. OpenStreetMap remains available." }));
    return () => {
      cancelled = true;
    };
  }, [engine, googleKey, parishes, point.latitude, point.longitude]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function snapToCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus({ tone: "error", text: "This browser does not support geolocation." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setStatus({ tone: "ok", text: "Marker snapped to your current location. Move it if the parish is nearby but not exactly here." });
        setLocating(false);
      },
      () => {
        setStatus({ tone: "error", text: "Location permission was denied or unavailable. You can still click the map to choose the parish." });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function submitParish(event: React.FormEvent) {
    event.preventDefault();
    const name = form.parishName.trim();
    if (!name) {
      setStatus({ tone: "error", text: "Enter the parish name before submitting." });
      return;
    }
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
      setStatus({ tone: "error", text: "Choose a valid parish location on the map." });
      return;
    }
    if (duplicate) {
      setStatus({
        tone: "warn",
        text: `${duplicate.parish.name} is already registered about ${Math.round(duplicate.meters)} m from this point. Move the marker if this is a different parish.`,
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
      setStatus({ tone: "ok", text: "Thank you. The parish was submitted for review and will appear after approval." });
    } catch (error: any) {
      const alreadyExists = String(error?.code || "").includes("already-exists") || String(error?.message || "").includes("already exists");
      setStatus({
        tone: alreadyExists ? "warn" : "error",
        text: alreadyExists
          ? "A parish request already exists for this exact map area. Admins can review the pending submission."
          : "The parish could not be submitted. Check the Firestore rule deployment and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="portal-badge">Global parish map</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-[#081828] md:text-5xl">
            Register your parish location
          </h1>
          <p className="portal-body mt-4 max-w-2xl">
            Add your parish to the Cele One map without signing in. Choose the exact point, use your current location if you are at the parish, and we will review it before publishing.
          </p>
        </div>
        <div className="rounded-[8px] border border-[#dbe8ef] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
          <div className="grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
            <div>
              <div className="text-2xl font-black text-[#0f766e]">{loadingParishes ? "--" : parishes.length}</div>
              approved locations
            </div>
            <div>
              <div className="text-2xl font-black text-[#0f766e]">100 m</div>
              duplicate guard
            </div>
            <div>
              <div className="text-2xl font-black text-[#0f766e]">No login</div>
              pending review
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={submitParish} className="rounded-[8px] border border-[#e6edf3] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#081828]">Parish details</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Only the parish and location are required.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Parish name
              <input value={form.parishName} onChange={(event) => updateField("parishName", event.target.value)} placeholder="Celestial Church parish name" maxLength={120} required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Address or landmark
              <input value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Street, neighborhood, nearest landmark" maxLength={180} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                City
                <input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City" maxLength={80} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Country
                <input value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder="Country" maxLength={80} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Contact name
                <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} placeholder="Optional" maxLength={80} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Contact phone
                <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} placeholder="Optional" maxLength={40} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Contact email
              <input value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} placeholder="Optional" type="email" maxLength={120} />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Notes for review
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Service times, leader name, or anything admins should verify" rows={4} maxLength={600} />
            </label>
          </div>

          <div className="mt-5 rounded-[8px] border border-[#dbe8ef] bg-[#f8fbfd] p-4 text-sm font-bold text-slate-600">
            Selected coordinates: <span className="text-[#081828]">{formatPoint(point)}</span>
          </div>

          {duplicate ? (
            <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Possible duplicate: {duplicate.parish.name} is about {Math.round(duplicate.meters)} m from this point.
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
            {submitting ? "Submitting..." : "Submit parish for review"}
          </button>
        </form>

        <div className="rounded-[8px] border border-[#e6edf3] bg-white p-4 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#081828]">Choose the location</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Click or drag the marker to the parish entrance or main building.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEngine("osm")} className={`rounded-[8px] px-4 py-2 text-sm font-black ${engine === "osm" ? "bg-[#0f766e] text-white" : "bg-[#eef7f5] text-[#0f766e]"}`}>
                OSM
              </button>
              <button type="button" onClick={() => setEngine("google")} className={`rounded-[8px] px-4 py-2 text-sm font-black ${engine === "google" ? "bg-[#081828] text-white" : "bg-[#f1f5f9] text-[#081828]"}`}>
                Google
              </button>
              <button type="button" onClick={snapToCurrentLocation} disabled={locating} className="rounded-[8px] bg-[#f5c451] px-4 py-2 text-sm font-black text-[#081828] disabled:opacity-60">
                {locating ? "Locating..." : "Use my location"}
              </button>
            </div>
          </div>

          <div ref={mapRef} className="h-[520px] overflow-hidden rounded-[8px] border border-[#dbe8ef] bg-[#dff4f0]" />

          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 md:grid-cols-2">
            <div className="rounded-[8px] bg-[#f8fbfd] p-4">
              Public users create pending requests only. Admins approve clean records into <span className="text-[#081828]">parishes</span>.
            </div>
            <div className="rounded-[8px] bg-[#f8fbfd] p-4">
              The mobile app reads approved locations from <span className="text-[#081828]">parishes</span> using latitude and longitude fields.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
