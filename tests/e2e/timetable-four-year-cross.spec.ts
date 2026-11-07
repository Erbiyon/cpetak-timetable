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

const YEARS = [
  { level: "ปี 1", code: "CPE101", name: "Intro to Computing", path: "/adjust-time-tables/adjust-plan-four-year/four-one-year", header: "ตารางเรียน 4 ปี ปี 1" },
  { level: "ปี 2", code: "CPE201", name: "Data Structures", path: "/adjust-time-tables/adjust-plan-four-year/four-two-year", header: "ตารางเรียน 4 ปี ปี 2" },
  { level: "ปี 3", code: "CPE301", name: "Operating Systems", path: "/adjust-time-tables/adjust-plan-four-year/four-three-year", header: "ตารางเรียน 4 ปี ปี 3" },
  { level: "ปี 4", code: "CPE401", name: "Senior Project", path: "/adjust-time-tables/adjust-plan-four-year/four-four-year", header: "ตารางเรียน 4 ปี ปี 4" },
];

test.describe("Four-Year Complete Regression Hardening (Years 1 to 4)", () => {
  const createdPlanIds: number[] = [];

  test.beforeAll(async () => {
    // 1. Verify we are targeting the isolated test database
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

    // 3. Create synthetic subjects for each year
    for (const yr of YEARS) {
      const plan = await prisma.plans_tb.create({
        data: {
          subjectCode: yr.code,
          subjectName: yr.name,
          credit: 3,
          lectureHour: 2,
          labHour: 1, // 6 periods total
          planType: "FOUR_YEAR",
          yearLevel: yr.level,
          termYear: "1/2569",
        },
      });
      createdPlanIds.push(plan.id);
    }
  });

  test.afterAll(async () => {
    // Clean up created synthetic test records safely
    if (createdPlanIds.length > 0) {
      await prisma.timetable_tb.deleteMany({
        where: { planId: { in: createdPlanIds } },
      });
      await prisma.plans_tb.deleteMany({
        where: { id: { in: createdPlanIds } },
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

  for (let i = 0; i < YEARS.length; i++) {
    const yr = YEARS[i];

    test(`Verify ${yr.level}: subject filtering, real pointer DnD mutation, DB persistence and cross-year isolation`, async ({
      page,
    }) => {
      await page.goto(yr.path);
      await expect(page).toHaveURL(new RegExp(yr.path));

      // 1. Verify header renders
      await expect(page.getByText(new RegExp(yr.header))).toBeVisible({ timeout: 20000 });

      // 2. Verify year-specific subject isolation: yr.code must be present, other codes must NOT be present
      await expect(page.getByText(yr.code)).toBeVisible({ timeout: 10000 });
      for (const otherYr of YEARS) {
        if (otherYr.code !== yr.code) {
          await expect(page.locator("text=" + otherYr.code)).toHaveCount(0);
        }
      }

      // 3. Locate draggable card and target cell (Day 0: Monday, Column 2: Period 1)
      const subjectCard = page
        .locator("text=" + yr.code)
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

        // 4. Verify DB persistence directly in timetable_e2e
        const planId = createdPlanIds[i];
        const dbRecord = await prisma.timetable_tb.findFirst({
          where: { planId },
        });
        expect(dbRecord).not.toBeNull();
        expect(dbRecord?.day).toBe(0);
        expect(dbRecord?.startPeriod).toBe(0);
        expect(dbRecord?.endPeriod).toBe(5);
        expect(dbRecord?.yearLevel).toBe(yr.level);

        // 5. Reload page and verify assigned subject renders in the table
        await page.reload();
        await expect(
          page.locator("table tbody tr:first-child").getByText(yr.code)
        ).toBeVisible({ timeout: 10000 });
      }
    });
  }
});
