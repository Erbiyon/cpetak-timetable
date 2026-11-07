import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../lib/password";
import { TeacherAuthService } from "../../features/teachers/services/teacher-auth.service";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

test.describe("Teacher Authentication, Enrollment & Password Reset E2E Suite", () => {
  let unenrolledTeacherId: number;
  let enrolledTeacherId: number;
  const unenrolledTId = "T_PW_UNENROLLED_01";
  const enrolledTId = "T_PW_ENROLLED_02";
  const enrolledInitialPass = "InitialPass@2026";

  test.beforeAll(async () => {
    // 1. Unenrolled legacy teacher
    const unenrolled = await prisma.teacher_tb.create({
      data: {
        tId: unenrolledTId,
        tName: "UnenrolledBrowser",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: false,
        passwordHash: null,
      },
    });
    unenrolledTeacherId = unenrolled.id;

    // 2. Enrolled teacher
    const enrolled = await prisma.teacher_tb.create({
      data: {
        tId: enrolledTId,
        tName: "EnrolledBrowser",
        tLastName: "Teacher",
        teacherType: "อาจารย์ภายในสาขา",
        isEnrolled: true,
        passwordHash: hashPassword(enrolledInitialPass),
        sessionVersion: 1,
      },
    });
    enrolledTeacherId = enrolled.id;
  });

  test.afterAll(async () => {
    await prisma.teacherToken_tb.deleteMany({
      where: { teacherId: { in: [unenrolledTeacherId, enrolledTeacherId] } },
    });
    await prisma.teacher_tb.deleteMany({
      where: { id: { in: [unenrolledTeacherId, enrolledTeacherId] } },
    });
    await prisma.$disconnect();
  });

  test("1. Rejects login using legacy tId password for unenrolled teacher", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Teacher tab is default
    await page.locator("#teacher-id").fill(unenrolledTId);
    await page.locator("#teacher-password").fill(unenrolledTId); // Insecure legacy attempt
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    // Verify error message displayed and stays on login
    const errorAlert = page.getByText("รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("2. Rejects login using legacy tId password for enrolled teacher", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#teacher-id").fill(enrolledTId);
    await page.locator("#teacher-password").fill(enrolledTId); // Trying to use tId
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    const errorAlert = page.getByText("รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("3. Successfully logs in enrolled teacher with individual password", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#teacher-id").fill(enrolledTId);
    await page.locator("#teacher-password").fill(enrolledInitialPass);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    // Should redirect to teacher timetable page
    await page.waitForURL("**/teacher-use/time-table", { timeout: 15000 });
    expect(page.url()).toContain("/teacher-use/time-table");
  });

  test("4. Completes API enrollment and enables browser login with new password", async ({
    page,
    request,
  }) => {
    // 1. Generate enrollment token via service
    const tokenResult = await TeacherAuthService.createEnrollmentToken(
      unenrolledTeacherId,
      24
    );

    // 2. Submit completion via public API endpoint
    const newPassword = "BrandNewSecurePassword@2026";
    const res = await request.post("/api/teacher/enrollment/complete", {
      data: {
        token: tokenResult.rawToken,
        password: newPassword,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // 3. Now attempt login via browser using newly set password
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#teacher-id").fill(unenrolledTId);
    await page.locator("#teacher-password").fill(newPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    await page.waitForURL("**/teacher-use/time-table", { timeout: 15000 });
    expect(page.url()).toContain("/teacher-use/time-table");
  });

  test("5. Completes password reset and rejects previous password", async ({
    page,
    request,
  }) => {
    // 1. Create password reset token directly via service (simulating Admin-assisted issuance)
    const resetResult = await TeacherAuthService.createAdminAssistedResetToken(enrolledTeacherId);
    expect(resetResult).toBeTruthy();
    const resetToken = resetResult.rawToken;
    expect(resetToken).toBeTruthy();

    // 2. Confirm password reset with new password
    const updatedPass = "ResetCompletedPass#2026";
    const confirmRes = await request.post("/api/teacher/reset-password/confirm", {
      data: {
        token: resetToken,
        newPassword: updatedPass,
      },
    });
    expect(confirmRes.status()).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.success).toBe(true);

    // 3. Verify old password no longer works in browser
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#teacher-id").fill(enrolledTId);
    await page.locator("#teacher-password").fill(enrolledInitialPass); // Old password
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    const errorAlert = page.getByText("รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // 4. Verify new password works in browser
    await page.locator("#teacher-password").fill(updatedPass);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    await page.waitForURL("**/teacher-use/time-table", { timeout: 15000 });
    expect(page.url()).toContain("/teacher-use/time-table");
  });
});

