import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/timetable/clear/route";
import { prisma } from "@/lib/prisma";
import * as apiAuth from "@/lib/api-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    timetable_tb: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("API Route Contract: /api/timetable/clear (DELETE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized when request is unauthenticated", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }) as any,
    });

    const req = new Request("http://localhost:3000/api/timetable/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termYear: "1/2567" }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 Forbidden when authenticated user is not an admin", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }) as any,
    });

    const req = new Request("http://localhost:3000/api/timetable/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termYear: "1/2567" }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when admin performs request but required parameters are missing", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: true,
      user: { id: "admin", role: "admin" },
    });

    const req = new Request("http://localhost:3000/api/timetable/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termYear: "1/2567" }), // missing yearLevel and planType
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing required parameters");
  });

  it("successfully deletes matching timetable records when performed by admin", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: true,
      user: { id: "admin", role: "admin" },
    });

    (prisma.timetable_tb.deleteMany as any).mockResolvedValueOnce({ count: 5 });

    const req = new Request("http://localhost:3000/api/timetable/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        termYear: "1/2567",
        yearLevel: "1",
        planType: "FOUR_YEAR",
      }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deletedCount).toBe(5);
    expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
      where: {
        termYear: "1/2567",
        yearLevel: "1",
        planType: "FOUR_YEAR",
      },
    });
  });
});
