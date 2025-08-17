"use client"

import React from 'react';
import ExcelJS from "exceljs";
import { Download } from "lucide-react";
import { Button } from "../ui/button";

type ScheduleData = {
    title1: string;
    title2: string;
    term: string;
    semester: string;
    fname: string;
    lname: string;
    day: string[];
    timeSlot: string[];
}

type CellOptions = {
    merge?: string;
    font?: { size?: number; bold?: boolean };
    alignment?: {
        horizontal?: 'center' | 'left' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
        vertical?: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify'
    };
}

type TeacherData = {
    id: number;
    tName: string;
    tLastName: string;
    tId: string;
    teacherType: string;
}

type TimetableData = {
    teacherId: number;
    termYear: string;
    day: number;
    startPeriod: number;
    endPeriod: number;
    planType?: string;
    yearLevel?: string;
    plan: {
        subjectCode: string;
        subjectName: string;
        section: string;
        credit: number;
        lectureHour: number;
        labHour: number;
        curriculum?: string;
        year?: string;
        planType?: string;
        yearLevel?: string;
    };
    room: {
        roomCode: string;
    };
    teacher: TeacherData;
}

interface DownloadTeacherButtonProps {
    selectedTeacher?: TeacherData;
    currentTermYear?: string;
    timetables?: TimetableData[];
    onRefreshData?: () => Promise<void> | void;
}

