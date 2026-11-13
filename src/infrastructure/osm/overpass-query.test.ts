import { describe, expect, it } from "vitest";
import { BUSINESS_CATEGORIES } from "@/shared/config/business-categories";
import {
  buildAddress,
  buildOverpassQuery,
  cacheKey,
  resolveCategoryLabel,
} from "./overpass-query";

describe("buildOverpassQuery", () => {
  it("includes around filter for selected categories", () => {
    const restaurants = BUSINESS_CATEGORIES.filter((c) => c.id === "restaurants");
    const query = buildOverpassQuery({
      center: { latitude: -12.12, longitude: -77.03 },
      radiusKm: 1,
      categories: restaurants,
    });

    expect(query).toContain('node["amenity"="restaurant"](around:1000,-12.12,-77.03)');
    expect(query).toContain('way["amenity"="restaurant"](around:1000,-12.12,-77.03)');
    expect(query).toContain("out center tags");
  });
});

describe("resolveCategoryLabel", () => {
  it("maps osm tags to DGM category labels", () => {
    expect(
      resolveCategoryLabel({ amenity: "cafe" }, BUSINESS_CATEGORIES),
    ).toBe("Cafeterías");
  });
});

describe("buildAddress", () => {
  it("composes address parts when present", () => {
    expect(
      buildAddress({
        "addr:street": "Av. Larco",
        "addr:housenumber": "123",
        "addr:city": "Miraflores",
      }),
    ).toBe("Av. Larco 123, Miraflores");
  });
});

describe("cacheKey", () => {
  it("is stable for the same search", () => {
    const input = {
      center: { latitude: -12.1211, longitude: -77.0299 },
      radiusKm: 3,
      categories: BUSINESS_CATEGORIES.filter((c) => c.id === "dental"),
    };
    expect(cacheKey(input)).toBe(cacheKey(input));
  });
});
