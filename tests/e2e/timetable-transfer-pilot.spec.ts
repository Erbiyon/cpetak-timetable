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

const TEST_TRANSFER_PLAN = {
  subjectCode: "TRF101",
  subjectName: "Transfer Advanced Programming",
  credit: 3,
  lectureHour: 2,
  labHour: 1, // 6 periods total
  planType: "TRANSFER",
  yearLevel: "ปี 1",
  termYear: "1/2569",
};

test.describe("Transfer Pilot Multi-Assignment Browser Regression Suite", () => {
  let createdPlanId: number;

  test.beforeAll(async () => {
    // 1. Verify isolated test database
    const dbNameResult: any = await prisma.$queryRawUnsafe("SELECT DATABASE() as db;");
    const currentDb = dbNameResult[0]?.db;
    console.log("Current Test Database:", currentDb);
    expect(currentDb).toBe("timetable_e2e");

    // 2. Ensure term year fixture
    await prisma.termYear_tb.upsert({
      where: { id: 1 },
      update: { termYear: "1/2569" },
      create: { id: 1, termYear: "1/2569" },
    });

    // 3. Create synthetic Transfer Year 1 subject
    const plan = await prisma.plans_tb.create({
      data: TEST_TRANSFER_PLAN,
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
    // Authenticate as Admin
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

  test("1. Renders Transfer Year 1 page correctly with shared components and correct subject pool", async ({
    page,
  }) => {
    await page.goto("/adjust-time-tables/adjust-plan-transfer/transfer-one-year");
    await expect(page).toHaveURL(/.*transfer-one-year.*/);

    // Verify header and action buttons
    await expect(page.getByText(/ตารางเรียน เทียบโอน ปี 1 ภาคเรียนที่/)).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("button", { name: /จัดตารางทั้งหลักสูตร/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /ล้างทั้งหลักสูตร/ })).toBeVisible();

    // Verify grid days
    await expect(page.getByRole("cell", { name: "จ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "อ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "พ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "พฤ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "ศ.", exact: true })).toBeVisible();

    // Verify Transfer Year 1 subject exists in subject pool
    await expect(page.getByText("TRF101")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/แผนการเรียน เทียบโอน/)).toBeVisible();
  });

  test("2. Real pointer drag-and-drop, API mutation, DB persistence and reload on Transfer Pilot", async ({
    page,
  }) => {
    await page.goto("/adjust-time-tables/adjust-plan-transfer/transfer-one-year");
    await expect(page.getByText("TRF101")).toBeVisible({ timeout: 10000 });

    const subjectCard = page
      .locator("text=TRF101")
      .locator(
        "xpath=ancestor::div[contains(@class, 'rounded') and contains(@class, 'border') and (contains(@class, 'w-[120px]') or contains(@class, 'cursor-grab'))]"
      )
      .first();
    await expect(subjectCard).toBeVisible();

    // Target cell: Monday period 1 (1st row after header, 2nd column)
    const targetCell = page.locator("table tbody tr:first-child td:nth-child(2)");
    await expect(targetCell).toBeVisible();

    const srcBox = await subjectCard.boundingBox();
    const tgtBox = await targetCell.boundingBox();
    expect(srcBox).not.toBeNull();
    expect(tgtBox).not.toBeNull();

    if (srcBox && tgtBox) {
      // Real pointer gesture exceeding 8px threshold
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);

      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2 - 20, { steps: 5 });
      await page.waitForTimeout(150);

      await page.mouse.move(tgtBox.x + tgtBox.width / 2, tgtBox.y + tgtBox.height / 2, { steps: 25 });
      await page.waitForTimeout(300);

      // Drop and wait for POST /api/timetable response
      const [apiRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes("/api/timetable") && res.request().method() === "POST",
          { timeout: 10000 }
        ),
        page.mouse.up(),
      ]);

      expect(apiRes.status()).toBe(200);

      // Verify DB persistence directly in timetable_e2e
      const dbRecord = await prisma.timetable_tb.findFirst({
        where: { planId: createdPlanId },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.day).toBe(0);
      expect(dbRecord?.startPeriod).toBe(0);
      expect(dbRecord?.endPeriod).toBe(5);
      expect(dbRecord?.planType).toBe("TRANSFER");
      expect(dbRecord?.yearLevel).toBe("ปี 1");

      // Reload page and verify assigned subject renders in the table
      await page.reload();
      await expect(
        page.locator("table tbody tr:first-child").getByText("TRF101")
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("3. Conflict handling: invalid out-of-bounds drop is rejected", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-transfer/transfer-one-year");

    const assignedCard = page
      .locator("table tbody tr:first-child")
      .locator("text=TRF101")
      .first();
    await expect(assignedCard).toBeVisible({ timeout: 10000 });

    const outOfBoundsCell = page.locator("table tbody tr:first-child td:last-child");
    await expect(outOfBoundsCell).toBeVisible();

    const srcBox = await assignedCard.boundingBox();
    const tgtBox = await outOfBoundsCell.boundingBox();

    if (srcBox && tgtBox) {
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2 - 20, { steps: 5 });
      await page.mouse.move(tgtBox.x + tgtBox.width / 2, tgtBox.y + tgtBox.height / 2, { steps: 20 });
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Record should remain at startPeriod 0
      const dbRecord = await prisma.timetable_tb.findFirst({
        where: { planId: createdPlanId },
      });
      expect(dbRecord?.startPeriod).toBe(0);
    }
  });
});

