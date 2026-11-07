import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postSubject, PUT as putSubject } from "@/app/api/subject/route";
import {
  PATCH as patchSubjectId,
  DELETE as deleteSubjectId,
} from "@/app/api/subject/[id]/route";
import { POST as postSplit } from "@/app/api/subject/split/route";
import { POST as postMerge } from "@/app/api/subject/merge/route";
import {
  POST as postCoTeachingMerge,
} from "@/app/api/subject/co-teaching/merge/route";
import { PATCH as patchRoom } from "@/app/api/subject/[id]/room/route";
import { PATCH as patchTeacher } from "@/app/api/subject/[id]/teacher/route";
import { prisma } from "@/lib/prisma";
import * as apiAuth from "@/lib/api-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plans_tb: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    teacher_tb: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    timetable_tb: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    coTeaching_tb: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Subject Security & Authorization Boundary Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Anonymous Access Rejection (HTTP 401)", () => {
    it("POST /api/subject should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject", {
        method: "POST",
        body: JSON.stringify({ subjectCode: "CPE101" }),
      });
      const res = await postSubject(req);
      expect(res.status).toBe(401);
      expect(prisma.plans_tb.create).not.toHaveBeenCalled();
    });

    it("PUT /api/subject should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject", {
        method: "PUT",
        body: JSON.stringify({ id: 1, subjectCode: "CPE101" }),
      });
      const res = await putSubject(req);
      expect(res.status).toBe(401);
      expect(prisma.plans_tb.update).not.toHaveBeenCalled();
    });

    it("PATCH /api/subject/[id] should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject/10", {
        method: "PATCH",
        body: JSON.stringify({ section: "2" }),
      });
      const res = await patchSubjectId(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
      expect(prisma.plans_tb.update).not.toHaveBeenCalled();
    });

    it("DELETE /api/subject/[id] should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject/10", {
        method: "DELETE",
      });
      const res = await deleteSubjectId(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
      expect(prisma.plans_tb.delete).not.toHaveBeenCalled();
    });

    it("POST /api/subject/split should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new Request("http://localhost:3000/api/subject/split", {
        method: "POST",
        body: JSON.stringify({ subjectId: 10 }),
      });
      const res = await postSplit(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/subject/merge should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new Request("http://localhost:3000/api/subject/merge", {
        method: "POST",
        body: JSON.stringify({ subjectId: 10 }),
      });
      const res = await postMerge(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/subject/co-teaching/merge should reject anonymous user", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject/co-teaching/merge", {
        method: "POST",
        body: JSON.stringify({ groupKey: "CPE101-1/2567", planIds: [1, 2] }),
      });
      const res = await postCoTeachingMerge(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Role & Object-Level Authorization (Teacher vs Admin)", () => {
    it("DELETE /api/subject/[id] should reject Teacher attempting to delete subject (HTTP 403)", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject/10", {
        method: "DELETE",
      });
      const res = await deleteSubjectId(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(403);
      expect(prisma.plans_tb.delete).not.toHaveBeenCalled();
    });

    it("PATCH /api/subject/[id] should reject Teacher updating another teacher's subject (HTTP 403)", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValue({
        authorized: true,
        user: { id: "100", role: "teacher", teacherId: "TCPE01" },
      });

      // Subject belongs to teacherId 200
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 10,
        subjectCode: "CPE101",
        teacherId: 200,
      } as any);

      // Authenticated teacher is teacherId 100
      vi.mocked(prisma.teacher_tb.findFirst).mockResolvedValue({
        id: 100,
        tId: "TCPE01",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/subject/10", {
        method: "PATCH",
        body: JSON.stringify({ section: "2" }),
      });

      const res = await patchSubjectId(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden: Ownership required");
      expect(prisma.plans_tb.update).not.toHaveBeenCalled();
    });

    it("PATCH /api/subject/[id] should allow Teacher updating their OWN subject", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValue({
        authorized: true,
        user: { id: "100", role: "teacher", teacherId: "TCPE01" },
      });

      // Subject belongs to teacherId 100
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 10,
        subjectCode: "CPE101",
        teacherId: 100,
        planType: "FOUR_YEAR",
      } as any);

      vi.mocked(prisma.teacher_tb.findFirst).mockResolvedValue({
        id: 100,
        tId: "TCPE01",
      } as any);

      vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.plans_tb.update).mockResolvedValue({
        id: 10,
        subjectCode: "CPE101",
        section: "2",
        timetables: [],
      } as any);

      const req = new NextRequest("http://localhost:3000/api/subject/10", {
        method: "PATCH",
        body: JSON.stringify({ section: "2" }),
      });

      const res = await patchSubjectId(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(200);
      expect(prisma.plans_tb.update).toHaveBeenCalled();
    });

    it("PATCH /api/subject/[id]/room should reject Teacher modifying room for other teacher's plan", async () => {
      vi.spyOn(apiAuth, "requireTeacherOrAdmin").mockResolvedValue({
        authorized: true,
        user: { id: "100", role: "teacher", teacherId: "TCPE01" },
      });

      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 15,
        teacherId: 999, // Other teacher
      } as any);

      vi.mocked(prisma.teacher_tb.findFirst).mockResolvedValue({
        id: 100,
        tId: "TCPE01",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/subject/15/room", {
        method: "PATCH",
        body: JSON.stringify({ roomId: 3 }),
      });

      const res = await patchRoom(req, { params: Promise.resolve({ id: "15" }) });
      expect(res.status).toBe(403);
      expect(prisma.plans_tb.update).not.toHaveBeenCalled();
    });

    it("PATCH /api/subject/[id]/teacher should reject Teacher (Admin-only)", async () => {
      vi.spyOn(apiAuth, "requireAdmin").mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }) as any,
      });

      const req = new NextRequest("http://localhost:3000/api/subject/15/teacher", {
        method: "PATCH",
        body: JSON.stringify({ teacherId: 3 }),
      });

      const res = await patchTeacher(req, { params: Promise.resolve({ id: "15" }) });
      expect(res.status).toBe(403);
      expect(prisma.plans_tb.update).not.toHaveBeenCalled();
    });
  });
});
