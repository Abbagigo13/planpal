/**
 * Real place lookup for PlanPal using free, keyless OpenStreetMap services.
 *
 *  - Nominatim  (geocoding + fallback place search): about 1 request per second,
 *               identifying User-Agent, cached.
 *  - Overpass   (places): public instances, short timeouts, cached. The public servers are
 *               often at capacity, so after a failure we skip them for a few minutes and
 *               use Nominatim place search instead.
 *
 * OpenStreetMap has no prices, ratings, opening-hour guarantees or event listings,
 * so this module never invents them. Callers show costs as estimates and
 * availability as "unknown".
 *
 * Map data © OpenStreetMap contributors (ODbL).
 */

export type PlaceKind = "viewpoint" | "park" | "restaurant" | "cafe" | "theatre" | "cinema" | "arts_centre" | "bar" | "pub" | "nightclub";

export type Place = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  cuisine: string | null;
  area: string | null;
  sourceUrl: string;
};

export type PlacesSelection = {
  walk: Place | null;
  dinner: Place | null;
  encore: Place | null;
  /** Straight-line distances in km: centre to walk, walk to dinner, dinner to encore. */
  legsKm: { toWalk: number | null; toDinner: number | null; toEncore: number | null };
};

export type PlacesLookup =
  | { status: "disabled" }
  | { status: "unavailable"; reason: string }
  | { status: "ok"; selection: PlacesSelection; locationLabel: string; source: "overpass" | "nominatim" };

export type PlacesInput = { location: string; vibe: string };

export type PlacesOptions = {
  enabled?: boolean;
  fetchFn?: typeof fetch;
};

const USER_AGENT = "PlanPal/1.0 (+https://github.com/Abbagigo13/planpal)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URLS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const OVERPASS_TIMEOUT_MS = 5000;
const MAX_HOP_KM = 2.5;
const OVERPASS_COOLDOWN_MS = 5 * 60 * 1000;
const NOMINATIM_SEARCH_BOX_DEG = 0.06;
const NOMINATIM_CATEGORIES = ["park", "restaurant", "bar", "theatre"] as const;
const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000;
const PLACES_TTL_MS = 60 * 60 * 1000;
const NEAR_RADIUS_M = 4000;
const WIDE_RADIUS_M = 12000;

type Coordinates = { lat: number; lon: number; label: string };
type CacheEntry<T> = { value: T; expiresAt: number };

const geocodeCache = new Map<string, CacheEntry<Coordinates>>();
const placesCache = new Map<string, CacheEntry<Place[]>>();
let lastNominatimCall = 0;
let nominatimQueue: Promise<void> = Promise.resolve();
let overpassDownUntil = 0;

export function clearPlacesCacheForTests() {
  geocodeCache.clear();
  placesCache.clear();
  lastNominatimCall = 0;
  nominatimQueue = Promise.resolve();
  overpassDownUntil = 0;
}

/** Keeps us at or under 1 Nominatim request per second, even for concurrent callers. */
function throttleNominatim() {
  const run = nominatimQueue.then(async () => {
    const interval = process.env.VITEST ? 0 : NOMINATIM_MIN_INTERVAL_MS;
    const wait = lastNominatimCall + interval - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastNominatimCall = Date.now();
  });
  nominatimQueue = run.catch(() => undefined);
  return run;
}

function placesEnabled(explicit?: boolean) {
  if (explicit !== undefined) return explicit;
  const flag = process.env.PLANPAL_PLACES_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.VITEST;
}

