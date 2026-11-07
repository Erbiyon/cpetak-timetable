import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

const CURRICULUM_CASES = [
  {
    planType: "TRANSFER",
    yearLevel: "ปี 1",
    path: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year",
    expectedPrefix: "ตารางเรียนเทียบโอน_ปี 1",
    subjectCode: "TRX101",
    subjectName: "Transfer Regression Subject",
  },
  {
    planType: "DVE-LVC",
    yearLevel: "ปี 1",
    path: "/adjust-time-tables/adjust-plan-dve/dve-one-year",
    expectedPrefix: "ตารางเรียนทค_ปวช._ปี 1",
    subjectCode: "LVC101",
    subjectName: "DVE LVC Regression Subject",
  },
  {
    planType: "DVE-MSIX",
    yearLevel: "ปี 1",
    path: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year",
    expectedPrefix: "ตารางเรียนทค_ม.6_ปี 1",
    subjectCode: "MSX101",
    subjectName: "DVE MSIX Regression Subject",
  },
];

test.describe("Cross-Curriculum Excel Export Integrity Suite", () => {
  const createdPlanIds: number[] = [];
  const createdTimetableIds: number[] = [];

  test.beforeAll(async () => {
    // Ensure termYear
    await prisma.termYear_tb.upsert({
      where: { id: 1 },
      update: { termYear: "1/2569" },
      create: { id: 1, termYear: "1/2569" },
    });

    for (const c of CURRICULUM_CASES) {
      const plan = await prisma.plans_tb.create({
        data: {
          subjectCode: c.subjectCode,
          subjectName: c.subjectName,
          credit: 3,
          lectureHour: 2,
          labHour: 1,
          planType: c.planType,
          yearLevel: c.yearLevel,
          termYear: "1/2569",
        },
      });
      createdPlanIds.push(plan.id);

      const record = await prisma.timetable_tb.create({
        data: {
          planId: plan.id,
          termYear: "1/2569",
          yearLevel: c.yearLevel,
          planType: c.planType,
          day: 1, // Tuesday
          startPeriod: 2,
          endPeriod: 7,
        },
      });
      createdTimetableIds.push(record.id);
    }
  });

  test.afterAll(async () => {
    if (createdTimetableIds.length > 0) {
      await prisma.timetable_tb.deleteMany({
        where: { id: { in: createdTimetableIds } },
      });
    }
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

  for (const c of CURRICULUM_CASES) {
    test(`Exports valid workbook for ${c.planType} (${c.yearLevel})`, async ({ page }) => {
      await page.goto(c.path);

      const downloadBtn = page.getByRole("button", { name: "ดาวน์โหลดตารางสอน" });
      await expect(downloadBtn).toBeVisible({ timeout: 10000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadBtn.click(),
      ]);

      const filename = download.suggestedFilename();
      expect(filename).toContain(c.expectedPrefix);
      expect(filename).toMatch(/.*\.xlsx$/);

      const stream = await download.createReadStream();
      expect(stream).not.toBeNull();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      expect(buffer.length).toBeGreaterThan(1000);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.worksheets[0];
      let foundSubject = false;
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value && cell.value.toString().includes(c.subjectCode)) {
            foundSubject = true;
          }
        });
      });
      expect(foundSubject).toBe(true);
    });
  }
});
