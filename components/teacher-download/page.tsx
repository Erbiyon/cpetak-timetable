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
    plan: {
        subjectCode: string;
        subjectName: string;
        section: string;
        credit: number;
        lectureHour: number;
        labHour: number;
        curriculum?: string;
        year?: string;
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
}

export default function DownloadTeacherButton({
    selectedTeacher,
    currentTermYear,
    timetables = []
}: DownloadTeacherButtonProps) {
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
            worksheet.mergeCells(options.merge);
        }

        return cell; // เพิ่ม return cell
    };

    // Initialize worksheet with basic settings
    const initializeWorksheet = (workbook: ExcelJS.Workbook) => {
        const worksheet = workbook.addWorksheet('ตารางประจำตัวผู้สอน');

        // Set properties
        worksheet.properties.defaultRowHeight = 21;
        worksheet.getColumn(1).width = 2.50;

        // Set column widths - Column B onwards = 8.1
        for (let col = 2; col <= 31; col++) {
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
        createStyledCell(worksheet, 1, 19, "หน่วย");
        createStyledCell(worksheet, 1, 20, "คาบเรียน", { merge: 'T1:W1' });
        createStyledCell(worksheet, 1, 24, "จำนวน คาบเรียน/สัปดาห์", { merge: 'X1:AA1' });
        createStyledCell(worksheet, 1, 28, "นศ.รอบ(คน)", { merge: 'AB1:AC1' });
        createStyledCell(worksheet, 1, 30, "ห้องเรียน", { merge: 'AD1:AD2' });

        // Row 2 - Sub headers
        createStyledCell(worksheet, 2, 1, scheduleData.title2, { merge: 'A2:E2' });
        const subHeaders = ["วิชา", "กิต", "ท", "ป", "น", "ร", "ระดับ", "หลักสูฟตร/ชั้นปี", "ป", "ส", "ป", "ส"];
        subHeaders.forEach((text, index) => {
            createStyledCell(worksheet, 2, 18 + index, text);
        });
    };

    // Create data rows (Rows 3-14) with real timetable data
    const createDataRows = (worksheet: ExcelJS.Worksheet) => {
        // รวบรวมข้อมูลวิชาที่สอนจากตารางเรียน
        const uniqueSubjects = new Map();

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

                    uniqueSubjects.set(key, {
                        ...item.plan,
                        room: item.room,
                        periodsPerWeek
                    });
                }
            }
        });

        const subjectsArray = Array.from(uniqueSubjects.values());

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
                worksheet.mergeCells(`H${row}:Q${row}`);
                createStyledCell(worksheet, row, 8, subject.subjectName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });

                // Column R - ยังไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 18, "");

                // หน่วยกิต (Column S) 
                createStyledCell(worksheet, row, 19, subject.credit || 0);

                // คาบเรียน ท น น ร (Columns T-W)
                const lectureHour = subject.lectureHour || 0;
                const labHour = subject.labHour || 0;
                createStyledCell(worksheet, row, 20, lectureHour);           // ท
                createStyledCell(worksheet, row, 21, labHour);               // ป (labHour)
                createStyledCell(worksheet, row, 22, "");                    // น - ยังไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 23, lectureHour + labHour); // ร = ท + ป

                // ระดับ (Column X)
                const levelInfo = getLevel(subject);
                createStyledCell(worksheet, row, 24, levelInfo);

                // หลักสูตร/ชั้นปี (Column Y) - ใส่ข้อมูลหลักสูตรชั้นปี
                const curriculumInfo = getCurriculumInfo(subject);
                createStyledCell(worksheet, row, 25, curriculumInfo);

                // จำนวนคาบเรียน/สัปดาห์ ป ส ป ส (Columns Z-AC)
                const totalHours = lectureHour + labHour; // ร
                createStyledCell(worksheet, row, 26, totalHours);  // ป = ร
                createStyledCell(worksheet, row, 27, "");          // ส - ยังไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 28, "");          // ป - ยังไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 29, "");          // ส - ยังไม่ต้องใส่ข้อมูล

                // นศ.รอบ(คน) - ยังไม่ต้องใส่ข้อมูล
                createStyledCell(worksheet, row, 30, "");
                createStyledCell(worksheet, row, 31, "");

                // ห้องเรียน (Column AD - 30)
                createStyledCell(worksheet, row, 30, subject.room?.roomCode || "");

                // Column AE (31) - ไม่มีขอบ
                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";
                // ไม่ใส่ border สำหรับ column AE
            } else {
                // แถวว่าง - เพิ่มกรอบให้ทุก column

                // รหัสวิชา (Column G)
                createStyledCell(worksheet, row, 7, "");

                // ชื่อวิชา (Columns H:Q)
                worksheet.mergeCells(`H${row}:Q${row}`);
                createStyledCell(worksheet, row, 8, "");

                // Add borders to remaining columns (R:AD)
                for (let col = 18; col <= 30; col++) { // ถึง column AD เท่านั้น
                    createStyledCell(worksheet, row, col, "");
                }

                // Column AE (31) - ไม่มีขอบ
                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";
                // ไม่ใส่ border สำหรับ column AE
            }
        }

        // เพิ่มข้อมูลภาคเรียนและอาจารย์
        // Merge BCDE แถว 4 ใส่ ภาคเรียนที่ (เลข) ปีการศึกษา (เลขปีการศึกษา)
        worksheet.mergeCells('B4:E4');
        const termInfo = currentTermYear ? `ภาคเรียนที่ ${currentTermYear.split('/')[0]} ปีการศึกษา ${currentTermYear.split('/')[1]}` : '';
        createStyledCell(worksheet, 4, 2, termInfo, {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });

        // Merge BCDE แถว 6 ใส่ชื่อนามสกุลอาจารย์
        worksheet.mergeCells('B6:E6');
        const teacherName = selectedTeacher ? `${selectedTeacher.tName} ${selectedTeacher.tLastName}` : '';
        createStyledCell(worksheet, 6, 2, teacherName, {
            alignment: { horizontal: 'left', vertical: 'middle' }
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
        const totalPeriodsPerWeek = subjectsArray.reduce((sum, subject) => sum + (subject.periodsPerWeek || 0), 0);

        // หน่วยกิตรวม (Column S)
        createStyledCell(worksheet, 15, 19, totalCredits);

        // คาบเรียนรวม ท น น ร (Columns T-W)
        createStyledCell(worksheet, 15, 20, totalLectureHours);                    // ท
        createStyledCell(worksheet, 15, 21, totalLabHours);                        // ป (labHour)
        createStyledCell(worksheet, 15, 22, "");                                   // น - ยังไม่ต้องใส่ข้อมูล
        createStyledCell(worksheet, 15, 23, totalLectureHours + totalLabHours);    // ร = ท + ป

        // ระดับ และ หลักสูตร/ชั้นปี - ยังไม่ต้องใส่ข้อมูล
        createStyledCell(worksheet, 15, 24, "");
        createStyledCell(worksheet, 15, 25, "");

        // จำนวนคาบเรียนรวม/สัปดาห์ ป ส ป ส (Columns Z-AC)
        const totalRHours = totalLectureHours + totalLabHours; // ร
        createStyledCell(worksheet, 15, 26, totalRHours);      // ป = ร
        createStyledCell(worksheet, 15, 27, "");               // ส - ยังไม่ต้องใส่ข้อมูล

        // Create "รวมคาบสอน" cell
        createStyledCell(worksheet, 15, 28, "รวมคาบสอน", { merge: 'AB15:AC15' });
        createStyledCell(worksheet, 15, 30, totalRHours);

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
        worksheet.mergeCells('A16:A18');

        // Time headers
        createStyledCell(worksheet, 16, 2, 'เวลา');
        createStyledCell(worksheet, 17, 2, 'คาบ');
        createStyledCell(worksheet, 18, 2, 'คาบ(ทะเบียนกลาง)', { font: { size: 9 } });

        // Time slots and period numbers
        const timeSlots = scheduleData.timeSlot;
        const mergeRangesRow16 = [
            'C16:D16', 'E16:F16', 'G16:H16', 'I16:J16', 'K16:L16', 'M16:N16',
            'O16:P16', 'Q16:R16', 'S16:T16', 'U16:V16', 'W16:X16', 'Y16:Z16',
            'AA16:AB16', 'AC16:AD16'
        ];
        const mergeRangesRow17 = [
            'C17:D17', 'E17:F17', 'G17:H17', 'I17:J17', 'K17:L17', 'M17:N17',
            'O17:P17', 'Q17:R17', 'S17:T17', 'U17:V17', 'W17:X17', 'Y17:Z17',
            'AA17:AB17', 'AC17:AD17'
        ];

        // Create time slots (row 16)
        timeSlots.forEach((timeSlot, index) => {
            const colStart = 3 + (index * 2); // Starting from column C (3)
            createStyledCell(worksheet, 16, colStart, timeSlot, { merge: mergeRangesRow16[index] });
        });

        // Create period numbers (row 17)
        timeSlots.forEach((_, index) => {
            const colStart = 3 + (index * 2); // Starting from column C (3)
            createStyledCell(worksheet, 17, colStart, (index + 1).toString(), { merge: mergeRangesRow17[index] });
        });

        // Create numbers 1-25 in row 18 starting from column C
        for (let i = 1; i <= 25; i++) {
            const col = 2 + i; // Starting from column C (3)
            createStyledCell(worksheet, 18, col, i.toString());
        }

        // Create days of week in column A starting from row 19 (each day has 2 rows)
        scheduleData.day.forEach((day, index) => {
            const startRow = 19 + (index * 2); // Each day takes 2 rows
            const endRow = startRow + 1;
            createStyledCell(worksheet, startRow, 1, day, { merge: `A${startRow}:A${endRow}` });
        });

        // Create education levels in column B for each day
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

            // วนลูปสำหรับแต่ละคาบในวัน
            for (let period = 0; period < 25; period++) {
                const col = 3 + period; // Column starts from C (3)

                // ปวส. row
                const pvsRow = startRow;
                // ป.ตรี row  
                const btechRow = startRow + 1;

                // เฉพาะวันพุธ (dayIndex === 2) คาบ 15-18 (period 14-17) แสดง "กิจกรรม"
                if (dayIndex === 2 && period === 14) {
                    // Merge คาบ 15-18 (4 คาบ) และ merge 2 แถว
                    const startCol = String.fromCharCode(67 + period); // คาบ 15 = column P
                    const endCol = String.fromCharCode(67 + 17); // คาบ 18 = column S
                    worksheet.mergeCells(`${startCol}${pvsRow}:${endCol}${btechRow}`);

                    const activityCell = createStyledCell(worksheet, pvsRow, col, "กิจกรรม", {
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

                if (subjectInPeriod && subjectInPeriod.plan) {
                    // ถ้าเป็นคาบแรกของวิชานี้ ให้แสดงชื่อวิชา
                    if (period === subjectInPeriod.startPeriod) {
                        const colspan = subjectInPeriod.endPeriod - subjectInPeriod.startPeriod + 1;

                        // สร้างข้อความแสดงในเซลล์: รหัสวิชา ชื่อวิชา หลักสูตรชั้นปี
                        const curriculumInfo = getCurriculumType(subjectInPeriod.plan);
                        const subjectText = `${subjectInPeriod.plan.subjectCode} ${subjectInPeriod.plan.subjectName} ${curriculumInfo}`;

                        // Merge 2 rows เฉพาะเมื่อมีข้อมูล
                        if (colspan > 1) {
                            // Merge across columns and merge 2 rows vertically
                            const endCol = String.fromCharCode(67 + subjectInPeriod.endPeriod);
                            const startCol = String.fromCharCode(67 + period);
                            worksheet.mergeCells(`${startCol}${pvsRow}:${endCol}${btechRow}`);
                        } else {
                            // Merge 2 rows vertically for single period
                            worksheet.mergeCells(`${String.fromCharCode(67 + period)}${pvsRow}:${String.fromCharCode(67 + period)}${btechRow}`);
                        }

                        createStyledCell(worksheet, pvsRow, col, subjectText, {
                            font: { size: 14, bold: false },
                            alignment: { horizontal: 'center', vertical: 'middle' }
                        });
                    }
                } else {
                    // เซลล์ว่าง - เพิ่มเฉพาะ border (ไม่ merge)
                    createStyledCell(worksheet, pvsRow, col, "");
                    createStyledCell(worksheet, btechRow, col, "");
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
    };

    // Download Excel file
    const downloadExcel = async (buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);

        // สร้างชื่อไฟล์ที่มีชื่ออาจารย์และภาคเรียน
        const teacherName = selectedTeacher ? `${selectedTeacher.tName}_${selectedTeacher.tLastName}` : 'อาจารย์';
        const termYear = currentTermYear || 'ภาคเรียน';
        const fileName = `ตารางประจำตัวผู้สอน_${teacherName}_${termYear}.xlsx`;

        const a = Object.assign(document.createElement('a'), {
            href: url,
            download: fileName
        });
        a.click();

        URL.revokeObjectURL(url);
    };

    const generateExcelDownload = async () => {
        try {
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
    }

    return (
        <Button
            variant="secondary"
            onClick={generateExcelDownload}
            className="flex items-center gap-2"
            disabled={!selectedTeacher || !currentTermYear || timetables.length === 0}
        >
            <Download className="h-4 w-4" />
            ดาวน์โหลดตารางสอน
        </Button>
    );
}