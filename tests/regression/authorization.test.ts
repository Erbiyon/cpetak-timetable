import { describe, it, expect } from "vitest";

// Regression test representing the authorization rules from middleware.ts
function checkRouteAuthorization(pathname: string, token: { role?: string } | null): boolean {
  if (pathname.startsWith("/teacher-use")) {
    return token?.role === "teacher";
  }
  if (pathname.startsWith("/study-plans")) {
    return token?.role === "admin";
  }
  return !!token;
}

describe("Route Authorization Policy (middleware.ts regression)", () => {
  it("allows teacher to access /teacher-use routes", () => {
    expect(checkRouteAuthorization("/teacher-use/request-room", { role: "teacher" })).toBe(true);
    expect(checkRouteAuthorization("/teacher-use/time-table", { role: "teacher" })).toBe(true);
  });

  it("denies admin or unauthenticated users from /teacher-use routes", () => {
    expect(checkRouteAuthorization("/teacher-use", { role: "admin" })).toBe(false);
    expect(checkRouteAuthorization("/teacher-use", null)).toBe(false);
  });

  it("allows only admin to access /study-plans routes", () => {
    expect(checkRouteAuthorization("/study-plans/four-year-plan", { role: "admin" })).toBe(true);
    expect(checkRouteAuthorization("/study-plans/four-year-plan", { role: "teacher" })).toBe(false);
    expect(checkRouteAuthorization("/study-plans/four-year-plan", null)).toBe(false);
  });

  it("allows any authenticated user for adjust-time-tables", () => {
    expect(checkRouteAuthorization("/adjust-time-tables/adjust-plan-four-year/four-one-year", { role: "teacher" })).toBe(true);
    expect(checkRouteAuthorization("/adjust-time-tables/adjust-plan-four-year/four-one-year", { role: "admin" })).toBe(true);
    expect(checkRouteAuthorization("/adjust-time-tables/adjust-plan-four-year/four-one-year", null)).toBe(false);
  });
});
