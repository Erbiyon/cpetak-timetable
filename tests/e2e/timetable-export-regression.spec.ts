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

const EXPORT_SUBJECT = {
  subjectCode: "XLS101",
  subjectName: "Excel Export Test Subject",
  credit: 3,
  lectureHour: 2,
  labHour: 1,
  planType: "FOUR_YEAR",
  yearLevel: "ปี 1",
  termYear: "1/2569",
};

test.describe("Timetable Excel Export Characterization & Regression Suite", () => {
  let createdPlanId: number;
  let createdTimetableId: number;

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

    // 3. Create synthetic subject
    const plan = await prisma.plans_tb.create({
      data: EXPORT_SUBJECT,
    });
    createdPlanId = plan.id;

    // 4. Create an assignment in timetable_tb so hasData is true and export is enabled
    const record = await prisma.timetable_tb.create({
      data: {
        planId: createdPlanId,
        termYear: "1/2569",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 0, // Monday
        startPeriod: 0,
        endPeriod: 5,
      },
    });
    createdTimetableId = record.id;
  });

  test.afterAll(async () => {
    if (createdTimetableId) {
      await prisma.timetable_tb.deleteMany({
        where: { id: createdTimetableId },
      });
    }
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

  test("1. Verifies Excel Export button triggers download and workbook contains valid structure and Thai text", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*four-one-year.*/);

    // Locate the Excel download button
    const downloadBtn = page.getByRole("button", { name: "ดาวน์โหลดตารางสอน" });
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
    await expect(downloadBtn).toBeEnabled();

    // Trigger download and catch download event
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click(),
    ]);

    const suggestedFilename = download.suggestedFilename();
    console.log("Downloaded filename:", suggestedFilename);
    expect(suggestedFilename).toMatch(/.*\.xlsx$/);
    expect(suggestedFilename).toContain("ตารางเรียน");

    // Read download stream and verify with ExcelJS in test runner
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

    expect(workbook.worksheets.length).toBeGreaterThan(0);
    const worksheet = workbook.worksheets[0];
    console.log("Worksheet title:", worksheet.name);

    // Verify cell contents including Thai headers and subject
    const cellA1 = worksheet.getCell("A1").value?.toString() || "";
    expect(cellA1).toContain("มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก");

    // Verify timetable structure contains our subject code
    let foundSubject = false;
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && cell.value.toString().includes("XLS101")) {
          foundSubject = true;
        }
      });
    });
    expect(foundSubject).toBe(true);
  });

  test("2. Verifies second export succeeds consecutively without errors", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*four-one-year.*/);

    const downloadBtn = page.getByRole("button", { name: "ดาวน์โหลดตารางสอน" });
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });

    // First download
    const [download1] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click(),
    ]);
    expect(download1.suggestedFilename()).toMatch(/.*\.xlsx$/);

    // Second download
    const [download2] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click(),
    ]);
    expect(download2.suggestedFilename()).toMatch(/.*\.xlsx$/);
  });
});
