import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

type Coordinates = { latitude: number; longitude: number };
type ParishRecord = Coordinates & {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  leaderName?: string;
  imageUrl?: string;
  status?: string;
  serviceTimes?: string;
  distanceKm?: number;
};

declare global {
  interface Window {
    L?: any;
  }
}

const DEFAULT_POINT: Coordinates = { latitude: 6.3703, longitude: 2.3912 };
const LEAFLET_CSS_ID = "celeone-leaflet-css";
const LEAFLET_SCRIPT_ID = "celeone-leaflet-js";

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
    name: String(data.name || data.parishName || data.title || "Paroisse"),
    description: String(data.description || ""),
    address: String(data.address || data.locationText || ""),
    city: String(data.city || ""),
    country: String(data.country || ""),
    phone: String(data.phone || data.contactPhone || ""),
    leaderName: String(data.leaderName || data.pastorName || data.shepherdName || ""),
    imageUrl: String(data.imageUrl || data.coverUrl || ""),
    status: String(data.status || "active"),
    serviceTimes: String(data.serviceTimes || data.schedule || ""),
    latitude,
    longitude,
  };
}

function distanceKm(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function formatDistance(km?: number) {
  if (km === undefined || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function mapsDirectionsUrl(parish: ParishRecord, origin?: Coordinates | null) {
  const destination = `${parish.latitude},${parish.longitude}`;
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (origin) params.set("origin", `${origin.latitude},${origin.longitude}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function placeLine(parish: ParishRecord) {
  return [parish.address, parish.city, parish.country].filter(Boolean).join(", ");
}

export default function ParishMap() {
  const { t } = useI18n();
  const [parishes, setParishes] = useState<ParishRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    setPageMeta({
      title: "Parish Map | CeleOne",
      description: "Find approved CeleOne parishes near you with geolocation, distance sorting, and directions.",
      canonicalPath: "/parishes",
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadParishes() {
      setLoading(true);
      try {
        let snap;
        try {
          snap = await getDocs(query(collection(db, "parishes"), orderBy("name", "asc")));
        } catch {
          snap = await getDocs(collection(db, "parishes"));
        }
        if (!mounted) return;
        setParishes(
          snap.docs
            .map((item) => normalizeParish(item.id, item.data()))
            .filter((item): item is ParishRecord => !!item && item.status !== "inactive"),
        );
      } catch {
        if (mounted) setStatus({ tone: "error", text: "Approved parishes could not be loaded." });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadParishes();
    return () => {
      mounted = false;
    };
  }, []);

  const withDistance = useMemo(
    () =>
      parishes.map((parish) => ({
        ...parish,
        distanceKm: userLocation ? distanceKm(userLocation, parish) : undefined,
      })),
    [parishes, userLocation],
  );

  const filteredParishes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = needle
      ? withDistance.filter((parish) =>
          [parish.name, parish.address, parish.city, parish.country, parish.leaderName]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : withDistance;
    return [...rows].sort((a, b) => {
      if (userLocation) return (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999);
      return a.name.localeCompare(b.name);
    });
  }, [search, userLocation, withDistance]);

  const selectedParish = useMemo(
    () => withDistance.find((parish) => parish.id === selectedId) || filteredParishes[0] || null,
    [filteredParishes, selectedId, withDistance],
  );

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    let map: any;

    async function mountMap() {
      ensureLeafletCss();
      await loadScript(LEAFLET_SCRIPT_ID, "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      if (cancelled || !mapRef.current || !window.L) return;

      mapRef.current.innerHTML = "";
      const points = filteredParishes.length ? filteredParishes : parishes;
      const center = userLocation || selectedParish || points[0] || DEFAULT_POINT;
      map = window.L.map(mapRef.current, { zoomControl: true }).setView([center.latitude, center.longitude], userLocation ? 13 : 11);
      leafletMapRef.current = map;
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      if (userLocation) {
        window.L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 9,
          color: "#083d38",
          fillColor: "#f5c451",
          fillOpacity: 1,
          weight: 4,
        }).addTo(map).bindPopup("Ma position");
      }

      points.forEach((parish) => {
        const active = parish.id === selectedParish?.id;
        window.L.circleMarker([parish.latitude, parish.longitude], {
          radius: active ? 10 : 7,
          color: active ? "#081828" : "#0f766e",
          fillColor: active ? "#f5c451" : "#14b8a6",
          fillOpacity: 0.92,
          weight: active ? 4 : 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${parish.name}</strong><br>${placeLine(parish) || "Adresse non renseignee"}`)
          .on("click", () => setSelectedId(parish.id));
      });

      const bounds = [
        ...points.map((parish) => [parish.latitude, parish.longitude]),
        ...(userLocation ? [[userLocation.latitude, userLocation.longitude]] : []),
      ];
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: userLocation ? 14 : 12 });
    }

    mountMap().catch(() => setStatus({ tone: "error", text: "The parish map could not be loaded." }));
    return () => {
      cancelled = true;
      if (map) map.remove();
      if (leafletMapRef.current === map) leafletMapRef.current = null;
    };
  }, [filteredParishes, parishes, selectedParish?.id, userLocation]);

  function locateMe() {
    if (!navigator.geolocation) {
      setStatus({ tone: "error", text: "This browser does not support geolocation." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserLocation(next);
        setStatus({ tone: "ok", text: "Position active. Parishes are now sorted by distance." });
        setLocating(false);
      },
      () => {
        setStatus({ tone: "error", text: "Location permission was denied or unavailable." });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  function focusParish(parish: ParishRecord) {
    setSelectedId(parish.id);
    leafletMapRef.current?.setView([parish.latitude, parish.longitude], 16, { animate: true });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="portal-badge">{t("parishes.badge", "Global parish map")}</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-[#081828] md:text-5xl">
            {t("parishes.title", "Find a CeleOne parish near you")}
          </h1>
          <p className="portal-body mt-4 max-w-2xl">
            {t("parishes.subtitle", "Browse approved parish locations, use your current position to sort by distance, and open directions to start your visit.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={locateMe} disabled={locating} className="portal-btn portal-btn-primary disabled:cursor-not-allowed disabled:opacity-60">
              {locating ? "Locating..." : "Use my location"}
            </button>
            <Link to="/parishes/register" className="portal-btn portal-btn-outline">
              Add a parish
            </Link>
          </div>
        </div>
        <div className="grid gap-3 rounded-[8px] border border-[#dbe8ef] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)] sm:grid-cols-3">
          <Stat value={loading ? "--" : String(parishes.length)} label="approved parishes" />
          <Stat value={userLocation ? "GPS" : "Map"} label={userLocation ? "distance sorting" : "browse mode"} />
          <Stat value={selectedParish ? formatDistance(selectedParish.distanceKm) || "Ready" : "--"} label="nearest/selected" />
        </div>
      </section>

      {status ? (
        <div
          className={`rounded-[8px] border p-4 text-sm font-bold ${
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

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[8px] border border-[#e6edf3] bg-white p-4 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#081828]">Carte des paroisses</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Approved parish records from Firestore collection `parishes`.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search parish, city, country"
              className="md:max-w-xs"
            />
          </div>
          <div ref={mapRef} className="h-[580px] overflow-hidden rounded-[8px] border border-[#dbe8ef] bg-[#dff4f0]" />
        </div>

        <aside className="space-y-4">
          {selectedParish ? (
            <div className="rounded-[8px] border border-[#dbe8ef] bg-white p-5 shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
              {selectedParish.imageUrl ? (
                <img src={selectedParish.imageUrl} alt={selectedParish.name} className="mb-4 h-44 w-full rounded-[8px] object-cover" />
              ) : null}
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]">Selected parish</div>
              <h2 className="mt-2 text-2xl font-black text-[#081828]">{selectedParish.name}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{placeLine(selectedParish) || "Address not available"}</p>
              {selectedParish.distanceKm !== undefined ? (
                <div className="mt-3 rounded-[8px] bg-[#f8fbfd] p-3 text-sm font-black text-[#081828]">
                  {formatDistance(selectedParish.distanceKm)} from your location
                </div>
              ) : null}
              <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                {selectedParish.serviceTimes ? <div>Services: {selectedParish.serviceTimes}</div> : null}
                {selectedParish.leaderName ? <div>Leader: {selectedParish.leaderName}</div> : null}
                {selectedParish.phone ? <div>Contact: {selectedParish.phone}</div> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={mapsDirectionsUrl(selectedParish, userLocation)} target="_blank" rel="noreferrer" className="portal-btn portal-btn-primary">
                  Directions
                </a>
                <button type="button" onClick={() => focusParish(selectedParish)} className="portal-btn portal-btn-outline">
                  Focus map
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-[580px] overflow-y-auto rounded-[8px] border border-[#e6edf3] bg-white shadow-[0_12px_35px_rgba(8,24,40,0.06)]">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-4">
              <div className="text-lg font-black text-[#081828]">Parishes</div>
              <div className="text-sm font-semibold text-slate-500">{filteredParishes.length} result(s)</div>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-5 text-sm font-bold text-slate-500">Loading parishes...</div>
              ) : filteredParishes.length ? (
                filteredParishes.map((parish) => (
                  <button
                    key={parish.id}
                    type="button"
                    onClick={() => focusParish(parish)}
                    className={`block w-full p-4 text-left transition hover:bg-[#f4fbf9] ${selectedParish?.id === parish.id ? "bg-[#f4fbf9]" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-[#081828]">{parish.name}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">{placeLine(parish) || "Address not available"}</div>
                      </div>
                      {parish.distanceKm !== undefined ? <div className="shrink-0 text-sm font-black text-[#0f766e]">{formatDistance(parish.distanceKm)}</div> : null}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-5 text-sm font-bold text-slate-500">No approved parish matches this search.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-[#0f766e]">{value || "--"}</div>
      <div className="text-sm font-bold text-slate-600">{label}</div>
    </div>
  );
}