function cleanText(value: string | undefined, max = 80) {
  if (!value) return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough, clearly-labelled travel estimate from a straight-line distance. */
export function describeTravel(km: number | null) {
  if (km === null || !Number.isFinite(km)) return "";
  if (km < 0.15) return "right next door";
  if (km <= 1.5) {
    const minutes = Math.max(2, Math.round(((km * 1.3) / 4.8) * 60));
    return `about ${minutes} min on foot (rough estimate)`;
  }
  const minutes = Math.max(5, Math.round(((km * 1.4) / 25) * 60));
  return `about ${minutes} min by car (rough estimate)`;
}

async function geocode(location: string, fetchFn: typeof fetch): Promise<Coordinates | null> {
  const key = location.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  await throttleNominatim();

  const url = `${NOMINATIM_URL}?${new URLSearchParams({ q: location, format: "jsonv2", limit: "1" })}`;
  const response = await fetchFn(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`geocoding_http_${response.status}`);
  const rows = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
  const first = rows[0];
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const value = { lat, lon, label: cleanText(first.display_name, 120) || location };
  geocodeCache.set(key, { value, expiresAt: Date.now() + GEOCODE_TTL_MS });
  return value;
}

function buildQuery(center: Coordinates, radius: number) {
  const around = `(around:${radius},${center.lat},${center.lon})`;
  return `[out:json][timeout:8];
(nwr${around}["tourism"="viewpoint"]["name"];nwr${around}["leisure"~"^(park|garden|marina)$"]["name"];)->.walk;
.walk out center tags 40;
(nwr${around}["amenity"~"^(restaurant|cafe)$"]["name"];)->.eat;
.eat out center tags 60;
(nwr${around}["amenity"~"^(theatre|cinema|arts_centre|bar|pub|nightclub)$"]["name"];)->.fun;
.fun out center tags 40;`;
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function classify(tags: Record<string, string>): PlaceKind | null {
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.leisure === "marina") return "park";
  const amenity = tags.amenity;
  if (amenity === "restaurant" || amenity === "cafe" || amenity === "theatre" || amenity === "cinema" || amenity === "arts_centre" || amenity === "bar" || amenity === "pub" || amenity === "nightclub") {
    return amenity;
  }
  return null;
}

function toPlace(element: OverpassElement): Place | null {
  const tags = element.tags ?? {};
  const name = cleanText(tags.name || tags["name:en"]);
  const kind = classify(tags);
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!name || !kind || lat === undefined || lon === undefined) return null;
  const cuisine = cleanText(tags.cuisine, 40).replace(/[;_]/g, ", ") || null;
  const area = cleanText(tags["addr:suburb"] || tags["addr:neighbourhood"] || tags["addr:street"] || tags["addr:city"], 60) || null;
  return {
    osmType: element.type,
    osmId: element.id,
    name,
    kind,
    lat,
    lon,
    cuisine,
    area,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

async function queryOverpass(center: Coordinates, radius: number, fetchFn: typeof fetch): Promise<Place[]> {
  const cacheKey = `${center.lat.toFixed(2)},${center.lon.toFixed(2)},${radius}`;
  const cached = placesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const body = new URLSearchParams({ data: buildQuery(center, radius) }).toString();
  let lastError = "overpass_unreachable";
  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetchFn(endpoint, {
        method: "POST",
        headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });
      if (!response.ok) {
        lastError = `overpass_http_${response.status}`;
        continue;
      }
      const json = (await response.json()) as { elements?: OverpassElement[] };
      const seen = new Set<string>();
      const places: Place[] = [];
      for (const element of json.elements ?? []) {
        const place = toPlace(element);
        const id = `${element.type}/${element.id}`;
        if (!place || seen.has(id)) continue;
        seen.add(id);
        places.push(place);
      }
      placesCache.set(cacheKey, { value: places, expiresAt: Date.now() + PLACES_TTL_MS });
      return places;
    } catch (error) {
      lastError = error instanceof Error ? `overpass_${error.name}` : "overpass_error";
    }
  }
  throw new Error(lastError);
}

type NominatimRow = {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
};

