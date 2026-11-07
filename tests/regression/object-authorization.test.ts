import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/timetable/route";
import { DELETE } from "@/app/api/timetable/[id]/route";
import { prisma } from "@/lib/prisma";
import * as apiAuth from "@/lib/api-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coTeaching_tb: {
      findFirst: vi.fn(),
    },
    timetable_tb: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    plans_tb: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    teacher_tb: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Object-Level Authorization: Timetable Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/timetable (Teacher Scope)", () => {
    it("rejects Teacher A attempting to schedule for Teacher B (different teacherId in body)", async () => {
      // Authenticated as Teacher A (TCPE01)
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValueOnce({
        authorized: true,
        user: { id: "1", role: "teacher", teacherId: "TCPE01" },
      });

      // Teacher A's internal database ID is 10
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce({
        id: 10,
        tId: "TCPE01",
      });

      // Request attempts to schedule with teacherId: 20 (Teacher B)
      const req = new Request("http://localhost:3000/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: 1,
          teacherId: 20, // Belongs to someone else!
          termYear: "1/2567",
          yearLevel: "1",
          planType: "FOUR_YEAR",
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("คุณไม่มีสิทธิ์จัดตารางสอนให้อาจารย์ท่านอื่น");

      // Verify ZERO database writes occurred
      expect(prisma.timetable_tb.create).not.toHaveBeenCalled();
    });

    it("rejects Teacher A attempting to schedule a plan belonging to Teacher B", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValueOnce({
        authorized: true,
        user: { id: "1", role: "teacher", teacherId: "TCPE01" },
      });

      // Teacher A's internal database ID is 10
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce({
        id: 10,
        tId: "TCPE01",
      });

      // Plan 99 actually belongs to teacherId: 999 (Teacher B)
      (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
        id: 99,
        teacherId: 999,
      });

      const req = new Request("http://localhost:3000/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: 99,
          teacherId: 10,
          termYear: "1/2567",
          yearLevel: "1",
          planType: "FOUR_YEAR",
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("วิชานี้เป็นของอาจารย์ท่านอื่น");
      expect(prisma.timetable_tb.create).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/timetable/[id] (Teacher Scope)", () => {
    it("rejects Teacher A attempting to delete timetable for plan belonging to Teacher B", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValueOnce({
        authorized: true,
        user: { id: "1", role: "teacher", teacherId: "TCPE01" },
      });

      // Plan 5 belongs to Teacher B (id: 20)
      (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
        id: 5,
        teacherId: 20,
      });

      // Teacher A's database ID is 10
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce({
        id: 10,
        tId: "TCPE01",
      });

      const req = new Request("http://localhost:3000/api/timetable/5", {
        method: "DELETE",
      });

      const res = await DELETE(req as any, {
        params: Promise.resolve({ id: "5" }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("คุณไม่มีสิทธิ์ลบตารางสอนของอาจารย์ท่านอื่น");
      expect(prisma.timetable_tb.deleteMany).not.toHaveBeenCalled();
    });

    it("allows Admin to delete any timetable plan without ownership restriction", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValueOnce({
        authorized: true,
        user: { id: "admin", role: "admin" },
      });

      // Plan belongs to teacher 20
      (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
        id: 5,
        teacherId: 20,
        planType: "FOUR_YEAR",
      });

      (prisma.coTeaching_tb.findFirst as any).mockResolvedValueOnce(null);
      (prisma.timetable_tb.deleteMany as any).mockResolvedValueOnce({ count: 1 });

      const req = new Request("http://localhost:3000/api/timetable/5", {
        method: "DELETE",
      });

      const res = await DELETE(req as any, {
        params: Promise.resolve({ id: "5" }),
      });

      expect(res.status).toBe(200);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalled();
    });
  });
});

