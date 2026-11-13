import { describe, expect, it } from "vitest";
import { AuthError } from "./auth-service";

describe("AuthError", () => {
  it("defaults to 401", () => {
    const error = new AuthError("Authentication required");
    expect(error.status).toBe(401);
    expect(error.name).toBe("AuthError");
  });

  it("supports 403 for role failures", () => {
    const error = new AuthError("Insufficient permissions", 403);
    expect(error.status).toBe(403);
  });
});
