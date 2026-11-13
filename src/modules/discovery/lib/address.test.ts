import { describe, expect, it } from "vitest";
import { buildAddressParts, googleMapsUrlFor } from "./address";

describe("buildAddressParts", () => {
  it("formats street, locality and postcode", () => {
    expect(
      buildAddressParts({
        street: "Av. Angamos 100",
        locality: "Miraflores",
        postcode: "15074",
      }),
    ).toEqual({
      street: "Av. Angamos 100",
      locality: "Miraflores",
      postcode: "15074",
      formatted: "Av. Angamos 100, Miraflores, 15074",
    });
  });
});

describe("googleMapsUrlFor", () => {
  it("builds a search url", () => {
    const url = googleMapsUrlFor({
      latitude: -12.12,
      longitude: -77.03,
      label: "Lucio Cafe",
    });
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Lucio");
  });
});
