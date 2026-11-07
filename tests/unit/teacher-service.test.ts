import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeacherService } from "@/features/teachers/services/teacher.service";
import { validateCreateTeacherInput, validateUpdateTeacherInput } from "@/features/teachers/validations";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teacher_tb: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Teacher Service & Validation Unit Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("validateCreateTeacherInput rejects missing name or lastName", () => {
      expect(validateCreateTeacherInput(null).success).toBe(false);
      expect(validateCreateTeacherInput({ tName: "", tLastName: "Somchai" }).success).toBe(false);
      expect(validateCreateTeacherInput({ tName: "Somchai", tLastName: "" }).success).toBe(false);
    });

    it("validateCreateTeacherInput accepts valid input and sets defaults", () => {
      const res = validateCreateTeacherInput({
        tName: " Somchai ",
        tLastName: " Jaidee ",
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({
        tId: undefined,
        tName: "Somchai",
        tLastName: "Jaidee",
        teacherType: "อาจารย์ภายนอกสาขา",
      });
    });

    it("validateUpdateTeacherInput validates presence of both fields", () => {
      expect(validateUpdateTeacherInput({ tName: "A", tLastName: "" }).success).toBe(false);
      const res = validateUpdateTeacherInput({ tName: " Somchai ", tLastName: " Jaidee " });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ tName: "Somchai", tLastName: "Jaidee" });
    });
  });

  describe("TeacherService", () => {
    it("getTeachers respects inDepartmentOnly filter", async () => {
      (prisma.teacher_tb.findMany as any).mockResolvedValueOnce([{ id: 1, tName: "InDept" }]);
      await TeacherService.getTeachers(true);
      expect(prisma.teacher_tb.findMany).toHaveBeenCalledWith({
        where: { teacherType: "อาจารย์ภายในสาขา" },
        orderBy: { tName: "asc" },
      });

      await TeacherService.getTeachers(false);
      expect(prisma.teacher_tb.findMany).toHaveBeenCalledWith({
        orderBy: { tName: "asc" },
      });
    });

    it("createTeacher rejects duplicate name with 409", async () => {
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce({ id: 1, tName: "Somchai", tLastName: "Jaidee" });
      const res = await TeacherService.createTeacher({
        tName: "Somchai",
        tLastName: "Jaidee",
      });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.error).toContain("มีอยู่ในระบบแล้ว");
    });

    it("createTeacher generates TCPE sequence for department teachers", async () => {
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce(null); // No duplicate name
      (prisma.teacher_tb.findMany as any).mockResolvedValueOnce([
        { tId: "TCPE01" },
        { tId: "TCPE05" },
      ]);
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce(null); // No duplicate tId
      (prisma.teacher_tb.create as any).mockResolvedValueOnce({
        id: 10,
        tId: "TCPE06",
        tName: "Somchai",
        tLastName: "Jaidee",
        teacherType: "อาจารย์ภายในสาขา",
      });

      const res = await TeacherService.createTeacher({
        tName: "Somchai",
        tLastName: "Jaidee",
        teacherType: "อาจารย์ภายในสาขา",
      });

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(201);
      expect(res.teacher?.tId).toBe("TCPE06");
    });

    it("updateTeacher rejects duplicate name with 409", async () => {
      (prisma.teacher_tb.findFirst as any).mockResolvedValueOnce({ id: 2, tName: "Duplicate", tLastName: "Name" });
      const res = await TeacherService.updateTeacher(1, {
        tName: "Duplicate",
        tLastName: "Name",
      });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
    });

    it("deleteTeacher deletes record by id", async () => {
      (prisma.teacher_tb.delete as any).mockResolvedValueOnce({ id: 5 });
      const res = await TeacherService.deleteTeacher(5);
      expect(res.success).toBe(true);
      expect(prisma.teacher_tb.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });
  });
});
