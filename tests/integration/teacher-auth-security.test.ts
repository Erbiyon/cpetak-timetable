import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

describe("Teacher Authentication Security Hardening Suite", () => {
  let unenrolledTeacherId: number;
  let enrolledTeacherId: number;
  const unenrolledTId = "T_UNENROLLED_999";
  const enrolledTId = "T_ENROLLED_888";
  const correctPassword = "CorrectTeacherPassword@2026";

  beforeAll(async () => {
    // 1. Create unenrolled teacher (legacy state)
    const unenrolled = await prisma.teacher_tb.create({
      data: {
        tId: unenrolledTId,
        tName: "Unenrolled",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: false,
        passwordHash: null,
      },
    });
    unenrolledTeacherId = unenrolled.id;

    // 2. Create enrolled teacher with secure scrypt password hash
    const enrolled = await prisma.teacher_tb.create({
      data: {
        tId: enrolledTId,
        tName: "Enrolled",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: true,
        passwordHash: hashPassword(correctPassword),
        sessionVersion: 1,
      },
    });
    enrolledTeacherId = enrolled.id;
  });

  afterAll(async () => {
    await prisma.teacherToken_tb.deleteMany({
      where: {
        teacherId: { in: [unenrolledTeacherId, enrolledTeacherId] },
      },
    });
    await prisma.teacher_tb.deleteMany({
      where: {
        id: { in: [unenrolledTeacherId, enrolledTeacherId] },
      },
    });
    await prisma.$disconnect();
  });

  const getTeacherAuthorize = () => {
    const provider: any = authOptions.providers.find(
      (p: any) => p.options?.id === "teacher-login" || p.id === "teacher-login"
    );
    return provider?.options?.authorize || provider?.authorize;
  };

  it("1. REJECTS legacy login where password equals tId for unenrolled teacher", async () => {
    const teacherAuthorize = getTeacherAuthorize();
    const user = await teacherAuthorize({
      teacherId: unenrolledTId,
      password: unenrolledTId, // Legacy vulnerability
    });
    expect(user).toBeNull();
  });

  it("2. REJECTS legacy login where password equals tId for enrolled teacher", async () => {
    const teacherAuthorize = getTeacherAuthorize();
    const user = await teacherAuthorize({
      teacherId: enrolledTId,
      password: enrolledTId, // Legacy vulnerability
    });
    expect(user).toBeNull();
  });

  it("3. SUCCEEDS login when enrolled teacher provides correct individual password", async () => {
    const teacherAuthorize = getTeacherAuthorize();
    const user = await teacherAuthorize({
      teacherId: enrolledTId,
      password: correctPassword,
    });
    expect(user).not.toBeNull();
    expect(user.teacherId).toBe(enrolledTId);
    expect(user.role).toBe("teacher");
    expect(user.sessionVersion).toBe(1);
    expect((user as any).passwordHash).toBeUndefined(); // Never leak hash in session user
  });

  it("4. REJECTS login when enrolled teacher provides incorrect password", async () => {
    const teacherAuthorize = getTeacherAuthorize();
    const user = await teacherAuthorize({
      teacherId: enrolledTId,
      password: "WrongPassword#123",
    });
    expect(user).toBeNull();
  });

  it("5. Completes verified first-time enrollment workflow with single-use token", async () => {
    // Admin creates enrollment token
    const tokenResult = await TeacherAuthService.createEnrollmentToken(unenrolledTeacherId, 24);
    expect(tokenResult.rawToken).toBeTruthy();

    // Verify token record in database is hashed (raw token not stored)
    const tokenRecord = await prisma.teacherToken_tb.findFirst({
      where: { teacherId: unenrolledTeacherId },
    });
    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord!.tokenHash).not.toBe(tokenResult.rawToken);
    expect(tokenRecord!.consumedAt).toBeNull();

    // Attempting to set password identical to tId is rejected
    const badPassAttempt = await TeacherAuthService.completeEnrollment(
      tokenResult.rawToken,
      unenrolledTId
    );
    expect(badPassAttempt.success).toBe(false);

    // Complete enrollment with strong password
    const newPass = "NewSecureTeacherPass@2026";
    const enrollmentSuccess = await TeacherAuthService.completeEnrollment(
      tokenResult.rawToken,
      newPass
    );
    expect(enrollmentSuccess.success).toBe(true);

    // Verify teacher is now enrolled
    const updatedTeacher = await prisma.teacher_tb.findUnique({
      where: { id: unenrolledTeacherId },
    });
    expect(updatedTeacher!.isEnrolled).toBe(true);
    expect(updatedTeacher!.passwordHash).toBeTruthy();
    expect(updatedTeacher!.passwordHash).not.toBe(newPass);

    // Verify token is atomically consumed
    const consumedToken = await prisma.teacherToken_tb.findFirst({
      where: { teacherId: unenrolledTeacherId },
    });
    expect(consumedToken!.consumedAt).not.toBeNull();

    // Replay attack: Using the same enrollment token again MUST FAIL
    const replayAttempt = await TeacherAuthService.completeEnrollment(
      tokenResult.rawToken,
      "AnotherPassword@123"
    );
    expect(replayAttempt.success).toBe(false);

    // Verify now able to log in with new password
    const teacherAuthorize = getTeacherAuthorize();
    const loginUser = await teacherAuthorize({
      teacherId: unenrolledTId,
      password: newPass,
    });
    expect(loginUser).not.toBeNull();
    expect(loginUser.teacherId).toBe(unenrolledTId);
  });

  it("6. Completes secure password reset and increments sessionVersion", async () => {
    const teacherAuthorize = getTeacherAuthorize();
    const initialTeacher = await prisma.teacher_tb.findUnique({
      where: { id: enrolledTeacherId },
    });
    const initialVersion = initialTeacher!.sessionVersion;

    // Create password reset token
    const resetResult = await TeacherAuthService.createPasswordResetToken(enrolledTId, 60);
    expect(resetResult).not.toBeNull();

    const newResetPassword = "BrandNewPassword#9999";
    const resetSuccess = await TeacherAuthService.resetPassword(
      resetResult!.rawToken,
      newResetPassword
    );
    expect(resetSuccess.success).toBe(true);

    // Verify old password stops working
    const oldLogin = await teacherAuthorize({
      teacherId: enrolledTId,
      password: correctPassword,
    });
    expect(oldLogin).toBeNull();

    // Verify new password works
    const newLogin = await teacherAuthorize({
      teacherId: enrolledTId,
      password: newResetPassword,
    });
    expect(newLogin).not.toBeNull();
    expect(newLogin.sessionVersion).toBe(initialVersion + 1);

    // Verify replaying reset token fails
    const replayReset = await TeacherAuthService.resetPassword(
      resetResult!.rawToken,
      "YetAnotherPass@123"
    );
    expect(replayReset.success).toBe(false);
  });
});
