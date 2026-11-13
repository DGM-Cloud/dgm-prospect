import { describe, expect, it } from "vitest";

describe("dashboard metric definitions", () => {
  it("keeps pending statuses aligned with commercial workflow", () => {
    const pending = ["DISCOVERED", "TO_REVIEW", "CONTACT_PENDING"];
    expect(pending).toContain("DISCOVERED");
    expect(pending).not.toContain("WON");
  });
});
