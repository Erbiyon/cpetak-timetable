import { prisma } from "@/lib/prisma";
import { CreateCurriculumInput, CurriculumItem, UpdateCurriculumInput } from "../types";

export class CurriculumService {
  /**
   * Retrieves all curriculum subjects ordered by subject code (id_sub) ascending.
   */
  static async getAllCurricula(): Promise<CurriculumItem[]> {
    return prisma.curriculum_tb.findMany({
      orderBy: {
        id_sub: "asc",
      },
    });
  }

  /**
   * Finds a curriculum subject by subject code (id_sub).
   */
  static async findByCode(id_sub: string, excludeId?: number): Promise<CurriculumItem | null> {
    const where: any = { id_sub };
    if (excludeId !== undefined) {
      where.NOT = { id: excludeId };
    }
    return prisma.curriculum_tb.findFirst({ where });
  }

  /**
   * Creates a new curriculum subject, preventing duplicate subject codes.
   */
  static async createCurriculum(data: CreateCurriculumInput): Promise<{
    success: boolean;
    curriculum?: CurriculumItem;
    error?: string;
    statusCode?: number;
  }> {
    const existing = await this.findByCode(data.id_sub);
    if (existing) {
      return {
        success: false,
        error: `รหัสวิชา ${data.id_sub} มีอยู่ในระบบแล้ว`,
        statusCode: 400,
      };
    }

    const curriculum = await prisma.curriculum_tb.create({
      data: {
        id_sub: data.id_sub,
        subject_name: data.subject_name,
        credit: data.credit,
        lacture_credit: data.lacture_credit,
        lab_credit: data.lab_credit,
        out_credit: data.out_credit,
        curriculum_type: data.curriculum_type,
      },
    });

    return {
      success: true,
      curriculum,
      statusCode: 201,
    };
  }

  /**
   * Updates an existing curriculum subject, preventing duplicate subject codes across other records.
   */
  static async updateCurriculum(
    id: number,
    data: UpdateCurriculumInput
  ): Promise<{
    success: boolean;
    curriculum?: CurriculumItem;
    error?: string;
    statusCode?: number;
  }> {
    const existing = await this.findByCode(data.id_sub, id);
    if (existing) {
      return {
        success: false,
        error: `รหัสวิชา ${data.id_sub} มีอยู่ในระบบแล้ว`,
        statusCode: 400,
      };
    }

    const curriculum = await prisma.curriculum_tb.update({
      where: { id },
      data: {
        id_sub: data.id_sub,
        subject_name: data.subject_name,
        credit: data.credit,
        lacture_credit: data.lacture_credit,
        lab_credit: data.lab_credit,
        out_credit: data.out_credit,
        curriculum_type: data.curriculum_type,
      },
    });

    return {
      success: true,
      curriculum,
      statusCode: 200,
    };
  }

  /**
   * Deletes a curriculum subject by id.
   */
  static async deleteCurriculum(id: number): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
  }> {
    await prisma.curriculum_tb.delete({
      where: { id },
    });

    return {
      success: true,
      statusCode: 200,
    };
  }
}
