import { describe, expect, it } from "vitest";
import { BUSINESS_CATEGORIES } from "@/shared/config/business-categories";
import { normalizeOverpassElements } from "./overpass-normalize";

describe("normalizeOverpassElements", () => {
  it("normalizes nodes and way centers", () => {
    const result = normalizeOverpassElements(
      [
        {
          type: "node",
          id: 1,
          lat: -12.1,
          lon: -77.0,
          tags: { name: "Café Sol", amenity: "cafe" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: -12.2, lon: -77.1 },
          tags: { name: "Vet Norte", amenity: "veterinary" },
        },
        {
          type: "node",
          id: 3,
          tags: { name: "Sin coords", amenity: "cafe" },
        },
      ],
      BUSINESS_CATEGORIES,
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Café Sol");
    expect(result[0]?.category).toBe("Cafeterías");
    expect(result[1]?.osmType).toBe("way");
    expect(result[1]?.category).toBe("Veterinarias");
  });
});
