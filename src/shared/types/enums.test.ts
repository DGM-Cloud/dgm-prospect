import { describe, expect, it } from "vitest";
import { PROSPECT_STATUSES, USER_ROLES } from "./enums";

describe("shared enums", () => {
  it("includes required user roles", () => {
    expect(USER_ROLES).toEqual(["ADMIN", "MANAGER", "MEMBER"]);
  });

  it("includes discovery and conversion prospect statuses", () => {
    expect(PROSPECT_STATUSES).toContain("DISCOVERED");
    expect(PROSPECT_STATUSES).toContain("WON");
    expect(PROSPECT_STATUSES).toContain("LOST");
  });
});
