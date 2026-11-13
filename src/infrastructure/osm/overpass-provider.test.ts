import { describe, expect, it, vi } from "vitest";
import { BUSINESS_CATEGORIES } from "@/shared/config/business-categories";
import { OverpassProvider } from "./overpass-provider";

describe("OverpassProvider", () => {
  it("normalizes a successful Overpass response and uses cache on second call", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "node",
              id: 99,
              lat: -12.12,
              lon: -77.03,
              tags: { name: "Demo Café", amenity: "cafe" },
            },
          ],
        }),
      });

    const provider = new OverpassProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      endpoints: ["https://example.test/interpreter"],
      cacheTtlMs: 60_000,
    });

    const input = {
      center: { latitude: -12.12, longitude: -77.03 },
      radiusKm: 1,
      categories: BUSINESS_CATEGORIES.filter((c) => c.id === "cafes"),
    };

    const first = await provider.search(input);
    const second = await provider.search(input);

    expect(first.businesses).toHaveLength(1);
    expect(first.businesses[0]?.name).toBe("Demo Café");
    expect(first.attribution).toContain("OpenStreetMap");
    expect(second.businesses).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
