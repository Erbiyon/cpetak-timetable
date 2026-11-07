import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Dedicated isolated E2E database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

const DVE_MS_PAGES = [
  {
    yearNum: 1,
    yearLevel: "ปี 1",
    route: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year",
    title: "ตารางเรียน ปวส. ปี 1 (ม.6)",
    planData: {
      subjectCode: "MS101",
      subjectName: "DVE MS Year 1 Subject",
      credit: 3,
      lectureHour: 2,
      labHour: 1,
      planType: "DVE-MSIX",
      yearLevel: "ปี 1",
      termYear: "1/2569",
    },
  },
  {
    yearNum: 2,
    yearLevel: "ปี 2",
    route: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year",
    title: "ตารางเรียน ปวส. ปี 2 (ม.6)",
    planData: {
      subjectCode: "MS201",
      subjectName: "DVE MS Year 2 Subject",
      credit: 3,
      lectureHour: 2,
      labHour: 1,
      planType: "DVE-MSIX",
      yearLevel: "ปี 2",
      termYear: "1/2569",
    },
  },
];

test.describe("DVE MS All Years Multi-Assignment Regression Suite", () => {
  const createdPlanIds: number[] = [];

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

    // 3. Clean up existing synthetic test plans
    const existing = await prisma.plans_tb.findMany({
      where: { subjectCode: { in: ["MS101", "MS201"] } },
    });
    for (const p of existing) {
      await prisma.timetable_tb.deleteMany({ where: { planId: p.id } });
      await prisma.plans_tb.delete({ where: { id: p.id } });
    }

    // 4. Create synthetic plans for Year 1 and 2
    for (const pageCfg of DVE_MS_PAGES) {
      const plan = await prisma.plans_tb.create({
        data: pageCfg.planData,
      });
      createdPlanIds.push(plan.id);
    }
  });

  test.afterAll(async () => {
    for (const planId of createdPlanIds) {
      await prisma.timetable_tb.deleteMany({ where: { planId } });
      await prisma.plans_tb.deleteMany({ where: { id: planId } });
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

  for (const pageCfg of DVE_MS_PAGES) {
    test(`Verify DVE-MS ${pageCfg.yearLevel}: page render, pointer DnD, persistence and isolation`, async ({
      page,
    }) => {
      // 1. Navigate to route
      await page.goto(pageCfg.route);
      await expect(page).toHaveURL(new RegExp(pageCfg.route.split("/").pop()!));

      // 2. Verify title and controls
      await expect(page.getByText(pageCfg.title)).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByRole("button", { name: /จัดตารางทั้งหลักสูตร/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /ล้างทั้งหลักสูตร/ })).toBeVisible();

      // 3. Verify grid days
      await expect(page.getByRole("cell", { name: "จ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "อ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "พ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "พฤ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "ศ.", exact: true })).toBeVisible();

      // 4. Verify subject exists in pool
      await expect(page.getByText(pageCfg.planData.subjectCode)).toBeVisible({ timeout: 10000 });

      // 5. Locate subject card
      const subjectCard = page
        .locator(`text=${pageCfg.planData.subjectCode}`)
        .locator(
          "xpath=ancestor::div[contains(@class, 'rounded') and contains(@class, 'border') and (contains(@class, 'w-[120px]') or contains(@class, 'cursor-grab'))]"
        )
        .first();
      await expect(subjectCard).toBeVisible();

      // 6. Target Monday Period 1 (1st row after header, 2nd column)
      const targetCell = page.locator("table tbody tr:first-child td:nth-child(2)");
      await expect(targetCell).toBeVisible();

      const sourceBox = await subjectCard.boundingBox();
      const targetBox = await targetCell.boundingBox();
      expect(sourceBox).not.toBeNull();
      expect(targetBox).not.toBeNull();

      // 7. Perform real pointer DnD exceeding 8px threshold
      const startX = sourceBox!.x + sourceBox!.width / 2;
      const startY = sourceBox!.y + sourceBox!.height / 2;
      const endX = targetBox!.x + targetBox!.width / 2;
      const endY = targetBox!.y + targetBox!.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.waitForTimeout(100);

      await page.mouse.move(startX, startY - 20, { steps: 5 });
      await page.waitForTimeout(150);

      await page.mouse.move(endX, endY, { steps: 25 });
      await page.waitForTimeout(300);

      // Listen for timetable API call
      const [apiRes] = await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("/api/timetable") && resp.request().method() === "POST" && resp.status() === 200,
          { timeout: 10000 }
        ),
        page.mouse.up(),
      ]);
      expect(apiRes.status()).toBe(200);

      // 8. Verify DB mutation in isolated timetable_e2e
      const createdRecord = await prisma.timetable_tb.findFirst({
        where: {
          plan: { subjectCode: pageCfg.planData.subjectCode },
          day: 0,
          startPeriod: 0,
        },
      });
      expect(createdRecord).not.toBeNull();
      expect(createdRecord?.yearLevel).toBe(pageCfg.yearLevel);
      expect(createdRecord?.planType).toBe("DVE-MSIX");

      // 9. Reload and verify persistence
      await page.reload();
      await expect(page.getByText(pageCfg.title)).toBeVisible({
        timeout: 15000,
      });

      const cellWithSubject = page
        .locator("table tbody tr:first-child")
        .getByText(pageCfg.planData.subjectCode);
      await expect(cellWithSubject).toBeVisible({ timeout: 10000 });
    });
  }
});
