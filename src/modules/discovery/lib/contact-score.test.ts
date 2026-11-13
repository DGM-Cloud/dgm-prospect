import { describe, expect, it } from "vitest";
import { computeContactScore } from "./contact-score";

describe("computeContactScore", () => {
  it("scores full contact profile highest", () => {
    expect(
      computeContactScore({
        phone: "+511111111",
        website: "https://example.com",
        address: "Calle 1, Miraflores",
        socials: ["https://instagram.com/x"],
        email: "a@b.com",
      }),
    ).toBe(100);
  });

  it("prioritizes phone over website", () => {
    const withPhone = computeContactScore({ phone: "123" });
    const withWeb = computeContactScore({ website: "https://x.com" });
    expect(withPhone).toBeGreaterThan(withWeb);
  });
});
