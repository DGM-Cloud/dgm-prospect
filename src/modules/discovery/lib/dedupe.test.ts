import { describe, expect, it } from "vitest";
import { groupDuplicates, normalizeBusinessName } from "./dedupe";

describe("normalizeBusinessName", () => {
  it("strips accents and filler words", () => {
    expect(normalizeBusinessName("Café Lucio")).toBe("lucio");
  });
});

describe("groupDuplicates", () => {
  it("groups nearby similar names and picks highest score as primary", () => {
    const groups = groupDuplicates([
      {
        key: "overture-1",
        name: "Lucio Cafe",
        latitude: -12.1211,
        longitude: -77.0299,
        contactScore: 40,
        source: "overture",
      },
      {
        key: "node-2",
        name: "Lucio Café",
        latitude: -12.12115,
        longitude: -77.02995,
        contactScore: 85,
        source: "overpass",
      },
      {
        key: "overture-3",
        name: "Otro Local",
        latitude: -12.13,
        longitude: -77.04,
        contactScore: 20,
        source: "overture",
      },
    ]);

    expect(groups.get("node-2")?.isPrimary).toBe(true);
    expect(groups.get("overture-1")?.isPrimary).toBe(false);
    expect(groups.get("overture-1")?.groupId).toBeTruthy();
    expect(groups.get("overture-3")?.groupId).toBe("");
  });
});
