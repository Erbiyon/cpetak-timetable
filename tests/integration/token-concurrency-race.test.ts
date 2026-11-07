import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

describe("Real MySQL Concurrent Token Consumption & Race Protection Suite", () => {
  let unenrolledTeacherId: number;
  let enrolledTeacherId: number;
  const unenrolledTId = "T_RACE_TEST_01";
  const enrolledTId = "T_RACE_TEST_02";

  beforeAll(async () => {
    const unenrolled = await prisma.teacher_tb.create({
      data: {
        tId: unenrolledTId,
        tName: "RaceUnenrolled",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: false,
        passwordHash: null,
      },
    });
    unenrolledTeacherId = unenrolled.id;

    const enrolled = await prisma.teacher_tb.create({
      data: {
        tId: enrolledTId,
        tName: "RaceEnrolled",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: true,
        passwordHash: hashPassword("InitialRacePass#2026"),
        sessionVersion: 1,
      },
    });
    enrolledTeacherId = enrolled.id;
  });

  afterAll(async () => {
    await prisma.teacherToken_tb.deleteMany({
      where: { teacherId: { in: [unenrolledTeacherId, enrolledTeacherId] } },
    });
    await prisma.teacher_tb.deleteMany({
      where: { id: { in: [unenrolledTeacherId, enrolledTeacherId] } },
    });
    await prisma.$disconnect();
  });

  it("1. Permits EXACTLY ONE success and rejects other when two concurrent enrollment requests race for the same token", async () => {
    // Admin generates enrollment token
    const tokenResult = await TeacherAuthService.createEnrollmentToken(unenrolledTeacherId, 24);
    const rawToken = tokenResult.rawToken;

    // Fire two simultaneous redemption requests with different passwords
    const [res1, res2] = await Promise.all([
      TeacherAuthService.completeEnrollment(rawToken, "WinnerPassword#111"),
      TeacherAuthService.completeEnrollment(rawToken, "LoserPassword#222"),
    ]);

    // Verify exactly one succeeded and one failed
    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    const failureCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify token was consumed exactly once in database
    const tokenRecord = await prisma.teacherToken_tb.findFirst({
      where: { teacherId: unenrolledTeacherId },
    });
    expect(tokenRecord!.consumedAt).not.toBeNull();

    // Verify teacher is enrolled
    const teacher = await prisma.teacher_tb.findUnique({
      where: { id: unenrolledTeacherId },
    });
    expect(teacher!.isEnrolled).toBe(true);
  });

  it("2. Permits EXACTLY ONE success and rejects other when two concurrent reset requests race for the same reset token", async () => {
    // Generate admin-assisted reset token
    const resetResult = await TeacherAuthService.createAdminAssistedResetToken(enrolledTeacherId, 60);
    const rawToken = resetResult.rawToken;

    // Fire two simultaneous reset confirmations
    const [res1, res2] = await Promise.all([
      TeacherAuthService.resetPassword(rawToken, "ConcurrentPass#Alpha"),
      TeacherAuthService.resetPassword(rawToken, "ConcurrentPass#Beta"),
    ]);

    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    const failureCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify token consumed exactly once
    const tokenRecord = await prisma.teacherToken_tb.findFirst({
      where: { teacherId: enrolledTeacherId, tokenType: "PASSWORD_RESET" },
    });
    expect(tokenRecord!.consumedAt).not.toBeNull();

    // Verify sessionVersion incremented exactly once (from 1 to 2)
    const teacher = await prisma.teacher_tb.findUnique({
      where: { id: enrolledTeacherId },
    });
    expect(teacher!.sessionVersion).toBe(2);
  });
});

