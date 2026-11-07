import { prisma } from "@/lib/prisma";
import { CreateTeacherInput, TeacherItem, UpdateTeacherInput } from "../types";

export class TeacherService {
  /**
   * Retrieves teachers with optional filtering by department.
   */
  static async getTeachers(inDepartmentOnly: boolean = false): Promise<TeacherItem[]> {
    if (inDepartmentOnly) {
      return prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายในสาขา",
        },
        orderBy: {
          tName: "asc",
        },
      });
    }

    return prisma.teacher_tb.findMany({
      orderBy: {
        tName: "asc",
      },
    });
  }

  /**
   * Finds a teacher by primary key ID.
   */
  static async getTeacherById(id: number): Promise<TeacherItem | null> {
    return prisma.teacher_tb.findUnique({
      where: { id },
      select: {
        id: true,
        tId: true,
        tName: true,
        tLastName: true,
        teacherType: true,
      },
    });
  }

  /**
   * Finds duplicate teacher by full name.
   */
  static async findDuplicateByName(
    tName: string,
    tLastName: string,
    excludeId?: number
  ): Promise<TeacherItem | null> {
    const where: any = {
      tName: tName.trim(),
      tLastName: tLastName.trim(),
    };
    if (excludeId !== undefined) {
      where.NOT = { id: excludeId };
    }
    return prisma.teacher_tb.findFirst({ where });
  }

  /**
   * Generates next sequential identifier for department or external teachers.
   */
  static async generateNextTeacherId(teacherType: string): Promise<{ tId?: string; error?: string }> {
    if (teacherType === "อาจารย์ภายในสาขา") {
      const existingTeachers = await prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายในสาขา",
          tId: { startsWith: "TCPE" },
        },
        orderBy: { tId: "asc" },
      });

      let maxNumber = 0;
      for (const teacher of existingTeachers) {
        const match = teacher.tId.match(/^TCPE(\d{2})$/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const nextNumber = maxNumber + 1;
      if (nextNumber > 99) {
        return { error: "รหัสอาจารย์ภายในสาขาเต็มแล้ว (สูงสุดคือ TCPE99)" };
      }

      return { tId: `TCPE${nextNumber.toString().padStart(2, "0")}` };
    } else if (teacherType === "อาจารย์ภายนอกสาขา") {
      const existingTeachers = await prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายนอกสาขา",
          tId: { startsWith: "TOUT" },
        },
        orderBy: { tId: "asc" },
      });

      let maxNumber = 0;
      for (const teacher of existingTeachers) {
        const match = teacher.tId.match(/^TOUT(\d{1,3})$/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const nextNumber = maxNumber + 1;
      if (nextNumber > 999) {
        return { error: "รหัสอาจารย์ภายนอกสาขาเต็มแล้ว (สูงสุดคือ TOUT999)" };
      }

      return { tId: `TOUT${nextNumber.toString().padStart(3, "0")}` };
    }

    return { tId: `T${Date.now()}` };
  }

  /**
   * Creates a new teacher record with uniqueness verification.
   */
  static async createTeacher(data: CreateTeacherInput): Promise<{
    success: boolean;
    teacher?: TeacherItem;
    error?: string;
    statusCode?: number;
  }> {
    const duplicate = await this.findDuplicateByName(data.tName, data.tLastName);
    if (duplicate) {
      return {
        success: false,
        error: `อาจารย์ ${data.tName} ${data.tLastName} มีอยู่ในระบบแล้ว`,
        statusCode: 409,
      };
    }

    const teacherType = data.teacherType || "อาจารย์ภายนอกสาขา";
    let finalTId = data.tId;

    if (!finalTId) {
      const idGen = await this.generateNextTeacherId(teacherType);
      if (idGen.error || !idGen.tId) {
        return {
          success: false,
          error: idGen.error || "ไม่สามารถสร้างรหัสอาจารย์ได้",
          statusCode: 400,
        };
      }
      finalTId = idGen.tId;
    }

    const existingById = await prisma.teacher_tb.findFirst({
      where: { tId: finalTId },
    });
    if (existingById) {
      return {
        success: false,
        error: `รหัสอาจารย์ ${finalTId} มีอยู่ในระบบแล้ว`,
        statusCode: 400,
      };
    }

    const newTeacher = await prisma.teacher_tb.create({
      data: {
        tId: finalTId,
        tName: data.tName,
        tLastName: data.tLastName,
        teacherType,
      },
    });

    return {
      success: true,
      teacher: newTeacher,
      statusCode: 201,
    };
  }

  /**
   * Updates teacher's name and last name with duplicate verification.
   */
  static async updateTeacher(
    id: number,
    data: UpdateTeacherInput
  ): Promise<{
    success: boolean;
    teacher?: TeacherItem;
    error?: string;
    statusCode?: number;
  }> {
    const duplicate = await this.findDuplicateByName(data.tName, data.tLastName, id);
    if (duplicate) {
      return {
        success: false,
        error: `อาจารย์ ${data.tName} ${data.tLastName} มีอยู่ในระบบแล้ว`,
        statusCode: 409,
      };
    }

    const updated = await prisma.teacher_tb.update({
      where: { id },
      data: {
        tName: data.tName,
        tLastName: data.tLastName,
      },
    });

    return {
      success: true,
      teacher: updated,
      statusCode: 200,
    };
  }

  /**
   * Deletes a teacher by ID.
   */
  static async deleteTeacher(id: number): Promise<{
    success: boolean;
    deletedTeacher?: TeacherItem;
    error?: string;
    statusCode?: number;
  }> {
    const deleted = await prisma.teacher_tb.delete({
      where: { id },
    });

    return {
      success: true,
      deletedTeacher: deleted,
      statusCode: 200,
    };
  }
}
