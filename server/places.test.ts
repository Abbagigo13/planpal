import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPlacesCacheForTests, describeTravel, findPlaces, haversineKm, selectStops } from "./services/places";
import { createPlan } from "./services/planpal";

const originalEnv = {
  status: process.env.PLANPAL_DEMO_AGENT_STATUS,
  live: process.env.ENABLE_LIVE_CELO_TX,
  db: process.env.DATABASE_URL,
  places: process.env.PLANPAL_PLACES_ENABLED,
};

const nominatimOk = [{ lat: "6.5244", lon: "3.3792", display_name: "Lagos, Nigeria" }];

const overpassOk = {
  elements: [
    { type: "node", id: 1, lat: 6.526, lon: 3.381, tags: { name: "Bar Beach Lookout", tourism: "viewpoint" } },
    { type: "node", id: 2, lat: 6.53, lon: 3.385, tags: { name: "Big Hall", amenity: "restaurant", cuisine: "nigerian;african", "addr:suburb": "Victoria Island" } },
    { type: "node", id: 3, lat: 6.529, lon: 3.384, tags: { name: "Plain Bistro", amenity: "restaurant" } },
    { type: "way", id: 4, center: { lat: 6.532, lon: 3.386 }, tags: { name: "Art Space", amenity: "arts_centre" } },
    { type: "node", id: 5, lat: 6.531, lon: 3.386, tags: { name: "Late Bar", amenity: "bar" } },
    { type: "node", id: 6, lat: 6.5, lon: 3.3, tags: { amenity: "restaurant" } },
  ],
};

function mockFetch(handlers: { nominatim?: (url: URL) => Response; overpass?: () => Response }) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("nominatim")) return (handlers.nominatim ?? (() => Response.json(nominatimOk)))(new URL(url));
    if (url.includes("overpass")) return (handlers.overpass ?? (() => Response.json(overpassOk)))();
    throw new Error(`unexpected url ${url}`);
  }) as unknown as typeof fetch;
}

// Nominatim answers the first request (geocoding "Lagos") and later category searches.
function nominatimWithPois(url: URL) {
  const q = url.searchParams.get("q");
  if (q === "Lagos") return Response.json(nominatimOk);
  const rows: Record<string, unknown[]> = {
    park: [{ osm_type: "way", osm_id: 11, lat: "6.527", lon: "3.38", name: "Freedom Park", category: "leisure", type: "park", address: { suburb: "Lagos Island" } }],
    restaurant: [{ osm_type: "node", osm_id: 12, lat: "6.53", lon: "3.384", name: "Mama Put", category: "amenity", type: "restaurant", extratags: { cuisine: "nigerian" } }],
    bar: [{ osm_type: "node", osm_id: 13, lat: "6.531", lon: "3.385", name: "Rooftop Bar", category: "amenity", type: "bar" }],
    theatre: [{ osm_type: "node", osm_id: 14, lat: "6.532", lon: "3.386", name: "Terra Kulture", category: "amenity", type: "theatre" }],
  };
  return Response.json(rows[q ?? ""] ?? []);
}