export default function DownloadButtonTimetable({
    selectedTeacher,
    currentTermYear,
    timetables = [],
    onRefreshData
}: DownloadTeacherButtonProps) {

    // ฟังก์ชันกำหนดข้อมูลหลักสูตรจาก timetables
    const getCurriculumInfo = () => {
        if (timetables.length === 0) return { curriculum: 'หลักสูตรไม่ระบุ', filePrefix: 'ตารางเรียน' };

        // ใช้ข้อมูลจากรายการแรกเป็นตัวแทน
        const firstItem = timetables[0];
        const planType = firstItem.plan?.planType;
        const yearLevel = firstItem.plan?.yearLevel;

        switch (planType) {
            case 'TRANSFER':
                return {
                    curriculum: `หลักสูตร : วศ.บ.วิศวกรรมคอมพิวเตอร์ เทียบโอน ${yearLevel || ''}`,
                    filePrefix: `ตารางเรียนเทียบโอน_${yearLevel || ''}`
                };
            case 'FOUR_YEAR':
                return {
                    curriculum: `หลักสูตร : วศ.บ.วิศวกรรมคอมพิวเตอร์ 4 ปี ${yearLevel || ''}`,
                    filePrefix: `ตารางเรียน4ปี_${yearLevel || ''}`
                };
            case 'DVE-LVC':
                return {
                    curriculum: `หลักสูตร : ทค.เทคนิคคอมพิวเตอร์ ${yearLevel || ''}`,
                    filePrefix: `ตารางเรียนทค_ปวช._${yearLevel || ''}`
                };
            case 'DVE-MSIX':
                return {
                    curriculum: `หลักสูตร : ทค.เทคนิคคอมพิวเตอร์ ${yearLevel || ''}`,
                    filePrefix: `ตารางเรียนทค_ม.6_${yearLevel || ''}`
                };
            default:
                return { curriculum: 'หลักสูตร : ไม่ระบุ', filePrefix: 'ตารางเรียน' };
        }
    };

    const curriculumInfo = getCurriculumInfo();

    const scheduleData: ScheduleData = {
        title1: "มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก",
        title2: "ตารางประจำตัวผู้สอนและปริมาณงานสอนของข้าราชการครู",
        term: currentTermYear || "ภาคเรียนที่ x",
        semester: "ปีการศึกษา",
        fname: selectedTeacher?.tName || "ชื่อ",
        lname: selectedTeacher?.tLastName || "นามสกุล",
        day: ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."],
        timeSlot: [
            "08.00-09.00", "09.00-10.00", "10.00-11.00", "11.00-12.00",
            "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00",
            "16.00-17.00", "17.00-18.00", "18.00-19.00", "19.00-20.00",
            "20.00-21.00", "21.00-22.00"
        ]
    }

    // Helper function to convert column number to Excel column letter
    const getColumnLetter = (colNumber: number): string => {
        let result = '';
        while (colNumber > 0) {
            colNumber--;
            result = String.fromCharCode(65 + (colNumber % 26)) + result;
            colNumber = Math.floor(colNumber / 26);
        }
        return result;
    };

    // Helper function to safely merge cells
    const safeMergeCells = (worksheet: ExcelJS.Worksheet, range: string, description?: string) => {
        try {
            worksheet.mergeCells(range);
        } catch (error) {
            console.warn(`Failed to merge cells ${range}${description ? ` (${description})` : ''}:`, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    // Helper function to create and style cells
    const createStyledCell = (
        worksheet: ExcelJS.Worksheet,
        row: number,
        col: number,
        value: string | number,
        options?: CellOptions
    ) => {
        const cell = worksheet.getCell(row, col);
        cell.value = value;

        // Default styling
        cell.font = {
            name: 'TH Sarabun New',
            size: options?.font?.size || 14,
            bold: options?.font?.bold || false
        };
        cell.alignment = {
            horizontal: options?.alignment?.horizontal || 'center',
            vertical: options?.alignment?.vertical || 'middle'
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        if (options?.merge) {
            try {
                worksheet.mergeCells(options.merge);
            } catch (error) {
                // Handle already merged cells error or invalid merge range
                console.warn(`Failed to merge cells ${options.merge}:`, error instanceof Error ? error.message : 'Unknown error');
                // Continue without merging - the cell content will still be set
            }
        }

        return cell;
    };

    // Initialize worksheet with basic settings
    const initializeWorksheet = (workbook: ExcelJS.Workbook) => {
        const worksheet = workbook.addWorksheet('ตารางประจำตัวผู้สอน');

        // Set properties
        worksheet.properties.defaultRowHeight = 21;
        worksheet.getColumn(1).width = 2.50;

        // Set column widths - Column B onwards = 8.1
        for (let col = 2; col <= 31; col++) { // เหลือถึง column AE (31) เท่านั้น
            worksheet.getColumn(col).width = 8.1;
        }

        return worksheet;
    };

    // Create main headers (Rows 1-2)
    const createMainHeaders = (worksheet: ExcelJS.Worksheet) => {
        // Row 1 - Main headers
        createStyledCell(worksheet, 1, 1, scheduleData.title1, { merge: 'A1:E1' });
        createStyledCell(worksheet, 1, 6, "ที่", { merge: 'F1:F2' });
        createStyledCell(worksheet, 1, 7, "รหัสวิชา", { merge: 'G1:G2' });
        createStyledCell(worksheet, 1, 8, "ชื่อวิชา", { merge: 'H1:Q2' });
        createStyledCell(worksheet, 1, 18, "สภาพ");
        createStyledCell(worksheet, 1, 19, "หน่วยกิต", { merge: 'S1:U1' }); // merge S T U เป็น หน่วยกิต
        createStyledCell(worksheet, 1, 22, "คาบเรียน", { merge: 'V1:X1' }); // แก้ไขให้ merge V W X เท่านั้น
        createStyledCell(worksheet, 1, 25, "อาจารย์ผู้สอน", { merge: 'Y1:AA2' }); // merge Y Z AA ทั้งแถว 1 และ 2
        createStyledCell(worksheet, 1, 28, "ห้องเรียน", { merge: 'AB1:AD2' }); // merge AB AC AD ทั้งแถว 1 และ 2

        // Row 2 - Sub headers
        // ยกเลิกการ merge A2:E2 และไม่ใส่ข้อความ
        createStyledCell(worksheet, 2, 1, "");
        createStyledCell(worksheet, 2, 2, "");
        createStyledCell(worksheet, 2, 3, "");
        createStyledCell(worksheet, 2, 4, "");
        createStyledCell(worksheet, 2, 5, "");

        // สำหรับคอลัมน์ R
        createStyledCell(worksheet, 2, 18, "วิชา");

        // สำหรับคอลัมน์ S T U ใส่ ท ป หน่วยกิต ตามลำดับ
        createStyledCell(worksheet, 2, 19, "ท");          // S = ท
        createStyledCell(worksheet, 2, 20, "ป");          // T = ป
        createStyledCell(worksheet, 2, 21, "ร");          // U = ร

        // คาบเรียน headers (V W X) ใส่ ท ป น
        createStyledCell(worksheet, 2, 22, "ท");  // V = ท
        createStyledCell(worksheet, 2, 23, "ป");  // W = ป
        createStyledCell(worksheet, 2, 24, "น");  // X = น

        // คอลัมน์ Y Z AA ถูก merge แล้วเป็น "อาจารย์ผู้สอน" ไม่ต้องใส่อะไรเพิ่ม

        // คอลัมน์ AB AC AD ถูก merge แล้วเป็น "ห้องเรียน" ไม่ต้องใส่อะไรเพิ่ม
    };

    // Create data rows (Rows 3-14) with real timetable data
    const createDataRows = (worksheet: ExcelJS.Worksheet) => {
        // รวบรวมข้อมูลวิชาที่สอนจากตารางเรียน
        const uniqueSubjects = new Map();

        console.log("Processing timetables for data rows:", timetables);

        // วนหาวิชาที่ไม่ซ้ำจากตารางเรียน
        timetables.forEach(item => {
            if (item.plan) {
                const key = `${item.plan.subjectCode}-${item.plan.section}`;
                if (!uniqueSubjects.has(key)) {
                    // คำนวณคาบเรียนต่อสัปดาห์
                    const periodsPerWeek = timetables
                        .filter(t => t.plan &&
                            t.plan.subjectCode === item.plan.subjectCode &&
                            t.plan.section === item.plan.section)
                        .reduce((total, t) => total + (t.endPeriod - t.startPeriod + 1), 0);

                    console.log(`Subject ${item.plan.subjectCode}: ${periodsPerWeek} periods per week`);

                    uniqueSubjects.set(key, {
                        ...item.plan,
                        room: item.room,
                        teacher: item.teacher,
                        periodsPerWeek
                    });
                }
            }
        });

        const subjectsArray = Array.from(uniqueSubjects.values());
        console.log("Unique subjects for table:", subjectsArray);

        for (let row = 3; row <= 14; row++) {
            const subjectIndex = row - 3;

            // Row number in column F
            createStyledCell(worksheet, row, 6, row - 2);

            if (subjectIndex < subjectsArray.length) {
                const subject = subjectsArray[subjectIndex];

                // Helper function to get level for Column X
                const getLevel = (plan: any) => {
                    if (!plan.planType) return "";

                    switch (plan.planType) {
                        case "TRANSFER":
                        case "FOUR_YEAR":
                            return "ป.ตรี";
                        case "DVE_LVC":
                        case "DVE_MSIX":
                            return "ปวส.";
                        default:
                            return "";
                    }
                };

                // Helper function to get curriculum type for data rows
                const getCurriculumInfo = (plan: any) => {
                    if (!plan.planType) return "";

                    // รับค่าปีจาก yearLevel และตัด "ปี " ออก (ถ้ามี)
                    const yearValue = plan.yearLevel ? plan.yearLevel.toString().replace(/ปี\s*/g, '') : "";

                    switch (plan.planType) {
                        case "TRANSFER":
                            return yearValue ? `วศ.บ. วค.${yearValue}(ทอ.)` : `วศ.บ. วค.1 หรือ 2 หรือ 3(ทอ.)`;
                        case "FOUR_YEAR":
                            return yearValue ? `วศ.บ. วค.${yearValue}(4 ปี)` : `วศ.บ. วค.1 หรือ 2 หรือ 3 หรือ 4(4 ปี)`;
                        case "DVE_LVC":
                        case "DVE_MSIX":
                            return yearValue ? `ทค.${yearValue}` : `ทค.1 หรือ 2`;
                        default:
                            return "";
                    }
                };

                // รหัสวิชา (Column G)
                createStyledCell(worksheet, row, 7, subject.subjectCode, {
                    alignment: { horizontal: 'center', vertical: 'middle' }
                });

                // ชื่อวิชา (Columns H:Q) - ไม่จัดกึ่งกลาง
                safeMergeCells(worksheet, `H${row}:Q${row}`, 'subject name');
                createStyledCell(worksheet, row, 8, subject.subjectName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });

                // Column R - ไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 18, "");

                // หน่วยกิต (Columns S T U) - ใส่เฉพาะหน่วยกิตใน U
                const credit = subject.credit || 0;
                const lectureHour = subject.lectureHour || 0;
                const labHour = subject.labHour || 0;

                createStyledCell(worksheet, row, 19, "");                    // S = ท (ยังไม่ใส่)
                createStyledCell(worksheet, row, 20, "");                    // T = ป (ยังไม่ใส่)
                createStyledCell(worksheet, row, 21, credit);                // U = ร (หน่วยกิต)

                // คาบเรียน ท ป น (Columns V-X) - ใส่ข้อมูล V W
                createStyledCell(worksheet, row, 22, lectureHour);           // V = ท (ชั่วโมงบรรยาย)
                createStyledCell(worksheet, row, 23, labHour);               // W = ป (ชั่วโมงปฏิบัติ)
                createStyledCell(worksheet, row, 24, "");                    // X = น (ว่าง)

                // อาจารย์ผู้สอน (Columns Y:AA - merge) - ใช้ข้อมูลจากตารางเรียน
                safeMergeCells(worksheet, `Y${row}:AA${row}`, 'teacher name');
                const teacherName = subject.teacher ?
                    `${subject.teacher.tName} ${subject.teacher.tLastName}` : '';
                createStyledCell(worksheet, row, 25, teacherName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });

                // ห้องเรียน (Columns AB:AD - merge) - ใช้ข้อมูลจากตารางเรียน
                safeMergeCells(worksheet, `AB${row}:AD${row}`, 'room code');
                const roomCode = subject.room?.roomCode || "";
                createStyledCell(worksheet, row, 28, roomCode, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });

                // Column AE (31) - ไม่มีขอบ
                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";
                // ไม่ใส่ border สำหรับ column AE
            } else {
                // แถวว่าง - เพิ่มกรอบให้ทุก column

                // รหัสวิชา (Column G)
                createStyledCell(worksheet, row, 7, "");

                // ชื่อวิชา (Columns H:Q)
                safeMergeCells(worksheet, `H${row}:Q${row}`, 'empty row subject name');
                createStyledCell(worksheet, row, 8, "");

                // Column R
                createStyledCell(worksheet, row, 18, "");

                // หน่วยกิต (Columns S T U) - แยกแต่ละคอลัมน์
                createStyledCell(worksheet, row, 19, "");  // S
                createStyledCell(worksheet, row, 20, "");  // T
                createStyledCell(worksheet, row, 21, "");  // U

                // คาบเรียน (Columns V:X)
                createStyledCell(worksheet, row, 22, "");  // V
                createStyledCell(worksheet, row, 23, "");  // W
                createStyledCell(worksheet, row, 24, "");  // X

                // อาจารย์ผู้สอน (Columns Y:AA - merge)
                safeMergeCells(worksheet, `Y${row}:AA${row}`, 'empty row teacher');
                createStyledCell(worksheet, row, 25, "");

                // ห้องเรียน (Columns AB:AD - merge)
                safeMergeCells(worksheet, `AB${row}:AD${row}`, 'empty row room');
                createStyledCell(worksheet, row, 28, "");

                // Column AE (31) - ไม่มีขอบ
                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";
                // ไม่ใส่ border สำหรับ column AE
            }
        }

        // เพิ่มข้อมูลแถว 3: ตารางเรียนประจำคณะวิศวกรรมศาสตร์
        // Merge BCDE แถว 3 ใส่ ตารางเรียนประจำคณะวิศวกรรมศาสตร์
        safeMergeCells(worksheet, 'B3:E3', 'faculty title');
        createStyledCell(worksheet, 3, 2, 'ตารางเรียนประจำคณะวิศวกรรมศาสตร์', {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });

        // แถว 4: ภาคเรียนและปีการศึกษา (merge B-E)
        safeMergeCells(worksheet, 'B4:E4', 'term year');
        const termInfo = currentTermYear ? `ภาคเรียนที่ ${currentTermYear.split('/')[0]} ปีการศึกษา ${currentTermYear.split('/')[1]}` : 'ภาคเรียนที่ x ปีการศึกษา xxxx';
        createStyledCell(worksheet, 4, 2, termInfo, {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });

        // แถว 5: สาขาวิศวกรรมไฟฟ้า (merge B-E)
        safeMergeCells(worksheet, 'B5:E5', 'department');
        createStyledCell(worksheet, 5, 2, 'สาขาวิศวกรรมไฟฟ้า', {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });

        // แถว 6: หลักสูตร (merge B-E) ขนาดตัวอักษร 12
        safeMergeCells(worksheet, 'B6:E6', 'curriculum');
        createStyledCell(worksheet, 6, 2, curriculumInfo.curriculum, {
            alignment: { horizontal: 'left', vertical: 'middle' },
            font: { size: 12, bold: false }
        });
    };

    // Create summary row (Row 15) with calculated totals
    const createSummaryRow = (worksheet: ExcelJS.Worksheet) => {
        createStyledCell(worksheet, 15, 6, "รวม", { merge: 'F15:R15' });

        // คำนวณค่ารวมจากข้อมูลจริง
        const uniqueSubjects = new Map();
        timetables.forEach(item => {
            if (item.plan) {
                const key = `${item.plan.subjectCode}-${item.plan.section}`;
                if (!uniqueSubjects.has(key)) {
                    const periodsPerWeek = timetables
                        .filter(t => t.plan &&
                            t.plan.subjectCode === item.plan.subjectCode &&
                            t.plan.section === item.plan.section)
                        .reduce((total, t) => total + (t.endPeriod - t.startPeriod + 1), 0);

                    uniqueSubjects.set(key, {
                        ...item.plan,
                        periodsPerWeek
                    });
                }
            }
        });

        const subjectsArray = Array.from(uniqueSubjects.values());

        // คำนวณผลรวม
        const totalCredits = subjectsArray.reduce((sum, subject) => sum + (subject.credit || 0), 0);
        const totalLectureHours = subjectsArray.reduce((sum, subject) => sum + (subject.lectureHour || 0), 0);
        const totalLabHours = subjectsArray.reduce((sum, subject) => sum + (subject.labHour || 0), 0);

        // หน่วยกิตรวม (Columns S T U) - ใส่เฉพาะหน่วยกิตรวมใน U
        createStyledCell(worksheet, 15, 19, "");                                  // S = ท (ยังไม่ใส่)
        createStyledCell(worksheet, 15, 20, "");                                  // T = ป (ยังไม่ใส่)  
        createStyledCell(worksheet, 15, 21, totalCredits);                        // U = ร (หน่วยกิตรวม)

        // คาบเรียนรวม ท ป น (Columns V-X) - ใส่ข้อมูล V W
        createStyledCell(worksheet, 15, 22, totalLectureHours);                   // V = ท (ชั่วโมงบรรยายรวม)
        createStyledCell(worksheet, 15, 23, totalLabHours);                       // W = ป (ชั่วโมงปฏิบัติรวม)
        createStyledCell(worksheet, 15, 24, "");                                  // X = น (ว่าง)

        // Merge Y-AD (คอลัมน์ 25-30) - อาจารย์และห้องเรียนรวมกัน
        safeMergeCells(worksheet, `Y15:AD15`, 'summary row teacher and room');
        createStyledCell(worksheet, 15, 25, "", {
            alignment: { horizontal: 'center', vertical: 'middle' }
        });

        // Column AE (31) แถว 15 - ไม่มีขอบ
        const cellAE15 = worksheet.getCell(15, 31);
        cellAE15.value = "";
        // ไม่ใส่ border สำหรับ column AE แถว 15
    };

    // Set borders for main table area
    const setBorders = (worksheet: ExcelJS.Worksheet) => {
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 5; col++) {
                const cell = worksheet.getCell(row, col);
                const borders: any = {};

                if (row === 1) borders.top = { style: 'thin' };
                if (row === 15) borders.bottom = { style: 'thin' };
                if (col === 1) borders.left = { style: 'thin' };
                if (col === 5) borders.right = { style: 'thin' };

                cell.border = borders;
            }
        }
    };

    // Create time table headers
    const createTimeTableHeaders = (worksheet: ExcelJS.Worksheet) => {
        // Day column
        createStyledCell(worksheet, 16, 1, 'วัน');
        safeMergeCells(worksheet, 'A16:A18', 'day column header');

        // Time headers
        createStyledCell(worksheet, 16, 2, 'เวลา');
        createStyledCell(worksheet, 17, 2, 'คาบ');
        createStyledCell(worksheet, 18, 2, 'คาบ(ทะเบียนกลาง)', { font: { size: 9 } });

        // Time slots and period numbers
        const timeSlots = scheduleData.timeSlot;
        // จำกัดจำนวน time slots ไม่ให้เกิน 14 ช่วง (เพื่อไม่ให้เกินคอลัมน์ AD)
        const maxTimeSlots = Math.min(timeSlots.length, 14);

        // Create time slots (row 16) with dynamic merging
        for (let index = 0; index < maxTimeSlots; index++) {
            const colStart = 3 + (index * 2); // Starting from column C (3)
            const colEnd = colStart + 1; // Next column for merging

            const startCol = getColumnLetter(colStart);
            const endCol = getColumnLetter(colEnd);
            const mergeRange = `${startCol}16:${endCol}16`;

            // ตรวจสอบไม่ให้เกินคอลัมน์ AD (30)
            if (colEnd <= 30) {
                safeMergeCells(worksheet, mergeRange, `time slot ${index + 1}`);
                createStyledCell(worksheet, 16, colStart, timeSlots[index]);
            }
        }

        // Create period numbers (row 17) with dynamic merging
        for (let index = 0; index < maxTimeSlots; index++) {
            const colStart = 3 + (index * 2); // Starting from column C (3)
            const colEnd = colStart + 1; // Next column for merging

            const startCol = getColumnLetter(colStart);
            const endCol = getColumnLetter(colEnd);
            const mergeRange = `${startCol}17:${endCol}17`;

            // ตรวจสอบไม่ให้เกินคอลัมน์ AD (30)
            if (colEnd <= 30) {
                safeMergeCells(worksheet, mergeRange, `period number ${index + 1}`);
                createStyledCell(worksheet, 17, colStart, (index + 1).toString());
            }
        }

        // Create numbers 1-28 in row 18 starting from column C (จำกัดไม่ให้เกิน AD)
        for (let i = 1; i <= 28; i++) {
            const col = 2 + i; // Starting from column C (3)
            if (col <= 30) { // ไม่เกินคอลัมน์ AD (30)
                createStyledCell(worksheet, 18, col, i.toString());
            }
        }

        // Create days of week in column A starting from row 19 (each day has 2 rows)
        scheduleData.day.forEach((day, index) => {
            const startRow = 19 + (index * 2); // Each day takes 2 rows
            const endRow = startRow + 1;
            const mergeRange = `A${startRow}:A${endRow}`;

            // First merge the cells, then create the styled cell
            safeMergeCells(worksheet, mergeRange, `day ${day}`);
            createStyledCell(worksheet, startRow, 1, day);
        });        // Create education levels in column B for each day
        scheduleData.day.forEach((_, index) => {
            const startRow = 19 + (index * 2); // Starting from row 19, each day takes 2 rows
            createStyledCell(worksheet, startRow, 2, "ปวส."); // First row of each day
            createStyledCell(worksheet, startRow + 1, 2, "ป.ตรี"); // Second row of each day
        });

        // Helper function to get curriculum type based on plan data
        const getCurriculumType = (plan: any) => {
            if (!plan.planType) return "";

            // รับค่าปีจาก yearLevel และตัด "ปี " ออก (ถ้ามี)
            const yearValue = plan.yearLevel ? plan.yearLevel.toString().replace(/ปี\s*/g, '') : "";

            switch (plan.planType) {
                case "TRANSFER":
                    return yearValue ? `วศ.บ. วค.${yearValue}(ทอ.)` : `วศ.บ. วค.1 หรือ 2 หรือ 3(ทอ.)`;
                case "FOUR_YEAR":
                    return yearValue ? `วศ.บ. วค.${yearValue}(4 ปี)` : `วศ.บ. วค.1 หรือ 2 หรือ 3 หรือ 4(4 ปี)`;
                case "DVE_LVC":
                case "DVE_MSIX":
                    return yearValue ? `ทค.${yearValue}` : `ทค.1 หรือ 2`;
                default:
                    return "";
            }
        };

        // Add timetable data to the schedule - merge only when there is data
        scheduleData.day.forEach((day, dayIndex) => {
            const startRow = 19 + (dayIndex * 2); // Starting from row 19, each day takes 2 rows

            // กรองข้อมูลตารางเรียนสำหรับวันนี้
            const dayTimetables = timetables.filter(item => item.day === dayIndex);

            // Debug: แสดงข้อมูลตารางเรียนของวันนี้
            if (dayTimetables.length > 0) {
                console.log(`Day ${dayIndex} (${day}) has ${dayTimetables.length} subjects:`,
                    dayTimetables.map(t => `${t.plan?.subjectCode} (${t.startPeriod}-${t.endPeriod})`));
            }

            // วนลูปสำหรับแต่ละคาบในวัน (จำกัดไม่ให้เกิน 28 คาบ ตามจำนวนคอลัมน์ที่มี)
            for (let period = 0; period < 28; period++) {
                const col = 3 + period; // Column starts from C (3)

                // ตรวจสอบไม่ให้เกินคอลัมน์ AD (30)
                if (col > 30) break;

                // ปวส. row
                const pvsRow = startRow;
                // ป.ตรี row  
                const btechRow = startRow + 1;

                // เฉพาะวันพุธ (dayIndex === 2) คาบ 15-18 (period 14-17) แสดง "กิจกรรม"
                if (dayIndex === 2 && period === 14) {
                    // Merge คาบ 15-18 (period 14-17 ใน database) = 4 คาบ
                    // period 14 (คาบ 15) = column index 17 = column R
                    // period 17 (คาบ 18) = column index 20 = column U  
                    const startColIndex = 3 + 14; // period 14 -> column R
                    const endColIndex = 3 + 17;   // period 17 -> column U

                    const startCol = getColumnLetter(startColIndex); // R
                    const endCol = getColumnLetter(endColIndex);     // U
                    const mergeRange = `${startCol}${pvsRow}:${endCol}${btechRow}`;

                    safeMergeCells(worksheet, mergeRange, 'activity period');

                    const activityCell = createStyledCell(worksheet, pvsRow, startColIndex, "กิจกรรม", {
                        font: { size: 14, bold: true },
                        alignment: { horizontal: 'center', vertical: 'middle' }
                    });

                    // เพิ่มสีพื้นหลัง
                    activityCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE6E6FA' } // สีม่วงอ่อน
                    };
                    continue; // ข้ามไปคาบถัดไป
                }

                // ข้ามคาบ 16-18 ในวันพุธ (period 15-17) เพราะถูก merge แล้ว
                if (dayIndex === 2 && period >= 15 && period <= 17) {
                    continue;
                }

                // หาวิชาที่สอนในคาบนี้
                const subjectInPeriod = dayTimetables.find(item =>
                    period >= item.startPeriod && period <= item.endPeriod
                );

                // Debug: แสดงการตรวจสอบคาบ
                if (period >= 15 && period <= 17 && dayIndex === 0) { // Debug เฉพาะวันจันทร์ คาบ 16-18
                    console.log(`Period ${period} (display: ${period + 1}):`,
                        subjectInPeriod ? `Found ${subjectInPeriod.plan?.subjectCode}` : 'No subject');
                }

                if (subjectInPeriod && subjectInPeriod.plan) {
                    // ถ้าเป็นคาบแรกของวิชานี้ ให้แสดงชื่อวิชาและ merge
                    if (period === subjectInPeriod.startPeriod) {
                        const colspan = subjectInPeriod.endPeriod - subjectInPeriod.startPeriod + 1;

                        // สร้างข้อความแสดงในเซลล์: รหัสวิชา ชื่อวิชา ท.(ตัวเลข) ป.(ตัวเลข)
                        const lectureHour = subjectInPeriod.plan.lectureHour || 0;
                        const labHour = subjectInPeriod.plan.labHour || 0;
                        const hourInfo = `ท.${lectureHour} ป.${labHour}`;
                        const subjectText = `${subjectInPeriod.plan.subjectCode} ${subjectInPeriod.plan.subjectName} ${hourInfo}`;

                        // คำนวณ column letters สำหรับ merge range โดยใช้ฟังก์ชัน getColumnLetter
                        // Database เก็บ period เป็น 0-24, Excel column เริ่มจาก C (คอลัมน์ที่ 3)
                        // period 0 = column C (index 3), period 1 = column D (index 4), etc.
                        const startColIndex = 3 + subjectInPeriod.startPeriod; // Column index for startPeriod  
                        const endColIndex = 3 + subjectInPeriod.endPeriod;     // Column index for endPeriod

                        const startColLetter = getColumnLetter(startColIndex);
                        const endColLetter = getColumnLetter(endColIndex);

                        // Merge 2 rows เฉพาะเมื่อมีข้อมูล
                        if (colspan > 1) {
                            // Merge across columns and merge 2 rows vertically
                            const mergeRange = `${startColLetter}${pvsRow}:${endColLetter}${btechRow}`;
                            safeMergeCells(worksheet, mergeRange, `subject multiple periods: ${subjectInPeriod.plan.subjectCode} (periods ${subjectInPeriod.startPeriod + 1}-${subjectInPeriod.endPeriod + 1})`);
                        } else {
                            // Merge 2 rows vertically for single period
                            const mergeRange = `${startColLetter}${pvsRow}:${startColLetter}${btechRow}`;
                            safeMergeCells(worksheet, mergeRange, `subject single period: ${subjectInPeriod.plan.subjectCode} (period ${subjectInPeriod.startPeriod + 1})`);
                        }

                        // ใส่ข้อความในเซลล์แรกของ range ที่ merge
                        createStyledCell(worksheet, pvsRow, startColIndex, subjectText, {
                            font: { size: 14, bold: false },
                            alignment: { horizontal: 'center', vertical: 'middle' }
                        });

                        // Debug: แสดงข้อมูลการ merge
                        console.log(`Merged subject: ${subjectInPeriod.plan.subjectCode}, DB periods: ${subjectInPeriod.startPeriod}-${subjectInPeriod.endPeriod}, Excel columns: ${startColLetter}-${endColLetter} (${startColIndex}-${endColIndex})`);
                        console.log(`Subject text: "${subjectText}"`);
                        console.log(`Placed in row ${pvsRow}, column ${startColIndex} (${startColLetter})`);
                    } else {
                        // คาบอื่นๆ ของวิชาเดียวกัน - ไม่ต้องทำอะไร (เพราะถูก merge แล้ว)
                        console.log(`Skipping period ${period} (display: ${period + 1}) for subject ${subjectInPeriod.plan.subjectCode} - already merged`);
                    }
                } else {
                    // เซลล์ว่าง - เพิ่มเฉพาะ border (ไม่ merge)
                    // ตรวจสอบว่าเซลล์นี้ไม่ได้เป็นส่วนหนึ่งของการ merge แล้ว
                    const cell = worksheet.getCell(pvsRow, col);
                    if (!cell.isMerged) {
                        createStyledCell(worksheet, pvsRow, col, "");
                        createStyledCell(worksheet, btechRow, col, "");
                    }
                }
            }
        });

        // Add borders to columns C-AD for rows 18-32 (skip cells that already have data)
        for (let row = 18; row <= 32; row++) { // เปลี่ยนกลับเป็น 32 เพราะใช้ 2 แถวต่อวัน
            for (let col = 3; col <= 30; col++) { // Column C (3) to AD (30) - ไม่รวม AE
                const cell = worksheet.getCell(row, col);
                // Only add borders if cell is empty or doesn't have a value
                if (!cell.value) {
                    createStyledCell(worksheet, row, col, "");
                } else {
                    // Just add borders to existing cells without changing their value
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }

            // Column AE (31) - ไม่มีขอบ แต่ใส่ค่าว่าง
            const cellAE = worksheet.getCell(row, 31);
            cellAE.value = "";
            // ไม่ใส่ border สำหรับ column AE
        }

        // จัดการ Column AE สำหรับแถว 3-15 (ตารางข้อมูล) ให้ไม่มีขอบ
        for (let row = 3; row <= 15; row++) {
            const cellAE = worksheet.getCell(row, 31);
            cellAE.value = "";
            cellAE.border = {}; // ลบ borders ทั้งหมด
        }
    }; // ปิดฟังก์ชัน addTimetableData

    // Download Excel file
    const downloadExcel = async (buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);

        // สร้างชื่อไฟล์ที่สอดคล้องกับข้อมูล
        const termYear = currentTermYear || 'ภาคเรียน';
        const fileName = `${curriculumInfo.filePrefix}_${termYear}.xlsx`;

        const a = Object.assign(document.createElement('a'), {
            href: url,
            download: fileName
        });
        a.click();

        URL.revokeObjectURL(url);
    };

    const generateExcelDownload = async () => {
        try {
            // Refresh ข้อมูลก่อนที่จะสร้าง Excel
            if (onRefreshData) {
                await onRefreshData();
            }

            // ตรวจสอบข้อมูลอีกครั้งหลังจาก refresh
            if (!timetables || timetables.length === 0) {
                alert("ไม่มีข้อมูลตารางเรียน กรุณาเพิ่มข้อมูลก่อนดาวน์โหลด");
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = initializeWorksheet(workbook);

            // Build the Excel structure
            createMainHeaders(worksheet);
            createDataRows(worksheet);
            createSummaryRow(worksheet);
            setBorders(worksheet);
            createTimeTableHeaders(worksheet);

            // Generate and download file
            const buffer = await workbook.xlsx.writeBuffer();
            await downloadExcel(buffer);

        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง");
        }
    }; // แก้ไขการปิดฟังก์ชัน

    // ตรวจสอบว่ามีข้อมูลในตารางเรียนหรือไม่
    const hasData = timetables && timetables.length > 0;

    return (
        <Button
            variant="secondary"
            onClick={generateExcelDownload}
            className="flex items-center gap-2"
            disabled={!hasData}
        >
            <Download className="h-4 w-4" />
            {hasData ? "ดาวน์โหลดตารางสอน" : "ไม่มีข้อมูลตารางเรียน"}
        </Button>
    );
}