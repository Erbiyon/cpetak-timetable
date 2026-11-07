import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/timetable/clear/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    timetable_tb: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("API Route Contract: /api/timetable/clear (DELETE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required parameters are missing", async () => {
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

  it("successfully deletes matching timetable records and returns deletedCount", async () => {
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

