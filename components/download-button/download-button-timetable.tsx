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


    const getCurriculumInfo = () => {
        if (timetables.length === 0) return { curriculum: 'หลักสูตรไม่ระบุ', filePrefix: 'ตารางเรียน' };


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


    const getColumnLetter = (colNumber: number): string => {
        let result = '';
        while (colNumber > 0) {
            colNumber--;
            result = String.fromCharCode(65 + (colNumber % 26)) + result;
            colNumber = Math.floor(colNumber / 26);
        }
        return result;
    };


    const safeMergeCells = (worksheet: ExcelJS.Worksheet, range: string, description?: string) => {
        try {
            worksheet.mergeCells(range);
        } catch (error) {
            console.warn(`Failed to merge cells ${range}${description ? ` (${description})` : ''}:`, error instanceof Error ? error.message : 'Unknown error');
        }
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

                console.warn(`Failed to merge cells ${options.merge}:`, error instanceof Error ? error.message : 'Unknown error');

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

        createStyledCell(worksheet, 1, 1, scheduleData.title1, { merge: 'A1:E1' });
        createStyledCell(worksheet, 1, 6, "ที่", { merge: 'F1:F2' });
        createStyledCell(worksheet, 1, 7, "รหัสวิชา", { merge: 'G1:G2' });
        createStyledCell(worksheet, 1, 8, "ชื่อวิชา", { merge: 'H1:Q2' });
        createStyledCell(worksheet, 1, 18, "สภาพ");
        createStyledCell(worksheet, 1, 19, "หน่วยกิต", { merge: 'S1:U1' });
        createStyledCell(worksheet, 1, 22, "คาบเรียน", { merge: 'V1:X1' });
        createStyledCell(worksheet, 1, 25, "อาจารย์ผู้สอน", { merge: 'Y1:AA2' });
        createStyledCell(worksheet, 1, 28, "ห้องเรียน", { merge: 'AB1:AD2' });



        createStyledCell(worksheet, 2, 1, "");
        createStyledCell(worksheet, 2, 2, "");
        createStyledCell(worksheet, 2, 3, "");
        createStyledCell(worksheet, 2, 4, "");
        createStyledCell(worksheet, 2, 5, "");


        createStyledCell(worksheet, 2, 18, "วิชา");


        createStyledCell(worksheet, 2, 19, "ท");
        createStyledCell(worksheet, 2, 20, "ป");
        createStyledCell(worksheet, 2, 21, "ร");


        createStyledCell(worksheet, 2, 22, "ท");
        createStyledCell(worksheet, 2, 23, "ป");
        createStyledCell(worksheet, 2, 24, "น");




    };


    const createDataRows = (worksheet: ExcelJS.Worksheet) => {

        const uniqueSubjects = new Map();

        console.log("Processing timetables for data rows:", timetables);


        timetables.forEach(item => {
            if (item.plan) {
                const key = `${item.plan.subjectCode}-${item.plan.section}`;
                if (!uniqueSubjects.has(key)) {

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


            createStyledCell(worksheet, row, 6, row - 2);

            if (subjectIndex < subjectsArray.length) {
                const subject = subjectsArray[subjectIndex];

                createStyledCell(worksheet, row, 7, subject.subjectCode, {
                    alignment: { horizontal: 'center', vertical: 'middle' }
                });


                safeMergeCells(worksheet, `H${row}:Q${row}`, 'subject name');
                createStyledCell(worksheet, row, 8, subject.subjectName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });


                createStyledCell(worksheet, row, 18, "");


                const credit = subject.credit || 0;
                const lectureHour = subject.lectureHour || 0;
                const labHour = subject.labHour || 0;

                createStyledCell(worksheet, row, 19, "");
                createStyledCell(worksheet, row, 20, "");
                createStyledCell(worksheet, row, 21, credit);


                createStyledCell(worksheet, row, 22, lectureHour);
                createStyledCell(worksheet, row, 23, labHour);
                createStyledCell(worksheet, row, 24, "");


                safeMergeCells(worksheet, `Y${row}:AA${row}`, 'teacher name');
                const teacherName = subject.teacher ?
                    `${subject.teacher.tName} ${subject.teacher.tLastName}` : '';
                createStyledCell(worksheet, row, 25, teacherName, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });


                safeMergeCells(worksheet, `AB${row}:AD${row}`, 'room code');
                const roomCode = subject.room?.roomCode || "";
                createStyledCell(worksheet, row, 28, roomCode, {
                    alignment: { horizontal: 'left', vertical: 'middle' }
                });


                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";

            } else {



                createStyledCell(worksheet, row, 7, "");


                safeMergeCells(worksheet, `H${row}:Q${row}`, 'empty row subject name');
                createStyledCell(worksheet, row, 8, "");


                createStyledCell(worksheet, row, 18, "");


                createStyledCell(worksheet, row, 19, "");
                createStyledCell(worksheet, row, 20, "");
                createStyledCell(worksheet, row, 21, "");


                createStyledCell(worksheet, row, 22, "");
                createStyledCell(worksheet, row, 23, "");
                createStyledCell(worksheet, row, 24, "");


                safeMergeCells(worksheet, `Y${row}:AA${row}`, 'empty row teacher');
                createStyledCell(worksheet, row, 25, "");


                safeMergeCells(worksheet, `AB${row}:AD${row}`, 'empty row room');
                createStyledCell(worksheet, row, 28, "");


                const cellAE = worksheet.getCell(row, 31);
                cellAE.value = "";

            }
        }



        safeMergeCells(worksheet, 'B3:E3', 'faculty title');
        createStyledCell(worksheet, 3, 2, 'ตารางเรียนประจำคณะวิศวกรรมศาสตร์', {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });


        safeMergeCells(worksheet, 'B4:E4', 'term year');
        const termInfo = currentTermYear ? `ภาคเรียนที่ ${currentTermYear.split('/')[0]} ปีการศึกษา ${currentTermYear.split('/')[1]}` : 'ภาคเรียนที่ x ปีการศึกษา xxxx';
        createStyledCell(worksheet, 4, 2, termInfo, {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });


        safeMergeCells(worksheet, 'B5:E5', 'department');
        createStyledCell(worksheet, 5, 2, 'สาขาวิศวกรรมไฟฟ้า', {
            alignment: { horizontal: 'left', vertical: 'middle' }
        });


        safeMergeCells(worksheet, 'B6:E6', 'curriculum');
        createStyledCell(worksheet, 6, 2, curriculumInfo.curriculum, {
            alignment: { horizontal: 'left', vertical: 'middle' },
            font: { size: 12, bold: false }
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


        createStyledCell(worksheet, 15, 19, "");
        createStyledCell(worksheet, 15, 20, "");
        createStyledCell(worksheet, 15, 21, totalCredits);


        createStyledCell(worksheet, 15, 22, totalLectureHours);
        createStyledCell(worksheet, 15, 23, totalLabHours);
        createStyledCell(worksheet, 15, 24, "");


        safeMergeCells(worksheet, `Y15:AD15`, 'summary row teacher and room');
        createStyledCell(worksheet, 15, 25, "", {
            alignment: { horizontal: 'center', vertical: 'middle' }
        });


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
        safeMergeCells(worksheet, 'A16:A18', 'day column header');


        createStyledCell(worksheet, 16, 2, 'เวลา');
        createStyledCell(worksheet, 17, 2, 'คาบ');
        createStyledCell(worksheet, 18, 2, 'คาบ(ทะเบียนกลาง)', { font: { size: 9 } });


        const timeSlots = scheduleData.timeSlot;

        const maxTimeSlots = Math.min(timeSlots.length, 14);


        for (let index = 0; index < maxTimeSlots; index++) {
            const colStart = 3 + (index * 2);
            const colEnd = colStart + 1;

            const startCol = getColumnLetter(colStart);
            const endCol = getColumnLetter(colEnd);
            const mergeRange = `${startCol}16:${endCol}16`;


            if (colEnd <= 30) {
                safeMergeCells(worksheet, mergeRange, `time slot ${index + 1}`);
                createStyledCell(worksheet, 16, colStart, timeSlots[index]);
            }
        }


        for (let index = 0; index < maxTimeSlots; index++) {
            const colStart = 3 + (index * 2);
            const colEnd = colStart + 1;

            const startCol = getColumnLetter(colStart);
            const endCol = getColumnLetter(colEnd);
            const mergeRange = `${startCol}17:${endCol}17`;


            if (colEnd <= 30) {
                safeMergeCells(worksheet, mergeRange, `period number ${index + 1}`);
                createStyledCell(worksheet, 17, colStart, (index + 1).toString());
            }
        }


        for (let i = 1; i <= 28; i++) {
            const col = 2 + i;
            if (col <= 30) {
                createStyledCell(worksheet, 18, col, i.toString());
            }
        }


        scheduleData.day.forEach((day, index) => {
            const startRow = 19 + (index * 2);
            const endRow = startRow + 1;
            const mergeRange = `A${startRow}:A${endRow}`;


            safeMergeCells(worksheet, mergeRange, `day ${day}`);
            createStyledCell(worksheet, startRow, 1, day);
        });
        scheduleData.day.forEach((_, index) => {
            const startRow = 19 + (index * 2);
            createStyledCell(worksheet, startRow, 2, "ปวส.");
            createStyledCell(worksheet, startRow + 1, 2, "ป.ตรี");
        });

        scheduleData.day.forEach((day, dayIndex) => {
            const startRow = 19 + (dayIndex * 2);


            const dayTimetables = timetables.filter(item => item.day === dayIndex);


            if (dayTimetables.length > 0) {
                console.log(`Day ${dayIndex} (${day}) has ${dayTimetables.length} subjects:`,
                    dayTimetables.map(t => `${t.plan?.subjectCode} (${t.startPeriod}-${t.endPeriod})`));
            }


            for (let period = 0; period < 28; period++) {
                const col = 3 + period;


                if (col > 30) break;


                const pvsRow = startRow;

                const btechRow = startRow + 1;


                if (dayIndex === 2 && period === 14) {

                    const startColIndex = 3 + 14;
                    const endColIndex = 3 + 17;

                    const startCol = getColumnLetter(startColIndex);
                    const endCol = getColumnLetter(endColIndex);
                    const mergeRange = `${startCol}${pvsRow}:${endCol}${btechRow}`;

                    safeMergeCells(worksheet, mergeRange, 'activity period');

                    const activityCell = createStyledCell(worksheet, pvsRow, startColIndex, "กิจกรรม", {
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


                if (period >= 15 && period <= 17 && dayIndex === 0) {
                    console.log(`Period ${period} (display: ${period + 1}):`,
                        subjectInPeriod ? `Found ${subjectInPeriod.plan?.subjectCode}` : 'No subject');
                }

                if (subjectInPeriod && subjectInPeriod.plan) {

                    if (period === subjectInPeriod.startPeriod) {
                        const colspan = subjectInPeriod.endPeriod - subjectInPeriod.startPeriod + 1;


                        const lectureHour = subjectInPeriod.plan.lectureHour || 0;
                        const labHour = subjectInPeriod.plan.labHour || 0;
                        const hourInfo = `ท.${lectureHour} ป.${labHour}`;
                        const subjectText = `${subjectInPeriod.plan.subjectCode} ${subjectInPeriod.plan.subjectName} ${hourInfo}`;




                        const startColIndex = 3 + subjectInPeriod.startPeriod;
                        const endColIndex = 3 + subjectInPeriod.endPeriod;

                        const startColLetter = getColumnLetter(startColIndex);
                        const endColLetter = getColumnLetter(endColIndex);


                        if (colspan > 1) {

                            const mergeRange = `${startColLetter}${pvsRow}:${endColLetter}${btechRow}`;
                            safeMergeCells(worksheet, mergeRange, `subject multiple periods: ${subjectInPeriod.plan.subjectCode} (periods ${subjectInPeriod.startPeriod + 1}-${subjectInPeriod.endPeriod + 1})`);
                        } else {

                            const mergeRange = `${startColLetter}${pvsRow}:${startColLetter}${btechRow}`;
                            safeMergeCells(worksheet, mergeRange, `subject single period: ${subjectInPeriod.plan.subjectCode} (period ${subjectInPeriod.startPeriod + 1})`);
                        }


                        createStyledCell(worksheet, pvsRow, startColIndex, subjectText, {
                            font: { size: 14, bold: false },
                            alignment: { horizontal: 'center', vertical: 'middle' }
                        });


                        console.log(`Merged subject: ${subjectInPeriod.plan.subjectCode}, DB periods: ${subjectInPeriod.startPeriod}-${subjectInPeriod.endPeriod}, Excel columns: ${startColLetter}-${endColLetter} (${startColIndex}-${endColIndex})`);
                        console.log(`Subject text: "${subjectText}"`);
                        console.log(`Placed in row ${pvsRow}, column ${startColIndex} (${startColLetter})`);
                    } else {

                        console.log(`Skipping period ${period} (display: ${period + 1}) for subject ${subjectInPeriod.plan.subjectCode} - already merged`);
                    }
                } else {


                    const cell = worksheet.getCell(pvsRow, col);
                    if (!cell.isMerged) {
                        createStyledCell(worksheet, pvsRow, col, "");
                        createStyledCell(worksheet, btechRow, col, "");
                    }
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


    const downloadExcel = async (buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);


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

            if (onRefreshData) {
                await onRefreshData();
            }


            if (!timetables || timetables.length === 0) {
                alert("ไม่มีข้อมูลตารางเรียน กรุณาเพิ่มข้อมูลก่อนดาวน์โหลด");
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = initializeWorksheet(workbook);


            createMainHeaders(worksheet);
            createDataRows(worksheet);
            createSummaryRow(worksheet);
            setBorders(worksheet);
            createTimeTableHeaders(worksheet);


            const buffer = await workbook.xlsx.writeBuffer();
            await downloadExcel(buffer);

        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง");
        }
    };


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