'use client'

import React from 'react';
import { FileSpreadsheet } from "lucide-react";
import { Button } from "../ui/button";
import ExcelJS from 'exceljs';

interface DownloadRoomButtonProps {
    roomCode: string;
    roomName?: string;
    termYear: string;
    cellToSubject: { [cellKey: string]: any };
    cellColspan: { [cellKey: string]: number };
    cellSkip: Set<string>;
}

export default function DownloadRoomButton({
    roomCode,
    termYear,
    cellToSubject,
    cellColspan,
    cellSkip
}: DownloadRoomButtonProps) {

    const generateExcelDownload = async (): Promise<void> => {
        try {

            const formatTermYear = (termYear: string): string => {
                if (termYear.includes('/')) {
                    const [term, year] = termYear.split('/');
                    return `ภาคเรียนที่ ${term} ปีการศึกษา ${year}`;
                }
                return termYear;
            };


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('ตารางการใช้ห้อง');


            const timeSlots = [
                "08.00-09.00", "09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00",
                "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00", "17.00-18.00",
                "18.00-19.00", "19.00-20.00", "20.00-20.30"
            ];

            const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];


            worksheet.columns = [
                { width: 15 },
                ...timeSlots.map(() => ({ width: 12 }))
            ];

            let currentRow = 1;


            const titleCell = worksheet.getCell(currentRow, 1);
            titleCell.value = `ตารางปริมาณการใช้ห้อง ${roomCode}`;
            titleCell.font = { name: 'TH Sarabun New', size: 24, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + timeSlots.length)}${currentRow}`);
            worksheet.getRow(currentRow).height = 25;
            currentRow += 2;


            const subtitleCell = worksheet.getCell(currentRow, 1);
            subtitleCell.value = "หลักสูตรวิศวกรรมคอมพิวเตอร์และหลักสูตรเทคนิคคอมพิวเตอร์";
            subtitleCell.font = { name: 'TH Sarabun New', size: 18, bold: true };
            subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + timeSlots.length)}${currentRow}`);
            worksheet.getRow(currentRow).height = 20;
            currentRow++;


            const descriptionCell = worksheet.getCell(currentRow, 1);
            descriptionCell.value = "สาขาวิชาวิศวกรรมไฟฟ้า คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก";
            descriptionCell.font = { name: 'TH Sarabun New', size: 16, bold: true };
            descriptionCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + timeSlots.length)}${currentRow}`);
            worksheet.getRow(currentRow).height = 20;
            currentRow++;


            const semesterCell = worksheet.getCell(currentRow, 1);
            semesterCell.value = formatTermYear(termYear);
            semesterCell.font = { name: 'TH Sarabun New', size: 16, bold: true };
            semesterCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + timeSlots.length)}${currentRow}`);
            worksheet.getRow(currentRow).height = 20;
            currentRow += 2;


            const inmorningCell = worksheet.getCell(currentRow, 1);
            inmorningCell.value = "ภาคในเวลาราชการ(ปกติ)";
            inmorningCell.font = { name: 'TH Sarabun New', size: 16, bold: true };
            inmorningCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
            inmorningCell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };

            const inafternoonCell = worksheet.getCell(currentRow, 8);
            inafternoonCell.value = "ภาคหลังเวลาราชการ(บ่าย)";
            inafternoonCell.font = { name: 'TH Sarabun New', size: 16, bold: true };
            inafternoonCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`H${currentRow}:N${currentRow}`);
            inafternoonCell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };
            worksheet.getRow(currentRow).height = 20;
            currentRow++;


            const headerRow = worksheet.getRow(currentRow);
            headerRow.getCell(1).value = 'วัน';
            timeSlots.forEach((time, index) => {
                headerRow.getCell(index + 2).value = time;
                headerRow.getCell(index + 2).font = { name: 'TH Sarabun New', size: 16, bold: true };
            });


            for (let col = 1; col <= timeSlots.length + 1; col++) {
                const cell = headerRow.getCell(col);
                cell.font = { name: 'TH Sarabun New', size: 16, bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
            headerRow.height = 20;
            currentRow++;


            days.forEach((day, dayIndex) => {
                const dayRow = worksheet.getRow(currentRow);


                const dayCell = dayRow.getCell(1);
                dayCell.value = day;
                dayCell.font = { name: 'TH Sarabun New', size: 16, bold: true };
                dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
                dayCell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };


                for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
                    const col = timeIndex + 2;
                    const cell = dayRow.getCell(col);



                    const originalTimeIndex = timeIndex * 2;
                    const cellKey = `${dayIndex}-${originalTimeIndex}`;
                    const subject = cellToSubject[cellKey];

                    if (subject && !cellSkip.has(cellKey)) {

                        const teacherName = subject.teacher
                            ? `${subject.teacher.tName || ''}${" "}${subject.teacher.tLastName || ''}`.trim()
                            : '';


                        const subjectCodeAndName = [
                            subject.subjectCode || '',
                            subject.subjectName || ''
                        ].filter(text => text).join(' ');

                        const subjectText = [
                            subjectCodeAndName,
                            teacherName
                        ].filter(text => text).join('\n');

                        cell.value = subjectText;
                        cell.font = { name: 'TH Sarabun New', size: 16 };
                        cell.alignment = {
                            horizontal: 'center',
                            vertical: 'middle',
                            wrapText: true
                        };


                        const originalColspan = cellColspan[cellKey] || 1;
                        const newColspan = Math.ceil(originalColspan / 2);
                        if (newColspan > 1) {
                            const endCol = col + newColspan - 1;
                            worksheet.mergeCells(`${String.fromCharCode(64 + col)}${currentRow}:${String.fromCharCode(64 + endCol)}${currentRow}`);
                        }
                    } else if (!cellSkip.has(cellKey)) {

                        const oddCellKey = `${dayIndex}-${originalTimeIndex + 1}`;
                        const oddSubject = cellToSubject[oddCellKey];

                        if (oddSubject && !cellSkip.has(oddCellKey)) {

                            const teacherName = oddSubject.teacher
                                ? `${oddSubject.teacher.tName || ''}${oddSubject.teacher.tLastName || ''}`.trim()
                                : '';


                            const subjectCodeAndName = [
                                oddSubject.subjectCode || '',
                                oddSubject.subjectName || ''
                            ].filter(text => text).join(' ');

                            const subjectText = [
                                subjectCodeAndName,
                                teacherName
                            ].filter(text => text).join('\n');

                            cell.value = subjectText;
                            cell.font = { name: 'TH Sarabun New', size: 10 };
                            cell.alignment = {
                                horizontal: 'center',
                                vertical: 'middle',
                                wrapText: true
                            };


                            const originalColspan = cellColspan[oddCellKey] || 1;
                            const newColspan = Math.ceil(originalColspan / 2);
                            if (newColspan > 1) {
                                const endCol = col + newColspan - 1;
                                worksheet.mergeCells(`${String.fromCharCode(64 + col)}${currentRow}:${String.fromCharCode(64 + endCol)}${currentRow}`);
                            }
                        } else {

                            cell.value = '';
                        }
                    }

                    cell.border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }


                dayRow.height = 60;
                currentRow++;
            });
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ตารางการใช้ห้อง-${roomCode}-${termYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
        }
    };


    const hasData = cellToSubject && Object.keys(cellToSubject).length > 0;


    const getButtonText = () => {
        if (!hasData) return "ไม่มีข้อมูลตารางเรียน";
        return "ดาวน์โหลดตารางห้อง";
    };

    return (
        <Button
            onClick={generateExcelDownload}
            variant="secondary"
            className="flex items-center space-x-2"
            type="button"
            aria-label="Download Excel file"
            disabled={!hasData}
        >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{getButtonText()}</span>
        </Button>
    );
}