beforeEach(() => {
  clearPlacesCacheForTests();
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of [
    ["PLANPAL_DEMO_AGENT_STATUS", originalEnv.status],
    ["ENABLE_LIVE_CELO_TX", originalEnv.live],
    ["DATABASE_URL", originalEnv.db],
    ["PLANPAL_PLACES_ENABLED", originalEnv.places],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("real place lookup (OpenStreetMap)", () => {
  it("is disabled under tests unless explicitly enabled", async () => {
    const result = await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" });
    expect(result.status).toBe("disabled");
  });

  it("picks a walk, dinner and encore from real results and ignores unnamed places", async () => {
    const result = await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn: mockFetch({}) });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.selection.walk?.name).toBe("Bar Beach Lookout");
    // Restaurants that list a cuisine are preferred over plain ones.
    expect(result.selection.dinner?.name).toBe("Big Hall");
    expect(result.selection.dinner?.cuisine).toBe("nigerian, african");
    // Relaxed vibe prefers an arts centre over a bar.
    expect(result.selection.encore?.name).toBe("Art Space");
    expect(result.selection.encore?.sourceUrl).toBe("https://www.openstreetmap.org/way/4");
  });

  it("prefers a bar for a playful vibe", async () => {
    const result = await findPlaces({ location: "Lagos", vibe: "Playful & social" }, { enabled: true, fetchFn: mockFetch({}) });
    expect(result.status === "ok" && result.selection.encore?.name).toBe("Late Bar");
  });

  it("caches geocoding and place searches", async () => {
    const fetchFn = mockFetch({});
    await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn });
    const callsAfterFirst = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await findPlaces({ location: "lagos", vibe: "Playful & social" }, { enabled: true, fetchFn });
    expect((fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it("reports unavailable instead of inventing places when every service fails", async () => {
    const fetchFn = mockFetch({ overpass: () => new Response("busy", { status: 429 }) });
    const result = await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn });
    expect(result).toEqual({ status: "unavailable", reason: "overpass_http_429" });
  });

  it("falls back to Nominatim place search when Overpass is at capacity", async () => {
    const fetchFn = mockFetch({
      overpass: () => new Response("at capacity", { status: 502 }),
      nominatim: nominatimWithPois,
    });
    const result = await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.source).toBe("nominatim");
    expect(result.selection.walk?.name).toBe("Freedom Park");
    expect(result.selection.dinner?.name).toBe("Mama Put");
    expect(result.selection.dinner?.cuisine).toBe("nigerian");
    expect(result.selection.encore?.name).toBe("Terra Kulture");
    expect(result.selection.dinner?.sourceUrl).toBe("https://www.openstreetmap.org/node/12");
  });

  it("skips Overpass for a few minutes after it fails", async () => {
    const fetchFn = mockFetch({ overpass: () => new Response("at capacity", { status: 502 }), nominatim: nominatimWithPois });
    await findPlaces({ location: "Lagos", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn });
    const overpassCalls = () => (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([u]) => String(u).includes("overpass")).length;
    const before = overpassCalls();
    expect(before).toBeGreaterThan(0);
    await findPlaces({ location: "Lagos", vibe: "Playful & social" }, { enabled: true, fetchFn });
    expect(overpassCalls()).toBe(before);
  });

  it("reports an unknown location", async () => {
    const fetchFn = mockFetch({ nominatim: () => Response.json([]) });
    const result = await findPlaces({ location: "Nowhereville", vibe: "Relaxed & memorable" }, { enabled: true, fetchFn });
    expect(result).toEqual({ status: "unavailable", reason: "location_not_found" });
  });

  it("prefers a stop close to the previous one over a better-ranked far one", () => {
    const mk = (id: number, name: string, kind: "restaurant" | "theatre" | "bar", lat: number, lon: number) => ({
      osmType: "node" as const, osmId: id, name, kind, lat, lon, cuisine: null, area: null, sourceUrl: `https://www.openstreetmap.org/node/${id}`,
    });
    const selection = selectStops(
      [mk(1, "Near Dinner", "restaurant", 6.5, 3.3), mk(2, "Far Theatre", "theatre", 6.55, 3.35), mk(3, "Close Bar", "bar", 6.501, 3.301)],
      { lat: 6.5, lon: 3.3 },
      "Relaxed & memorable",
    );
    // A relaxed vibe ranks theatres first, but the theatre is about 7 km away.
    expect(selection.encore?.name).toBe("Close Bar");
  });

  it("keeps partial results when only some categories exist", () => {
    const selection = selectStops(
      [{ osmType: "node", osmId: 9, name: "Only Cafe", kind: "cafe", lat: 6.5, lon: 3.3, cuisine: null, area: null, sourceUrl: "x" }],
      { lat: 6.5, lon: 3.3 },
      "Relaxed & memorable",
    );
    expect(selection.walk).toBeNull();
    expect(selection.dinner?.name).toBe("Only Cafe");
    expect(selection.encore).toBeNull();
  });

  it("labels travel estimates honestly", () => {
    expect(describeTravel(0.8)).toContain("on foot (rough estimate)");
    expect(describeTravel(6)).toContain("by car (rough estimate)");
    expect(describeTravel(null)).toBe("");
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })).toBe(0);
  });
});

describe("planner with real places", () => {
  const input = { mission: "date_night" as const, location: "Lagos", dateTime: "Saturday 18:30", budgetCents: 6000, vibe: "Relaxed & memorable" };

  it("builds a premium plan from real places with source links and estimate labels", async () => {
    process.env.PLANPAL_DEMO_AGENT_STATUS = "verified";
    process.env.ENABLE_LIVE_CELO_TX = "false";
    process.env.PLANPAL_PLACES_ENABLED = "true";
    vi.stubGlobal("fetch", mockFetch({}));

    const plan = await createPlan(input);
    expect(plan.status).toBe("ready");
    expect(plan.items).toHaveLength(3);
    expect(plan.items[1].title).toBe("Dinner at Big Hall");
    expect(plan.items[1].link).toBe("https://www.openstreetmap.org/node/2");
    expect(plan.items[1].detail).toContain("estimate");
    expect(plan.items[1].detail).toContain("OpenStreetMap");
    expect(plan.items[1].costCents).toBe(2700);
    expect(plan.payment.status).toBe("settled");
  });

  it("does not charge when live data is unavailable", async () => {
    process.env.PLANPAL_DEMO_AGENT_STATUS = "verified";
    process.env.ENABLE_LIVE_CELO_TX = "false";
    process.env.PLANPAL_PLACES_ENABLED = "true";
    vi.stubGlobal("fetch", mockFetch({ overpass: () => new Response("down", { status: 503 }) }));

    const plan = await createPlan(input);
    expect(plan.status).toBe("limited");
    expect(plan.payment.status).toBe("skipped");
    expect(plan.payment.failureCode).toBe("live_data_unavailable");
    expect(plan.payment.transactionHash).toBeNull();
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].detail).toContain("did not charge");
  });
});