import { describe, it, expect, vi, beforeEach } from "vitest";
import { CurriculumService } from "@/features/curriculum/services/curriculum.service";
import { validateCurriculumInput } from "@/features/curriculum/validations";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    curriculum_tb: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Curriculum Service & Validation Unit Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateCurriculumInput", () => {
    it("rejects non-object or null input", () => {
      expect(validateCurriculumInput(null).success).toBe(false);
      expect(validateCurriculumInput("").success).toBe(false);
    });

    it("rejects missing or empty subject code (id_sub)", () => {
      const res = validateCurriculumInput({ id_sub: "   ", subject_name: "Physics" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("กรุณาระบุรหัสวิชา");
    });

    it("rejects missing or empty subject name", () => {
      const res = validateCurriculumInput({ id_sub: "PHY101", subject_name: "  " });
      expect(res.success).toBe(false);
      expect(res.error).toBe("กรุณาระบุชื่อวิชา");
    });

    it("rejects non-numeric credits or hours", () => {
      const res = validateCurriculumInput({
        id_sub: "PHY101",
        subject_name: "Physics",
        credit: "abc",
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe("หน่วยกิตและชั่วโมงเรียนต้องเป็นตัวเลข");
    });

    it("accepts valid curriculum payload and trims strings", () => {
      const res = validateCurriculumInput({
        id_sub: "  PHY101  ",
        subject_name: " Physics I ",
        credit: "3",
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({
        id_sub: "PHY101",
        subject_name: "Physics I",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });
    });
  });

  describe("CurriculumService", () => {
    it("getAllCurricula returns sorted list from prisma", async () => {
      const mockList = [{ id: 1, id_sub: "CPE101" }, { id: 2, id_sub: "CPE102" }];
      (prisma.curriculum_tb.findMany as any).mockResolvedValueOnce(mockList);

      const res = await CurriculumService.getAllCurricula();
      expect(res).toEqual(mockList);
      expect(prisma.curriculum_tb.findMany).toHaveBeenCalledWith({
        orderBy: { id_sub: "asc" },
      });
    });

    it("createCurriculum prevents duplicate id_sub", async () => {
      (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce({ id: 1, id_sub: "CPE101" });

      const res = await CurriculumService.createCurriculum({
        id_sub: "CPE101",
        subject_name: "Programming",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toContain("มีอยู่ในระบบแล้ว");
      expect(prisma.curriculum_tb.create).not.toHaveBeenCalled();
    });

    it("createCurriculum creates record when unique", async () => {
      (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce(null);
      const createdItem = { id: 10, id_sub: "CPE101", subject_name: "Programming" };
      (prisma.curriculum_tb.create as any).mockResolvedValueOnce(createdItem);

      const res = await CurriculumService.createCurriculum({
        id_sub: "CPE101",
        subject_name: "Programming",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(201);
      expect(res.curriculum).toEqual(createdItem);
    });

    it("updateCurriculum prevents duplicate id_sub across other records", async () => {
      (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce({ id: 2, id_sub: "CPE102" });

      const res = await CurriculumService.updateCurriculum(1, {
        id_sub: "CPE102",
        subject_name: "Updated",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(prisma.curriculum_tb.update).not.toHaveBeenCalled();
    });

    it("updateCurriculum updates record successfully when unique", async () => {
      (prisma.curriculum_tb.findFirst as any).mockResolvedValueOnce(null);
      const updatedItem = { id: 1, id_sub: "CPE101", subject_name: "Updated" };
      (prisma.curriculum_tb.update as any).mockResolvedValueOnce(updatedItem);

      const res = await CurriculumService.updateCurriculum(1, {
        id_sub: "CPE101",
        subject_name: "Updated",
        credit: 3,
        lacture_credit: 2,
        lab_credit: 1,
        out_credit: 6,
        curriculum_type: "FOUR_YEAR",
      });

      expect(res.success).toBe(true);
      expect(res.curriculum).toEqual(updatedItem);
    });

    it("deleteCurriculum invokes prisma delete", async () => {
      (prisma.curriculum_tb.delete as any).mockResolvedValueOnce({ id: 1 });

      const res = await CurriculumService.deleteCurriculum(1);
      expect(res.success).toBe(true);
      expect(prisma.curriculum_tb.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
