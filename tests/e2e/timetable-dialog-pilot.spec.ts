import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Isolated E2E Database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

const PILOT_TEST_SUBJECT = {
  subjectCode: "LAZY101",
  subjectName: "Lazy Dialog Subject",
  credit: 3,
  lectureHour: 2,
  labHour: 1,
  planType: "FOUR_YEAR",
  yearLevel: "ปี 1",
  termYear: "1/2569",
};

test.describe("Timetable Pilot Modal & Dialog Characterization Suite", () => {
  let createdPlanId: number;

  test.beforeAll(async () => {
    // 1. Verify isolated test database
    const dbNameResult: any = await prisma.$queryRawUnsafe("SELECT DATABASE() as db;");
    const currentDb = dbNameResult[0]?.db;
    console.log("Current Test Database:", currentDb);
    expect(currentDb).toBe("timetable_e2e");

    // 2. Ensure termYear
    await prisma.termYear_tb.upsert({
      where: { id: 1 },
      update: { termYear: "1/2569" },
      create: { id: 1, termYear: "1/2569" },
    });

    // 3. Create synthetic subject for Pilot (Four-One-Year)
    const plan = await prisma.plans_tb.create({
      data: PILOT_TEST_SUBJECT,
    });
    createdPlanId = plan.id;
  });

  test.afterAll(async () => {
    if (createdPlanId) {
      await prisma.timetable_tb.deleteMany({
        where: { planId: createdPlanId },
      });
      await prisma.plans_tb.deleteMany({
        where: { id: createdPlanId },
      });
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("tab", { name: "ผู้ดูแลระบบ" }).click();
    await page.locator("#admin-id").fill("admin");
    await page.locator("#admin-password").fill("admin123");
    await page
      .getByRole("tabpanel", { name: "ผู้ดูแลระบบ" })
      .getByRole("button", { name: "เข้าสู่ระบบ" })
      .click();

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
  });

  test("1. Verifies ClearButtonSubject modal opens AlertDialog, shows warnings, and closes gracefully on cancel", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*four-one-year.*/);

    // Locate the Clear button (ClearButtonSubject in toolbar: 'ล้างวิชา')
    const clearSubjectBtn = page.getByRole("button", { name: "ล้างวิชา" });
    await expect(clearSubjectBtn).toBeVisible({ timeout: 10000 });
    await clearSubjectBtn.click();

    // Verify AlertDialogContent appears
    const alertDialogTitle = page.getByText("ยืนยันการล้างข้อมูลทั้งหมด");
    await expect(alertDialogTitle).toBeVisible();

    const alertDialogDesc = page.getByText("คุณต้องการล้างวิชาทั้งหมดในตารางนี้หรือไม่?");
    await expect(alertDialogDesc).toBeVisible();

    // Click cancel button and verify dialog closes
    const cancelBtn = page.getByRole("button", { name: "ยกเลิก" });
    await cancelBtn.click();
    await expect(alertDialogTitle).not.toBeVisible();
  });

  test("2. Verifies AddSubDetail trigger on subject card opens and closes", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*four-one-year.*/);

    // Locate the test subject card container
    const subjectCard = page
      .locator("text=LAZY101")
      .locator(
        "xpath=ancestor::div[contains(@class, 'rounded') and contains(@class, 'border') and (contains(@class, 'w-[120px]') or contains(@class, 'cursor-grab'))]"
      )
      .first();
    await expect(subjectCard).toBeVisible({ timeout: 10000 });

    // Locate the PlusCircle trigger in the top-right of that subject card (Ghost button inside subject card)
    const plusButton = subjectCard.locator("button").first();
    await expect(plusButton).toBeVisible();
    await plusButton.click();

    // Verify AddSubDetail Dialog appears
    const dialogTitle = page.getByText("เพิ่มรายละเอียด");
    await expect(dialogTitle).toBeVisible();

    // Verify room/section inputs are in the dialog
    await expect(page.getByLabel("กลุ่มเรียน")).toBeVisible();

    // Close the dialog by clicking "ยกเลิก"
    const cancelBtn = page.getByRole("button", { name: "ยกเลิก" });
    await cancelBtn.click();
    await expect(dialogTitle).not.toBeVisible();
  });
});
