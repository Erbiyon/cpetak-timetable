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

test.describe("Teacher Export Regression Integrity Suite", () => {
  let createdRoomId: number | null = null;
  let createdTeacherId: number | null = null;
  let createdPlanId: number | null = null;
  let createdTimetableId: number | null = null;
  const testTeacherName = "อาจารย์ทดสอบระบบ";
  const testTeacherLastName = "เอ็กเซล";

  test.beforeAll(async () => {
    // 1. Ensure termYear
    await prisma.termYear_tb.upsert({
      where: { id: 1 },
      update: { termYear: "1/2569" },
      create: { id: 1, termYear: "1/2569" },
    });

    // 2. Ensure test room
    let room = await prisma.room_tb.findFirst({
      where: { roomCode: "ROOM-TCHR-101" },
    });
    if (!room) {
      room = await prisma.room_tb.create({
        data: {
          roomCode: "ROOM-TCHR-101",
          roomType: "อาคารสาขาวิศวกรรมคอมพิวเตอร์",
          roomCate: "ห้องเรียน",
        },
      });
    }
    createdRoomId = room.id;

    // 3. Ensure test teacher with type 'อาจารย์ภายในสาขา'
    let teacher = await prisma.teacher_tb.findFirst({
      where: { tName: testTeacherName },
    });
    if (!teacher) {
      teacher = await prisma.teacher_tb.create({
        data: {
          tId: "T8888",
          tName: testTeacherName,
          tLastName: testTeacherLastName,
          teacherType: "อาจารย์ภายในสาขา",
        },
      });
    }
    createdTeacherId = teacher.id;

    // 4. Ensure test plan
    const plan = await prisma.plans_tb.create({
      data: {
        subjectCode: "TCHR-SUBJ-101",
        subjectName: "วิชาทดสอบการส่งออกตารางสอน",
        credit: 3,
        lectureHour: 2,
        labHour: 2,
        section: "1",
        planType: "FOUR_YEAR",
        yearLevel: "ปี 1",
        termYear: "1/2569",
        roomId: room.id,
        teacherId: teacher.id,
      },
    });
    createdPlanId = plan.id;

    // 5. Create timetable entry for this teacher
    const timetable = await prisma.timetable_tb.create({
      data: {
        teacherId: teacher.id,
        planId: plan.id,
        roomId: room.id,
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 2, // อังคาร
        startPeriod: 2,
        endPeriod: 6,
        termYear: "1/2569",
      },
    });
    createdTimetableId = timetable.id;
  });

  test.afterAll(async () => {
    if (createdTimetableId) {
      await prisma.timetable_tb.deleteMany({ where: { id: createdTimetableId } });
    }
    if (createdPlanId) {
      await prisma.plans_tb.deleteMany({ where: { id: createdPlanId } });
    }
    if (createdTeacherId) {
      await prisma.teacher_tb.deleteMany({ where: { id: createdTeacherId } });
    }
    if (createdRoomId) {
      await prisma.room_tb.deleteMany({ where: { id: createdRoomId } });
    }
    await prisma.$disconnect();
  });

  test("should load /class-schedule, show Download Teacher Button, and download valid .xlsx workbook", async ({
    page,
  }) => {
    await page.goto("/class-schedule");
    await page.waitForLoadState("networkidle");

    // Look for DownloadTeacherButton
    const downloadBtn = page.getByRole("button", { name: "ดาวน์โหลดตารางสอน" });
    await expect(downloadBtn).toBeVisible({ timeout: 15000 });
    await expect(downloadBtn).toBeEnabled();

    // Trigger download
    const downloadPromise = page.waitForEvent("download");
    await downloadBtn.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toContain(testTeacherName);
    expect(suggestedFilename).toContain(".xlsx");

    const stream = await download.createReadStream();
    expect(stream).toBeTruthy();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify workbook content using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    expect(worksheet).toBeDefined();

    const textValues: string[] = [];
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value) {
          textValues.push(String(cell.value));
        }
      });
    });

    const combinedText = textValues.join(" ");
    expect(combinedText).toContain(testTeacherName);
    expect(combinedText).toContain("TCHR-SUBJ-101");
    expect(combinedText).toContain("วิชาทดสอบการส่งออกตารางสอน");
  });
});