/** Fallback place search through Nominatim (about 1 request per second, cached). */
async function queryNominatimPlaces(center: Coordinates, fetchFn: typeof fetch): Promise<Place[]> {
  const cacheKey = `nom:${center.lat.toFixed(2)},${center.lon.toFixed(2)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const box = NOMINATIM_SEARCH_BOX_DEG;
  const viewbox = `${center.lon - box},${center.lat + box},${center.lon + box},${center.lat - box}`;
  const seen = new Set<string>();
  const places: Place[] = [];
  let failures = 0;

  for (const category of NOMINATIM_CATEGORIES) {
    try {
      await throttleNominatim();
      const url = `${NOMINATIM_URL}?${new URLSearchParams({
        q: category,
        format: "jsonv2",
        limit: "20",
        viewbox,
        bounded: "1",
        addressdetails: "1",
        extratags: "1",
      })}`;
      const response = await fetchFn(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) {
        failures += 1;
        continue;
      }
      const rows = (await response.json()) as NominatimRow[];
      for (const row of rows) {
        const osmType = row.osm_type === "node" || row.osm_type === "way" || row.osm_type === "relation" ? row.osm_type : null;
        const tags: Record<string, string> = { name: row.name ?? "" };
        if (row.category && row.type) tags[row.category] = row.type;
        if (row.extratags?.cuisine) tags.cuisine = row.extratags.cuisine;
        const address = row.address ?? {};
        const area = address.suburb || address.neighbourhood || address.road || address.city;
        if (area) tags["addr:suburb"] = area;
        const place = osmType && row.osm_id !== undefined
          ? toPlace({ type: osmType, id: row.osm_id, lat: Number(row.lat), lon: Number(row.lon), tags })
          : null;
        const id = `${osmType}/${row.osm_id}`;
        if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon) || seen.has(id)) continue;
        seen.add(id);
        places.push(place);
      }
    } catch {
      failures += 1;
    }
  }

  if (places.length === 0 && failures > 0) throw new Error("nominatim_unavailable");
  placesCache.set(cacheKey, { value: places, expiresAt: Date.now() + PLACES_TTL_MS });
  return places;
}

function pickNearest(
  candidates: Place[],
  anchor: { lat: number; lon: number },
  rank: (place: Place) => number,
  exclude: Set<string>,
  preferWithinKm = Infinity,
) {
  const consider = (limitKm: number) => {
    let best: { place: Place; rank: number; km: number } | null = null;
    for (const place of candidates) {
      const id = `${place.osmType}/${place.osmId}`;
      if (exclude.has(id)) continue;
      const r = rank(place);
      if (r < 0) continue;
      const km = haversineKm(anchor, place);
      if (km > limitKm) continue;
      if (!best || r < best.rank || (r === best.rank && km < best.km)) best = { place, rank: r, km };
    }
    return best;
  };
  // Prefer a stop close to the previous one; only go farther if nothing is close.
  return consider(preferWithinKm) ?? consider(Infinity);
}

function encoreOrder(vibe: string): PlaceKind[] {
  const text = vibe.toLowerCase();
  if (text.includes("playful") || text.includes("social")) return ["bar", "pub", "nightclub", "cinema", "theatre", "arts_centre"];
  if (text.includes("cozy") || text.includes("low-key")) return ["arts_centre", "cinema", "pub", "bar", "theatre", "nightclub"];
  return ["arts_centre", "theatre", "cinema", "bar", "pub", "nightclub"];
}

export function selectStops(places: Place[], center: { lat: number; lon: number }, vibe: string): PlacesSelection {
  const used = new Set<string>();
  const mark = (place: Place | null) => place && used.add(`${place.osmType}/${place.osmId}`);

  const walkBest = pickNearest(places, center, (p) => (p.kind === "viewpoint" ? 0 : p.kind === "park" ? 1 : -1), used);
  const walk = walkBest?.place ?? null;
  mark(walk);

  const dinnerAnchor = walk ?? center;
  const dinnerBest = pickNearest(
    places,
    dinnerAnchor,
    (p) => (p.kind === "restaurant" ? (p.cuisine ? 0 : 1) : p.kind === "cafe" ? 2 : -1),
    used,
    MAX_HOP_KM,
  );
  const dinner = dinnerBest?.place ?? null;
  mark(dinner);

  const order = encoreOrder(vibe);
  const encoreAnchor = dinner ?? walk ?? center;
  const encoreBest = pickNearest(places, encoreAnchor, (p) => order.indexOf(p.kind), used, MAX_HOP_KM);
  const encore = encoreBest?.place ?? null;
  mark(encore);

  return {
    walk,
    dinner,
    encore,
    legsKm: {
      toWalk: walk ? haversineKm(center, walk) : null,
      toDinner: walk && dinner ? haversineKm(walk, dinner) : null,
      toEncore: dinner && encore ? haversineKm(dinner, encore) : null,
    },
  };
}

function countStops(selection: PlacesSelection) {
  return [selection.walk, selection.dinner, selection.encore].filter(Boolean).length;
}

function hasAnyStop(selection: PlacesSelection) {
  return countStops(selection) > 0;
}

function missingCategory(selection: PlacesSelection) {
  return !selection.walk || !selection.dinner || !selection.encore;
}

/**
 * Finds a real walk, dinner and encore near the requested location.
 * Never throws: failures become { status: "unavailable" } so the caller can
 * decide what to show (and avoid charging for data it could not deliver).
 */
export async function findPlaces(input: PlacesInput, options: PlacesOptions = {}): Promise<PlacesLookup> {
  if (!placesEnabled(options.enabled)) return { status: "disabled" };
  const fetchFn = options.fetchFn ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));
  const location = cleanText(input.location, 120);
  if (!location) return { status: "unavailable", reason: "location_missing" };

  try {
    const center = await geocode(location, fetchFn);
    if (!center) return { status: "unavailable", reason: "location_not_found" };

    // 1. Overpass (richer data) unless it failed recently.
    let overpassError: string | null = null;
    if (Date.now() >= overpassDownUntil) {
      try {
        const nearby = await queryOverpass(center, NEAR_RADIUS_M, fetchFn);
        let selection = selectStops(nearby, center, input.vibe);
        if (missingCategory(selection)) {
          // Search wider once. If that fails, keep whatever the nearby search found.
          try {
            const wider = await queryOverpass(center, WIDE_RADIUS_M, fetchFn);
            const widerSelection = selectStops(wider, center, input.vibe);
            if (countStops(widerSelection) > countStops(selection)) selection = widerSelection;
          } catch {
            // keep the nearby selection
          }
        }
        if (hasAnyStop(selection)) return { status: "ok", selection, locationLabel: center.label, source: "overpass" };
        overpassError = "no_places_found";
      } catch (error) {
        overpassError = error instanceof Error ? error.message : "overpass_error";
        overpassDownUntil = Date.now() + OVERPASS_COOLDOWN_MS;
      }
    } else {
      overpassError = "overpass_cooling_down";
    }

    // 2. Fallback: Nominatim place search.
    try {
      const found = await queryNominatimPlaces(center, fetchFn);
      const selection = selectStops(found, center, input.vibe);
      if (hasAnyStop(selection)) return { status: "ok", selection, locationLabel: center.label, source: "nominatim" };
    } catch {
      // fall through to unavailable
    }
    return { status: "unavailable", reason: overpassError ?? "no_places_found" };
  } catch (error) {
    return { status: "unavailable", reason: error instanceof Error ? error.message : "places_error" };
  }
}