"use client";
import React from 'react';
import ExcelJS from "exceljs";
import { Download } from "lucide-react";
import { Button } from "../ui/button";

interface ScheduleData {
    title1: string;
    title2: string;
    term: string;
    semester: string;
    fname: string;
    lname: string;
    curriculum: string;
    day: string[];
    timeSlot: string[];
    timetables: {
        period: number;
        day: string;
        subject: string;
        room: string;
        planType: string;
        yearLevel: string;
    }[];
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
}

export default function DownloadTeacherButton({
    selectedTeacher,
    currentTermYear,
    timetables = []
}: DownloadTeacherButtonProps) {


    const getCurriculumInfo = () => {
        if (timetables.length === 0) return { curriculum: 'หลักสูตรไม่ระบุ', filePrefix: 'ตารางสอน' };


        const firstItem = timetables[0];
        const planType = firstItem.plan?.planType;
        const yearLevel = firstItem.plan?.yearLevel;

        switch (planType) {
            case 'TRANSFER':
                return {
                    curriculum: `หลักสูตร : วศ.บ.วิศวกรรมคอมพิวเตอร์ เทียบโอน ${yearLevel || ''}`,
                    filePrefix: `ตารางสอนเทียบโอน_${yearLevel || ''}`
                };
            case 'FOUR_YEAR':
                return {
                    curriculum: `หลักสูตร : วศ.บ.วิศวกรรมคอมพิวเตอร์ 4 ปี ${yearLevel || ''}`,
                    filePrefix: `ตารางสอน4ปี_${yearLevel || ''}`
                };
            case 'DVE-LVC':
                return {
                    curriculum: `หลักสูตร : ทค.เทคนิคคอมพิวเตอร์ ${yearLevel || ''}`,
                    filePrefix: `ตารางสอนทค_${yearLevel || ''}`
                };
            case 'DVE-MSIX':
                return {
                    curriculum: `หลักสูตร : ทค.เทคนิคคอมพิวเตอร์ ${yearLevel || ''}`,
                    filePrefix: `ตารางสอนทค_ม.6_${yearLevel || ''}`
                };
            default:
                return { curriculum: 'หลักสูตร : ไม่ระบุ', filePrefix: 'ตารางสอน' };
        }
    };

    const curriculumInfo = getCurriculumInfo();


    const enhancedScheduleData: ScheduleData = {
        title1: "มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก",
        title2: "ตารางประจำตัวผู้สอนและปริมาณงานสอนของข้าราชการครู",
        term: currentTermYear || "ภาคเรียนที่ x",
        semester: "ปีการศึกษา",
        fname: selectedTeacher?.tName || "ชื่อ",
        lname: selectedTeacher?.tLastName || "นามสกุล",
        curriculum: curriculumInfo.curriculum,
        day: ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."],
        timeSlot: [
            "08.00-09.00", "09.00-10.00", "10.00-11.00", "11.00-12.00",
            "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00",
            "16.00-17.00", "17.00-18.00", "18.00-19.00", "19.00-20.00",
            "20.00-21.00", "21.00-22.00"
        ],
        timetables: timetables.map(item => ({
            period: item.startPeriod,
            day: item.day.toString(),
            subject: item.plan?.subjectName || 'ไม่ระบุ',
            room: item.room?.roomCode || 'ไม่ระบุ',
            planType: item.plan?.planType || 'ไม่ระบุ',
            yearLevel: item.plan?.yearLevel || 'ไม่ระบุ'
        }))
    }


    const getColumnLetter = (colNumber: number): string => {
        let result = '';
        while (colNumber > 0) {
            colNumber--;
            result = String.fromCharCode(65 + (colNumber % 26)) + result;
            colNumber = Math.floor(colNumber / 26);
        }
        return result;
    };


    const createStyledCell = (
        worksheet: ExcelJS.Worksheet,
        row: number,
        col: number,
        value: string | number,
        options?: CellOptions
    ) => {
        const cell = worksheet.getCell(row, col);
        cell.value = value;


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

                console.warn(`Cells ${options.merge} are already merged or overlapping`);
            }
        }

        return cell;
    };


    const initializeWorksheet = (workbook: ExcelJS.Workbook) => {
        const worksheet = workbook.addWorksheet('ตารางประจำตัวผู้สอน');


        worksheet.properties.defaultRowHeight = 21;
        worksheet.getColumn(1).width = 2.50;


        for (let col = 2; col <= 31; col++) {
            worksheet.getColumn(col).width = 8.1;
        }

        return worksheet;
    };


    const createMainHeaders = (worksheet: ExcelJS.Worksheet) => {

        createStyledCell(worksheet, 1, 1, enhancedScheduleData.title1, { merge: 'A1:E1' });
        createStyledCell(worksheet, 1, 6, "ที่", { merge: 'F1:F2' });
        createStyledCell(worksheet, 1, 7, "รหัสวิชา", { merge: 'G1:G2' });
        createStyledCell(worksheet, 1, 8, "ชื่อวิชา", { merge: 'H1:Q2' });
        createStyledCell(worksheet, 1, 18, "สภาพ");
        createStyledCell(worksheet, 1, 19, "หน่วย");
        createStyledCell(worksheet, 1, 20, "คาบเรียน", { merge: 'T1:W1' });
        createStyledCell(worksheet, 1, 24, "จำนวน คาบเรียน/สัปดาห์", { merge: 'X1:AA1' });
        createStyledCell(worksheet, 1, 28, "นศ.รอบ(คน)", { merge: 'AB1:AC1' });
        createStyledCell(worksheet, 1, 30, "ห้องเรียน", { merge: 'AD1:AD2' });


        createStyledCell(worksheet, 2, 1, enhancedScheduleData.title2, { merge: 'A2:E2' });
        const subHeaders = ["วิชา", "กิต", "ท", "ป", "น", "ร", "ระดับ", "หลักสูฟตร/ชั้นปี", "ป", "ส", "ป", "ส"];
        subHeaders.forEach((text, index) => {
            createStyledCell(worksheet, 2, 18 + index, text);
        });
    };


    const createDataRows = (worksheet: ExcelJS.Worksheet) => {

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
                        room: item.room,
                        periodsPerWeek
                    });
                }
            }
        });

        const subjectsArray = Array.from(uniqueSubjects.values());

        for (let row = 3; row <= 14; row++) {
            const subjectIndex = row - 3;


            createStyledCell(worksheet, row, 6, row - 2);

            if (subjectIndex < subjectsArray.length) {
                const subject = subjectsArray[subjectIndex];


                const getLevel = (plan: any) => {
                    if (!plan.planType) return "";

                    switch (plan.planType) {
                        case "TRANSFER":
                        case "FOUR_YEAR":
                            return "ป.ตรี";
                        case "DVE-LVC":
                        case "DVE-MSIX":
                            return "ปวส.";
                        default:
                            return "";
                    }
                };


                const getCurriculumInfo = (plan: any) => {
                    if (!plan.planType) return "";


                    const yearValue = plan.yearLevel ? plan.yearLevel.toString().replace(/ปี\s*/g, '') : "";

                    switch (plan.planType) {
                        case "TRANSFER":
                            return yearValue ? `วศ.บ. วค.${yearValue}(ทอ.)` : `วศ.บ. วค.1 หรือ 2 หรือ 3(ทอ.)`;
                        case "FOUR_YEAR":
                            return yearValue ? `วศ.บ. วค.${yearValue}(4 ปี)` : `วศ.บ. วค.1 หรือ 2 หรือ 3 หรือ 4(4 ปี)`;
                        case "DVE-LVC":
                        case "DVE-MSIX":
                            return yearValue ? `ทค.${yearValue}` : `ทค.1 หรือ 2`;
                        default:
                            return "";
                    }
                };


                createStyledCell(worksheet, row, 7, subject.subjectCode, {
                    alignment: { horizontal: 'center', vertical: 'middle' }
                });


                worksheet.mergeCells(`H${row}:Q${row}`);
                createStyledCell(worksheet, row, 8, subject.subjectName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });


                createStyledCell(worksheet, row, 18, "");


                createStyledCell(worksheet, row, 19, subject.credit || 0);


                const lectureHour = subject.lectureHour || 0;
                const labHour = subject.labHour || 0;
                createStyledCell(worksheet, row, 20, lectureHour);
                createStyledCell(worksheet, row, 21, labHour);
                createStyledCell(worksheet, row, 22, "");
                createStyledCell(worksheet, row, 23, lectureHour + labHour);


                const levelInfo = getLevel(subject);
                createStyledCell(worksheet, row, 24, levelInfo);


                const curriculumInfo = getCurriculumInfo(subject);
                createStyledCell(worksheet, row, 25, curriculumInfo);


                const totalHours = lectureHour + labHour;
                createStyledCell(worksheet, row, 26, totalHours);
                createStyledCell(worksheet, row, 27, "");
                createStyledCell(worksheet, row, 28, "");
                createStyledCell(worksheet, row, 29, "");


                createStyledCell(worksheet, row, 30, "");
                createStyledCell(worksheet, row, 31, "");


                createStyledCell(worksheet, row, 30, subject.room?.roomCode || "");


                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";

            } else {



                createStyledCell(worksheet, row, 7, "");


                worksheet.mergeCells(`H${row}:Q${row}`);
                createStyledCell(worksheet, row, 8, "");


                for (let col = 18; col <= 30; col++) {
                    createStyledCell(worksheet, row, col, "");
                }


                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";

            }
        }



        worksheet.mergeCells('B4:E4');
        const termInfo = currentTermYear ? `ภาคเรียนที่ ${currentTermYear.split('/')[0]} ปีการศึกษา ${currentTermYear.split('/')[1]}` : '';
        createStyledCell(worksheet, 4, 2, termInfo, {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });


        worksheet.mergeCells('B6:E6');
        const teacherName = selectedTeacher ? `${selectedTeacher.tName} ${selectedTeacher.tLastName}` : '';
        createStyledCell(worksheet, 6, 2, teacherName, {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });
    };


    const createSummaryRow = (worksheet: ExcelJS.Worksheet) => {
        createStyledCell(worksheet, 15, 6, "รวม", { merge: 'F15:R15' });


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


        const totalCredits = subjectsArray.reduce((sum, subject) => sum + (subject.credit || 0), 0);
        const totalLectureHours = subjectsArray.reduce((sum, subject) => sum + (subject.lectureHour || 0), 0);
        const totalLabHours = subjectsArray.reduce((sum, subject) => sum + (subject.labHour || 0), 0);

        createStyledCell(worksheet, 15, 19, totalCredits);


        createStyledCell(worksheet, 15, 20, totalLectureHours);
        createStyledCell(worksheet, 15, 21, totalLabHours);
        createStyledCell(worksheet, 15, 22, "");
        createStyledCell(worksheet, 15, 23, totalLectureHours + totalLabHours);


        createStyledCell(worksheet, 15, 24, "");
        createStyledCell(worksheet, 15, 25, "");


        const totalRHours = totalLectureHours + totalLabHours;
        createStyledCell(worksheet, 15, 26, totalRHours);
        createStyledCell(worksheet, 15, 27, "");


        createStyledCell(worksheet, 15, 28, "รวมคาบสอน", { merge: 'AB15:AC15' });
        createStyledCell(worksheet, 15, 30, totalRHours);


        const cellAE15 = worksheet.getCell(15, 31);
        cellAE15.value = "";

    };


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


    const createTimeTableHeaders = (worksheet: ExcelJS.Worksheet) => {

        createStyledCell(worksheet, 16, 1, 'วัน');
        worksheet.mergeCells('A16:A18');


        createStyledCell(worksheet, 16, 2, 'เวลา');
        createStyledCell(worksheet, 17, 2, 'คาบ');
        createStyledCell(worksheet, 18, 2, 'คาบ(ทะเบียนกลาง)', { font: { size: 9 } });


        const timeSlots = enhancedScheduleData.timeSlot;
        const maxTimeSlots = Math.min(timeSlots.length, 14);

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


        for (let index = 0; index < maxTimeSlots; index++) {
            if (index < mergeRangesRow16.length) {
                const timeSlot = timeSlots[index];
                const colStart = 3 + (index * 2);
                safeMergeCells(worksheet, mergeRangesRow16[index]);
                createStyledCell(worksheet, 16, colStart, timeSlot, {
                    font: { size: 12, bold: false },
                    alignment: { horizontal: 'center', vertical: 'middle' }
                });
            }
        }


        for (let index = 0; index < maxTimeSlots; index++) {
            if (index < mergeRangesRow17.length) {
                const colStart = 3 + (index * 2);
                safeMergeCells(worksheet, mergeRangesRow17[index]);
                createStyledCell(worksheet, 17, colStart, (index + 1).toString(), {
                    font: { size: 12, bold: false },
                    alignment: { horizontal: 'center', vertical: 'middle' }
                });
            }
        }


        const maxPeriods = Math.min(28, 28);
        for (let i = 1; i <= maxPeriods; i++) {
            const col = 2 + i;
            if (col <= 30) {
                createStyledCell(worksheet, 18, col, i.toString());
            }
        }


        enhancedScheduleData.day.forEach((day: string, index: number) => {
            const startRow = 19 + (index * 2);
            const endRow = startRow + 1;
            createStyledCell(worksheet, startRow, 1, day, { merge: `A${startRow}:A${endRow}` });
        });


        enhancedScheduleData.day.forEach((_: string, index: number) => {
            const startRow = 19 + (index * 2);
            createStyledCell(worksheet, startRow, 2, "ปวส.");
            createStyledCell(worksheet, startRow + 1, 2, "ป.ตรี");
        });


        const getCurriculumType = (plan: any) => {
            if (!plan.planType) return "";


            const yearValue = plan.yearLevel ? plan.yearLevel.toString().replace(/ปี\s*/g, '') : "";

            switch (plan.planType) {
                case "TRANSFER":
                    return yearValue ? `วศ.บ. วค.${yearValue}(ทอ.)` : `วศ.บ. วค.1 หรือ 2 หรือ 3(ทอ.)`;
                case "FOUR_YEAR":
                    return yearValue ? `วศ.บ. วค.${yearValue}(4 ปี)` : `วศ.บ. วค.1 หรือ 2 หรือ 3 หรือ 4(4 ปี)`;
                case "DVE-LVC":
                case "DVE-MSIX":
                    return yearValue ? `ทค.${yearValue}` : `ทค.1 หรือ 2`;
                default:
                    return "";
            }
        };


        enhancedScheduleData.day.forEach((_day: string, dayIndex: number) => {
            const startRow = 19 + (dayIndex * 2);


            const dayTimetables = timetables.filter(item => item.day === dayIndex);


            const maxPeriodsInDay = Math.min(28, 28);
            for (let period = 0; period < maxPeriodsInDay; period++) {
                const col = 3 + period;


                if (col > 30) break;


                const pvsRow = startRow;

                const btechRow = startRow + 1;


                if (dayIndex === 2 && period === 14) {

                    const startCol = String.fromCharCode(67 + period);
                    const endCol = String.fromCharCode(67 + 17);
                    worksheet.mergeCells(`${startCol}${pvsRow}:${endCol}${btechRow}`);

                    const activityCell = createStyledCell(worksheet, pvsRow, col, "กิจกรรม", {
                        font: { size: 14, bold: true },
                        alignment: { horizontal: 'center', vertical: 'middle' }
                    });


                    activityCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE6E6FA' }
                    };
                    continue;
                }


                if (dayIndex === 2 && period >= 15 && period <= 17) {
                    continue;
                }


                const subjectInPeriod = dayTimetables.find(item =>
                    period >= item.startPeriod && period <= item.endPeriod
                );

                if (subjectInPeriod && subjectInPeriod.plan) {

                    if (period === subjectInPeriod.startPeriod) {
                        const colspan = subjectInPeriod.endPeriod - subjectInPeriod.startPeriod + 1;


                        const curriculumInfo = getCurriculumType(subjectInPeriod.plan);
                        const subjectText = `${subjectInPeriod.plan.subjectCode} ${subjectInPeriod.plan.subjectName} ${curriculumInfo}`;


                        if (colspan > 1) {

                            const safeEndPeriod = Math.min(subjectInPeriod.endPeriod, 27);
                            const endCol = getColumnLetter(3 + safeEndPeriod);
                            const startCol = getColumnLetter(3 + period);

                            safeMergeCells(worksheet, `${startCol}${pvsRow}:${endCol}${btechRow}`);
                        } else {

                            const colLetter = getColumnLetter(3 + period);
                            safeMergeCells(worksheet, `${colLetter}${pvsRow}:${colLetter}${btechRow}`);
                        }

                        createStyledCell(worksheet, pvsRow, col, subjectText, {
                            font: { size: 14, bold: false },
                            alignment: { horizontal: 'center', vertical: 'middle' }
                        });
                    }
                } else {

                    createStyledCell(worksheet, pvsRow, col, "");
                    createStyledCell(worksheet, btechRow, col, "");
                }
            }
        });


        for (let row = 18; row <= 32; row++) {
            for (let col = 3; col <= 30; col++) {
                const cell = worksheet.getCell(row, col);

                if (!cell.value) {
                    createStyledCell(worksheet, row, col, "");
                } else {

                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }


            const cellAE = worksheet.getCell(row, 31);
            cellAE.value = "";

        }


        for (let row = 3; row <= 15; row++) {
            const cellAE = worksheet.getCell(row, 31);
            cellAE.value = "";
            cellAE.border = {};
        }
    };


    const safeMergeCells = (worksheet: ExcelJS.Worksheet, range: string) => {
        try {
            worksheet.mergeCells(range);
        } catch (error) {
            console.warn(`Failed to merge cells ${range}:`, error);
        }
    };


    const addDetailedTimetable = (workbook: ExcelJS.Workbook) => {
        const detailWorksheet = workbook.addWorksheet('ตารางสอนรายละเอียด');


        detailWorksheet.columns = [
            { width: 15 },
            { width: 15 },
            { width: 25 },
            { width: 35 },
            { width: 15 },
            { width: 20 },
            { width: 15 }
        ];


        createStyledCell(detailWorksheet, 1, 1, enhancedScheduleData.title1, {
            font: { size: 16, bold: true },
            alignment: { horizontal: 'center' }
        });
        safeMergeCells(detailWorksheet, 'A1:G1');

        createStyledCell(detailWorksheet, 2, 1, enhancedScheduleData.title2, {
            font: { size: 14, bold: true },
            alignment: { horizontal: 'center' }
        });
        safeMergeCells(detailWorksheet, 'A2:G2');

        createStyledCell(detailWorksheet, 3, 1, enhancedScheduleData.curriculum, {
            font: { size: 12, bold: true },
            alignment: { horizontal: 'center' }
        });
        safeMergeCells(detailWorksheet, 'A3:G3');


        createStyledCell(detailWorksheet, 4, 1, `อาจารย์: ${enhancedScheduleData.fname} ${enhancedScheduleData.lname}`, {
            font: { size: 12 },
            alignment: { horizontal: 'left' }
        });
        safeMergeCells(detailWorksheet, 'A4:D4');

        createStyledCell(detailWorksheet, 4, 5, `ภาคเรียน: ${enhancedScheduleData.term}`, {
            font: { size: 12 },
            alignment: { horizontal: 'left' }
        });
        safeMergeCells(detailWorksheet, 'E4:G4');


        const headers = ['วัน', 'เวลา', 'รหัสวิชา', 'ชื่อวิชา', 'ห้องเรียน', 'หลักสูตร', 'ชั้นปี'];
        headers.forEach((header, index) => {
            createStyledCell(detailWorksheet, 6, index + 1, header, {
                font: { size: 12, bold: true },
                alignment: { horizontal: 'center' }
            });
        });


        let currentRow = 7;
        const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

        enhancedScheduleData.timetables.forEach(item => {
            const dayName = dayNames[parseInt(item.day) - 1] || 'ไม่ระบุ';
            const timeSlot = enhancedScheduleData.timeSlot[item.period - 1] || 'ไม่ระบุ';

            createStyledCell(detailWorksheet, currentRow, 1, dayName);
            createStyledCell(detailWorksheet, currentRow, 2, timeSlot);
            createStyledCell(detailWorksheet, currentRow, 3, item.subject.split(' ')[0] || 'ไม่ระบุ');
            createStyledCell(detailWorksheet, currentRow, 4, item.subject);
            createStyledCell(detailWorksheet, currentRow, 5, item.room);
            createStyledCell(detailWorksheet, currentRow, 6, item.planType);
            createStyledCell(detailWorksheet, currentRow, 7, item.yearLevel);

            currentRow++;
        });
        for (let row = 6; row < currentRow; row++) {
            for (let col = 1; col <= 7; col++) {
                const cell = detailWorksheet.getCell(row, col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }
    };

    const generateExcelDownload = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = initializeWorksheet(workbook);


            createMainHeaders(worksheet);
            createDataRows(worksheet);
            createSummaryRow(worksheet);
            setBorders(worksheet);
            createTimeTableHeaders(worksheet);


            addDetailedTimetable(workbook);


            const buffer = await workbook.xlsx.writeBuffer();
            await downloadExcelWithEnhancedName(buffer);

        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง");
        }
    }


    const downloadExcelWithEnhancedName = async (buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);


        const teacherName = selectedTeacher ? `${selectedTeacher.tName}_${selectedTeacher.tLastName}` : 'อาจารย์';
        const termYear = currentTermYear || 'ภาคเรียน';
        const fileName = `${curriculumInfo.filePrefix}_${teacherName}_${termYear}.xlsx`;

        const a = Object.assign(document.createElement('a'), {
            href: url,
            download: fileName
        });
        a.click();

        URL.revokeObjectURL(url);
    };


    const hasTeacher = selectedTeacher && currentTermYear;
    const hasData = timetables && timetables.length > 0;
    const canDownload = hasTeacher && hasData;


    const getButtonText = () => {
        if (!hasTeacher) return "เลือกอาจารย์และภาคเรียนก่อน";
        if (!hasData) return "ไม่มีข้อมูลตารางเรียน";
        return "ดาวน์โหลดตารางสอน";
    };

    return (
        <Button
            variant="secondary"
            onClick={generateExcelDownload}
            className="flex items-center gap-2"
            disabled={!canDownload}
        >
            <Download className="h-4 w-4" />
            {getButtonText()}
        </Button>
    );
}