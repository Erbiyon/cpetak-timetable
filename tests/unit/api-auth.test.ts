import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireAdmin, requireTeacherOrAdmin } from "@/lib/api-auth";
import { getServerSession } from "next-auth/next";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

describe("Server-Side Authorization Boundary (lib/api-auth.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("returns 401 when no session exists", async () => {
      (getServerSession as any).mockResolvedValueOnce(null);

      const result = await requireAuth();
      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(401);
        const data = await result.response.json();
        expect(data.error).toContain("Unauthorized");
      }
    });

    it("returns authorized: true with user data when session exists", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: { id: "1", name: "สมศรี", role: "teacher", teacherId: "T001" },
      });

      const result = await requireAuth();
      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.user.name).toBe("สมศรี");
        expect(result.user.role).toBe("teacher");
      }
    });
  });

  describe("requireRole & requireAdmin", () => {
    it("rejects teacher role for Admin-only endpoint with 403 Forbidden", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: { id: "1", name: "อาจารย์ทดสอบ", role: "teacher" },
      });

      const result = await requireAdmin();
      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(403);
        const data = await result.response.json();
        expect(data.error).toContain("Forbidden");
      }
    });

    it("permits admin role for Admin-only endpoint", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: { id: "admin", name: "Admin User", role: "admin" },
      });

      const result = await requireAdmin();
      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.user.role).toBe("admin");
      }
    });

    it("permits both teacher and admin for requireTeacherOrAdmin", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: { id: "2", role: "teacher" },
      });

      const teacherResult = await requireTeacherOrAdmin();
      expect(teacherResult.authorized).toBe(true);

      (getServerSession as any).mockResolvedValueOnce({
        user: { id: "admin", role: "admin" },
      });

      const adminResult = await requireTeacherOrAdmin();
      expect(adminResult.authorized).toBe(true);
    });
  });
});
