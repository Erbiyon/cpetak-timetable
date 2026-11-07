import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/curriculum/route";
import { prisma } from "@/lib/prisma";
import * as apiAuth from "@/lib/api-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    curriculum_tb: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("API Route Contract: /api/curriculum (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized when request is unauthenticated", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }) as any,
    });

    const req = new Request("http://localhost:3000/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_sub: "CPE101" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 when curriculum subject code (id_sub) already exists", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: true,
      user: { id: "admin", role: "admin" },
    });

    (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce({
      id: 1,
      id_sub: "CPE101",
      subject_name: "Computer Programming",
    });

    const req = new Request("http://localhost:3000/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_sub: "CPE101",
        subject_name: "Computer Programming",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("รหัสวิชา CPE101 มีอยู่ในระบบแล้ว");
  });

  it("successfully creates a new curriculum record when id_sub is unique", async () => {
    vi.spyOn(apiAuth, "requireAdmin").mockResolvedValueOnce({
      authorized: true,
      user: { id: "admin", role: "admin" },
    });

    (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce(null);
    const newRecord = {
      id: 2,
      id_sub: "CPE102",
      subject_name: "Data Structures",
      credit: 3,
      lacture_credit: 2,
      lab_credit: 1,
      out_credit: 6,
      curriculum_type: "FOUR_YEAR",
    };
    (prisma.curriculum_tb.create as any).mockResolvedValueOnce(newRecord);

    const req = new Request("http://localhost:3000/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual(newRecord);
    expect(prisma.curriculum_tb.create).toHaveBeenCalledWith({
      data: {
        id_sub: "CPE102",
        subject_name: "Data Structures",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      },
    });
  });
});
