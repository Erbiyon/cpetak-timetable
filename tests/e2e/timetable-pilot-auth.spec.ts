import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_PLAN_DATA = {
  subjectCode: "TEST101",
  subjectName: "Test Software Architecture",
  credit: 3,
  lectureHour: 2,
  labHour: 1, // Total 3 hours = 6 periods (periods 0..5)
  planType: "FOUR_YEAR",
  yearLevel: "ปี 1",
  termYear: "1/2569",
};

test.describe("Timetable Pilot Authenticated Browser Regression Suite", () => {
  let createdPlanId: number;

  test.beforeAll(async () => {
    // Ensure term year
    await prisma.termYear_tb.upsert({
      where: { id: 1 },
      update: { termYear: "1/2569" },
      create: { id: 1, termYear: "1/2569" },
    });

    // Create synthetic test subject plan for Pilot (Four-Year 1)
    const plan = await prisma.plans_tb.create({
      data: TEST_PLAN_DATA,
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

  test("1. Authenticated login and access pilot page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/ระบบจัดตารางเรียน/);

    await page.getByRole("tab", { name: "ผู้ดูแลระบบ" }).click();
    await page.locator("#admin-id").fill("admin");
    await page.locator("#admin-password").fill("admin123");
    await page
      .getByRole("tabpanel", { name: "ผู้ดูแลระบบ" })
      .getByRole("button", { name: "เข้าสู่ระบบ" })
      .click();

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*four-one-year.*/);

    // Verify header, action buttons, days and subject card render
    await expect(
      page.getByText(/ตารางเรียน 4 ปี ปี 1 ภาคเรียนที่/)
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /จัดตารางทั้งหลักสูตร/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /ล้างทั้งหลักสูตร/ })
    ).toBeVisible();

    await expect(page.getByRole("cell", { name: "จ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "อ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "พ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "พฤ.", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "ศ.", exact: true })).toBeVisible();

    await expect(page.getByText("TEST101")).toBeVisible({ timeout: 10000 });
  });

  test("2. Real pointer drag-and-drop, collision detection, API mutation, persistence and reload", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.getByRole("tab", { name: "ผู้ดูแลระบบ" }).click();
    await page.locator("#admin-id").fill("admin");
    await page.locator("#admin-password").fill("admin123");
    await page
      .getByRole("tabpanel", { name: "ผู้ดูแลระบบ" })
      .getByRole("button", { name: "เข้าสู่ระบบ" })
      .click();
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Open pilot
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page.getByText("TEST101")).toBeVisible({ timeout: 10000 });

    // Locate source card and target cell
    const subjectCard = page
      .locator("text=TEST101")
      .locator(
        "xpath=ancestor::div[contains(@class, 'rounded') and contains(@class, 'border') and (contains(@class, 'w-[120px]') or contains(@class, 'cursor-grab'))]"
      )
      .first();
    await expect(subjectCard).toBeVisible();

    const targetCell = page.locator("table tbody tr:first-child td:nth-child(2)");
    await expect(targetCell).toBeVisible();

    const srcBox = await subjectCard.boundingBox();
    const tgtBox = await targetCell.boundingBox();

    expect(srcBox).not.toBeNull();
    expect(tgtBox).not.toBeNull();

    if (srcBox && tgtBox) {
      // Real pointer gesture satisfying PointerSensor activationConstraint (distance: 8)
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Trigger movement > 8px
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2 - 20, { steps: 5 });
      await page.waitForTimeout(150);

      // Verify dragging active on body
      const isDraggingActive = await page.evaluate(() =>
        document.body.classList.contains("dragging-active")
      );
      expect(isDraggingActive).toBe(true);

      // Move into target cell
      await page.mouse.move(tgtBox.x + tgtBox.width / 2, tgtBox.y + tgtBox.height / 2, { steps: 25 });
      await page.waitForTimeout(300);

      // Drop
      const [apiResponse] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes("/api/timetable") && res.request().method() === "POST",
          { timeout: 10000 }
        ),
        page.mouse.up(),
      ]);

      expect(apiResponse.status()).toBe(200);

      // Verify persistence directly in MySQL database
      const dbRecord = await prisma.timetable_tb.findFirst({
        where: { planId: createdPlanId },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.day).toBe(0); // Monday
      expect(dbRecord?.startPeriod).toBe(0);
      expect(dbRecord?.endPeriod).toBe(5); // 6 periods (0 to 5)

      // Reload page and verify assigned subject renders in the table
      await page.reload();
      await expect(
        page.locator("table tbody tr:first-child").getByText("TEST101")
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("3. Conflict handling: invalid drag overlap or boundary rejection", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByRole("tab", { name: "ผู้ดูแลระบบ" }).click();
    await page.locator("#admin-id").fill("admin");
    await page.locator("#admin-password").fill("admin123");
    await page
      .getByRole("tabpanel", { name: "ผู้ดูแลระบบ" })
      .getByRole("button", { name: "เข้าสู่ระบบ" })
      .click();
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Open pilot
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");

    // Locate assigned subject in table
    const assignedCard = page
      .locator("table tbody tr:first-child")
      .locator("text=TEST101")
      .first();
    await expect(assignedCard).toBeVisible({ timeout: 10000 });

    // Target the last column of the row where 6 periods will exceed table bounds
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

      // The subject must NOT be placed at last column (out of bounds)
      await page.waitForTimeout(500);
      // DB record should still remain at original startPeriod: 0
      const dbRecord = await prisma.timetable_tb.findFirst({
        where: { planId: createdPlanId },
      });
      expect(dbRecord?.startPeriod).toBe(0);
    }
  });
});
