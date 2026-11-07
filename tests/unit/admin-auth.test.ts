import { describe, it, expect, vi } from "vitest";

describe("Admin Credential Security & Fail-Closed Enforcement (lib/auth.ts)", () => {
  it("authenticates admin in development mode using default fallback credentials when env not set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;

    const { authOptions } = await import("@/lib/auth");
    const adminProvider: any = authOptions.providers.find(
      (p: any) => p.options?.id === "admin-login"
    );
    const adminAuthorize = adminProvider.options.authorize;

    const user = await adminAuthorize({
      adminId: "admin",
      password: "admin123",
    });

    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });

  it("fails closed in production mode when ADMIN_USERNAME or ADMIN_PASSWORD are not set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;

    const { authOptions } = await import("@/lib/auth");
    const adminProvider: any = authOptions.providers.find(
      (p: any) => p.options?.id === "admin-login"
    );
    const adminAuthorize = adminProvider.options.authorize;

    const user = await adminAuthorize({
      adminId: "admin",
      password: "admin123",
    });

    expect(user).toBeNull();
  });

  it("authenticates admin in production when correct env credentials are provided", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_USERNAME", "prod-admin");
    vi.stubEnv("ADMIN_PASSWORD", "StrongSecurePassword!2026");

    const { authOptions } = await import("@/lib/auth");
    const adminProvider: any = authOptions.providers.find(
      (p: any) => p.options?.id === "admin-login"
    );
    const adminAuthorize = adminProvider.options.authorize;

    const user = await adminAuthorize({
      adminId: "prod-admin",
      password: "StrongSecurePassword!2026",
    });

    expect(user).not.toBeNull();
    expect(user?.id).toBe("admin");
    expect(user?.role).toBe("admin");
  });

  it("rejects admin login when incorrect password is provided", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_USERNAME", "prod-admin");
    vi.stubEnv("ADMIN_PASSWORD", "StrongSecurePassword!2026");

    const { authOptions } = await import("@/lib/auth");
    const adminProvider: any = authOptions.providers.find(
      (p: any) => p.options?.id === "admin-login"
    );
    const adminAuthorize = adminProvider.options.authorize;

    const user = await adminAuthorize({
      adminId: "prod-admin",
      password: "WrongPassword",
    });

    expect(user).toBeNull();
  });
});
