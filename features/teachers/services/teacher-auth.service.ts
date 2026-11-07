import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  hashToken,
  generateSecureToken,
} from "@/lib/password";

export interface EnrollmentTokenResult {
  rawToken: string;
  expiresAt: Date;
  teacherId: number;
  tId: string;
}

export interface ResetTokenResult {
  rawToken: string;
  expiresAt: Date;
  teacherId: number;
}

export class TeacherAuthService {
  /**
   * Generates a single-use enrollment token for a teacher account.
   * Can only be initiated by authenticated Admin.
   * Default validity: 24 hours.
   */
  static async createEnrollmentToken(
    teacherId: number,
    validityHours: number = 24
  ): Promise<EnrollmentTokenResult> {
    const teacher = await prisma.teacher_tb.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + validityHours * 3600 * 1000);

    // Invalidate existing unused enrollment tokens for this teacher
    await prisma.teacherToken_tb.deleteMany({
      where: {
        teacherId,
        tokenType: "ENROLLMENT",
        consumedAt: null,
      },
    });

    await prisma.teacherToken_tb.create({
      data: {
        teacherId,
        tokenHash,
        tokenType: "ENROLLMENT",
        expiresAt,
      },
    });

    return {
      rawToken,
      expiresAt,
      teacherId: teacher.id,
      tId: teacher.tId,
    };
  }

  /**
   * Completes teacher enrollment by consuming the one-time token and setting individual password.
   */
  static async completeEnrollment(
    rawToken: string,
    newPassword: string
  ): Promise<{ success: boolean; teacherId: number; error?: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, teacherId: 0, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
    }

    const tokenHash = hashToken(rawToken);

    return await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.teacherToken_tb.findUnique({
        where: { tokenHash },
        include: { teacher: true },
      });

      if (!tokenRecord) {
        return { success: false, teacherId: 0, error: "โทเค็นไม่ถูกต้องหรือถูกใช้งานแล้ว" };
      }

      if (tokenRecord.tokenType !== "ENROLLMENT") {
        return { success: false, teacherId: 0, error: "ประเภทโทเค็นไม่ถูกต้อง" };
      }

      if (tokenRecord.consumedAt) {
        return { success: false, teacherId: 0, error: "โทเค็นนี้ถูกใช้งานไปแล้ว" };
      }

      if (new Date() > tokenRecord.expiresAt) {
        return { success: false, teacherId: 0, error: "โทเค็นหมดอายุแล้ว" };
      }

      // Disallow setting password to their own tId
      if (newPassword === tokenRecord.teacher.tId) {
        return {
          success: false,
          teacherId: tokenRecord.teacherId,
          error: "ไม่อนุญาตให้ใช้รหัสประจำตัวเป็นรหัสผ่านเพื่อความปลอดภัย",
        };
      }

      const passwordHash = hashPassword(newPassword);

      // Atomically mark token consumed
      await tx.teacherToken_tb.update({
        where: { id: tokenRecord.id },
        data: { consumedAt: new Date() },
      });

      // Update teacher status
      await tx.teacher_tb.update({
        where: { id: tokenRecord.teacherId },
        data: {
          passwordHash,
          isEnrolled: true,
          sessionVersion: { increment: 1 },
        },
      });

      return { success: true, teacherId: tokenRecord.teacherId };
    });
  }

  /**
   * Generates a single-use password reset token via Admin-assisted procedure.
   */
  static async createAdminAssistedResetToken(
    teacherId: number,
    validityMinutes: number = 60
  ): Promise<ResetTokenResult> {
    const teacher = await prisma.teacher_tb.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    // Invalidate existing unused reset tokens for this teacher
    await prisma.teacherToken_tb.deleteMany({
      where: {
        teacherId: teacher.id,
        tokenType: "PASSWORD_RESET",
        consumedAt: null,
      },
    });

    await prisma.teacherToken_tb.create({
      data: {
        teacherId: teacher.id,
        tokenHash,
        tokenType: "PASSWORD_RESET",
        expiresAt,
      },
    });

    return {
      rawToken,
      expiresAt,
      teacherId: teacher.id,
    };
  }

  /**
   * Generates a single-use password reset token.
   * Default validity: 1 hour.
   */
  static async createPasswordResetToken(
    tId: string,
    validityMinutes: number = 60
  ): Promise<ResetTokenResult | null> {
    const teacher = await prisma.teacher_tb.findFirst({
      where: { tId },
    });

    if (!teacher || !teacher.isEnrolled) {
      return null;
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    // Invalidate existing unused reset tokens
    await prisma.teacherToken_tb.deleteMany({
      where: {
        teacherId: teacher.id,
        tokenType: "PASSWORD_RESET",
        consumedAt: null,
      },
    });

    await prisma.teacherToken_tb.create({
      data: {
        teacherId: teacher.id,
        tokenHash,
        tokenType: "PASSWORD_RESET",
        expiresAt,
      },
    });

    return {
      rawToken,
      expiresAt,
      teacherId: teacher.id,
    };
  }

  /**
   * Resets teacher password using valid reset token and increments sessionVersion to invalidate active sessions.
   */
  static async resetPassword(
    rawToken: string,
    newPassword: string
  ): Promise<{ success: boolean; teacherId: number; error?: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, teacherId: 0, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
    }

    const tokenHash = hashToken(rawToken);

    return await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.teacherToken_tb.findUnique({
        where: { tokenHash },
        include: { teacher: true },
      });

      if (!tokenRecord || tokenRecord.tokenType !== "PASSWORD_RESET") {
        return { success: false, teacherId: 0, error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้งานแล้ว" };
      }

      if (tokenRecord.consumedAt) {
        return { success: false, teacherId: 0, error: "ลิงก์รีเซ็ตรหัสผ่านนี้ถูกใช้งานไปแล้ว" };
      }

      if (new Date() > tokenRecord.expiresAt) {
        return { success: false, teacherId: 0, error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว" };
      }

      if (newPassword === tokenRecord.teacher.tId) {
        return {
          success: false,
          teacherId: tokenRecord.teacherId,
          error: "ไม่อนุญาตให้ใช้รหัสประจำตัวเป็นรหัสผ่านเพื่อความปลอดภัย",
        };
      }

      const passwordHash = hashPassword(newPassword);

      // Consume token
      await tx.teacherToken_tb.update({
        where: { id: tokenRecord.id },
        data: { consumedAt: new Date() },
      });

      // Increment sessionVersion to invalidate all existing sessions
      await tx.teacher_tb.update({
        where: { id: tokenRecord.teacherId },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
        },
      });

      return { success: true, teacherId: tokenRecord.teacherId };
    });
  }
}
