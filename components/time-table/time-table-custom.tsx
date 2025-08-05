import React, { useMemo, useCallback } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TimeTableCustom({
    plans = [],
    assignments = {},
    onRemoveAssignment = null,
    activeSubject = null,
    dragOverCell = null
}: {
    plans: any[];
    assignments: { [subjectId: number]: { day: number; periods: number[] } | null };
    onRemoveAssignment?: ((subjectId: number) => void) | null;
    activeSubject?: any;
    dragOverCell?: { day: number; period: number } | null;
}) {
    const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    // สร้าง stable key สำหรับ assignments เพื่อใช้ใน dependency
    const assignmentsKey = useMemo(() => {
        return JSON.stringify(assignments);
    }, [assignments]);

    const plansKey = useMemo(() => {
        return JSON.stringify(plans.map(p => ({ id: p.id, subjectCode: p.subjectCode })));
    }, [plans]);

    // ใช้ useMemo เพื่อคำนวณข้อมูลเกี่ยวกับ cell เพียงครั้งเดียวเมื่อ dependencies เปลี่ยนแปลง
    const {
        cellToSubject,
        cellColspan,
        cellSkip
    } = useMemo(() => {
        const cellToSubject: { [cellKey: string]: any } = {};
        const cellColspan: { [cellKey: string]: number } = {};
        const cellSkip: Set<string> = new Set();

        // วนลูปทุกวิชาที่มีการจัดตาราง
        Object.entries(assignments).forEach(([subjectId, assignment]) => {
            if (!assignment) return;

            const { day, periods } = assignment;
            const subject = plans.find(plan => plan.id === parseInt(subjectId));

            if (!subject || periods.length === 0) return;

            // เรียงคาบตามลำดับเพื่อหาคาบแรกและคาบสุดท้าย
            const sortedPeriods = [...periods].sort((a, b) => a - b);
            const firstPeriod = sortedPeriods[0];
            const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

            // ตรวจสอบว่าคาบต่อเนื่องกันหรือไม่ (จำเป็นสำหรับ colspan)
            let isConsecutive = true;
            for (let i = firstPeriod; i < lastPeriod; i++) {
                // ข้ามการตรวจสอบช่วงกิจกรรม (วันพุธคาบ 14-17)
                if (day === 2 && i >= 14 && i <= 17) continue;

                if (!sortedPeriods.includes(i)) {
                    isConsecutive = false;
                    break;
                }
            }

            // กรณีคาบต่อเนื่องกัน สามารถใช้ colspan ได้
            if (isConsecutive) {
                // คำนวณ colspan (จำนวนช่องที่จะ span)
                const colspan = lastPeriod - firstPeriod + 1;

                // กำหนดข้อมูลวิชาที่คาบแรก
                const startCellKey = `${day}-${firstPeriod}`;
                cellToSubject[startCellKey] = {
                    ...subject,
                    assignmentData: { day, periods: sortedPeriods },
                };
                cellColspan[startCellKey] = colspan;

                // เพิ่มเซลล์ที่ต้องข้าม
                for (let p = firstPeriod + 1; p <= lastPeriod; p++) {
                    cellSkip.add(`${day}-${p}`);
                }
            } else {
                // กรณีคาบไม่ต่อเนื่อง ให้แสดงแยกกัน
                periods.forEach(period => {
                    const cellKey = `${day}-${period}`;
                    cellToSubject[cellKey] = {
                        ...subject,
                        assignmentData: { day, periods: [period] },
                    };
                    cellColspan[cellKey] = 1; // ไม่ใช้ colspan
                });
            }
        });

        return { cellToSubject, cellColspan, cellSkip };
    }, [assignmentsKey, plansKey]); // ใช้ key แทน object โดยตรง

    // สร้าง key สำหรับ dragOverCell และ activeSubject
    const dragOverCellKey = useMemo(() => {
        return dragOverCell ? `${dragOverCell.day}-${dragOverCell.period}` : null;
    }, [dragOverCell]);

    const activeSubjectKey = useMemo(() => {
        return activeSubject ? `${activeSubject.id}-${activeSubject.lectureHour}-${activeSubject.labHour}` : null;
    }, [activeSubject]);

    // แยกส่วนของ highlight info ออกมา
    const calculatedHighlight = useMemo(() => {
        if (!activeSubject || !dragOverCell) {
            return {
                startCell: null,
                skipCells: [] as string[],
                colspan: 0,
                invalid: false
            };
        }

        const { day, period } = dragOverCell;
        const totalHours = (activeSubject.lectureHour || 0) + (activeSubject.labHour || 0);
        const totalPeriods = totalHours * 2;

        // คำนวณจุดเริ่มต้น - ใช้ตำแหน่งเมาส์เป็นตำแหน่งเริ่มต้นเสมอ
        const startPeriod = period;

        // รวบรวมคาบทั้งหมดที่จะแสดง
        const periods: number[] = [];
        for (let i = 0; i < totalPeriods; i++) {
            const currentPeriod = startPeriod + i;

            // ข้ามคาบกิจกรรมวันพุธ
            if (day === 2 && (currentPeriod >= 14 && currentPeriod <= 17)) {
                continue;
            }

            // เช็คว่าอยู่ในขอบเขตตาราง
            if (currentPeriod < 25) {
                periods.push(currentPeriod);
            }
        }

        // ถ้าไม่มีคาบที่แสดงได้ ให้ return ค่าว่าง
        if (periods.length === 0) {
            return {
                startCell: null,
                skipCells: [],
                colspan: 0,
                invalid: true
            };
        }

        // เรียงคาบตามลำดับ
        periods.sort((a, b) => a - b);
        const firstPeriod = periods[0];
        const lastPeriod = periods[periods.length - 1];

        // กรณีคาบไม่พอสำหรับวิชา
        const invalid = periods.length < totalPeriods;

        // สร้างรายการเซลล์ที่ต้องข้าม
        const skipCells: string[] = [];
        for (let p = firstPeriod + 1; p <= lastPeriod; p++) {
            // ข้ามคาบกิจกรรม
            if (day === 2 && p >= 14 && p <= 17) continue;
            skipCells.push(`${day}-${p}`);
        }

        return {
            startCell: `${day}-${firstPeriod}`,
            skipCells,
            colspan: lastPeriod - firstPeriod + 1,
            day,
            period: firstPeriod,
            invalid
        };
    }, [activeSubjectKey, dragOverCellKey]); // ใช้ key แทน object โดยตรง

    // สร้าง memoized callback สำหรับ onRemoveAssignment
    const memoizedOnRemoveAssignment = useCallback((subjectId: number) => {
        if (onRemoveAssignment) {
            onRemoveAssignment(subjectId);
        }
    }, [onRemoveAssignment]);

    return (
        <div className="w-full overflow-x-auto">
            <table className="table-fixed border-collapse w-full">
                <thead>
                    <tr>
                        <th className="border px-2 py-1 text-xs w-[72px]">วัน/คาบ</th>
                        {Array.from({ length: 25 }, (_, i) => (
                            <th key={i} className="border px-2 py-1 text-xs" style={{ width: `${100 / 25}%` }}>
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day, rowIdx) => (
                        <tr key={rowIdx}>
                            <td className="border text-center text-xs w-[72px]">{day}</td>
                            {Array.from({ length: 25 }, (_, colIdx) => {
                                // เฉพาะวันพุธ (rowIdx === 2) คาบ 15-18 (colIdx 14-17)
                                if (rowIdx === 2 && colIdx === 14) {
                                    return (
                                        <td
                                            key={`activity-${rowIdx}-${colIdx}`}
                                            colSpan={4}
                                            className="border text-center bg-muted font-bold text-xs"
                                        >
                                            กิจกรรม
                                        </td>
                                    );
                                }

                                if (rowIdx === 2 && colIdx > 14 && colIdx < 18) {
                                    return null;
                                }

                                // ตรวจสอบว่าเซลล์นี้เป็นส่วนหนึ่งของ colspan หรือไม่
                                const cellKey = `${rowIdx}-${colIdx}`;

                                // ตรวจสอบการข้ามเซลล์จากวิชาที่มีอยู่แล้ว
                                if (cellSkip.has(cellKey)) {
                                    // ข้ามเซลล์ที่เป็นส่วนหนึ่งของ colspan
                                    return null;
                                }

                                // ตรวจสอบการข้ามเซลล์จาก highlight
                                if (calculatedHighlight.skipCells?.includes(cellKey)) {
                                    return null;
                                }

                                // เช็คว่าเซลล์นี้มีวิชาหรือไม่
                                const subject = cellToSubject[cellKey];
                                const colspan = cellColspan[cellKey] || 1;

                                // เช็คว่าเซลล์นี้เป็นจุดเริ่มต้นของ highlight หรือไม่
                                const isHighlightStart = cellKey === calculatedHighlight.startCell;
                                const highlightColspan = isHighlightStart && calculatedHighlight.colspan ? calculatedHighlight.colspan : 1;
                                const isInvalidHighlight = isHighlightStart && calculatedHighlight.invalid;

                                // เตรียม key แยกออกจาก props
                                const uniqueCellKey = `cell-${rowIdx}-${colIdx}`;

                                // ใช้ SimpleCell แทน TableCell เพื่อลดความซับซ้อน
                                return (
                                    <SimpleCell
                                        key={uniqueCellKey}
                                        id={`cell-${rowIdx}-${colIdx}`}
                                        day={rowIdx}
                                        period={colIdx}
                                        colspan={isHighlightStart ? highlightColspan : colspan}
                                        subject={subject}
                                        onRemoveAssignment={memoizedOnRemoveAssignment}
                                        isHighlighted={isHighlightStart}
                                        isInvalidHighlight={isInvalidHighlight}
                                        activeSubject={isHighlightStart ? activeSubject : null}
                                    />
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// แยก SimpleCell ออกมาเพื่อลดความซับซ้อน
const SimpleCell = React.memo(function SimpleCell({
    id,
    day,
    period,
    colspan = 1,
    subject,
    onRemoveAssignment,
    isHighlighted = false,
    isInvalidHighlight = false,
    activeSubject = null
}: {
    id: string;
    day: number;
    period: number;
    colspan?: number;
    subject?: any;
    onRemoveAssignment?: (subjectId: number) => void;
    isHighlighted?: boolean;
    isInvalidHighlight?: boolean;
    activeSubject?: any;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { day, period },
    });

    // สร้าง classes ที่ทำงานได้ดีทั้งใน Light Mode และ Dark Mode
    let cellClasses = "border text-center h-[36px] p-0 align-middle overflow-hidden text-xs transition-colors";

    if (isOver) {
        // เมื่อลากมาอยู่เหนือ - ใช้สีที่เห็นได้ชัดเจนใน Dark Mode
        cellClasses += isInvalidHighlight
            ? " bg-red-300 dark:bg-red-700 border-2 border-red-500 dark:border-red-500"
            : " bg-green-300 dark:bg-green-700 border-2 border-green-500 dark:border-green-500";
    } else if (isHighlighted) {
        // เมื่อเป็นส่วนหนึ่งของพื้นที่ highlight แต่ไม่ใช่เซลล์ที่เมาส์อยู่เหนือ
        cellClasses += isInvalidHighlight
            ? " bg-red-200 dark:bg-red-800 border border-red-400 dark:border-red-600"
            : " bg-green-200 dark:bg-green-600 border border-green-400 dark:border-green-400";
    } else if (subject) {
        // เมื่อมีวิชาอยู่แล้ว
        cellClasses += " bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 p-0";
    } else {
        // เซลล์ว่าง
        cellClasses += " bg-card hover:bg-slate-50 dark:hover:bg-slate-800";
    }

    // ฟังก์ชั่นจัดการคลิกขวาเพื่อลบวิชาออกจากตาราง
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (subject && onRemoveAssignment) {
            e.preventDefault();
            onRemoveAssignment(subject.id);
        }
    }, [subject, onRemoveAssignment]);

    return (
        <td
            ref={setNodeRef}
            className={cellClasses}
            style={{ width: `${100 / 25}%` }}
            colSpan={colspan}
            onContextMenu={handleContextMenu}
        >
            {subject ? (
                <SubjectInCell subject={subject} colspan={colspan} />
            ) : isHighlighted && activeSubject ? (
                <HighlightPreview
                    subject={activeSubject}
                    colspan={colspan}
                    isInvalid={isInvalidHighlight}
                />
            ) : null}
        </td>
    );
});

// แสดงตัวอย่างขณะลาก (Highlight)
const HighlightPreview = React.memo(function HighlightPreview({
    subject,
    colspan = 1,
    isInvalid = false
}: {
    subject: any;
    colspan?: number;
    isInvalid?: boolean;
}) {
    // คำนวณจำนวนชั่วโมงรวมของวิชา
    const lectureHours = subject.lectureHour || 0;
    const labHours = subject.labHour || 0;
    const totalHours = lectureHours + labHours;

    return (
        <div className={`w-full h-full p-1 ${isInvalid ? 'opacity-50' : 'opacity-80'}`}>
            <div className="text-center">
                <div className={`font-medium ${isInvalid ? 'text-red-950 dark:text-red-50' : 'text-green-950 dark:text-green-50'}`}>
                    {subject.subjectCode}
                </div>
                <div className={`text-[10px] truncate ${isInvalid ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                    {subject.subjectName}
                </div>
                <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                    <span className={`${isInvalid ? 'bg-red-200/50 dark:bg-red-700/50' : 'bg-green-200/50 dark:bg-green-700/50'} px-1 rounded`}>
                        {totalHours} ชม. ({lectureHours}/{labHours})
                    </span>
                    {colspan > 1 && (
                        <span className={`${isInvalid ? 'bg-red-300/30 dark:bg-red-600/30' : 'bg-green-300/30 dark:bg-green-600/30'} px-1 rounded`}>
                            {colspan} คาบ
                        </span>
                    )}
                </div>
                {isInvalid && (
                    <div className="text-[8px] mt-1 bg-red-300/30 dark:bg-red-600/30 px-1 rounded text-red-800 dark:text-red-200">
                        ไม่สามารถวางได้
                    </div>
                )}
            </div>
        </div>
    );
});

// แสดงวิชาในตาราง
const SubjectInCell = React.memo(function SubjectInCell({
    subject,
    colspan = 1
}: {
    subject: any;
    colspan?: number;
}) {
    // ใช้ useDraggable เพื่อให้สามารถลากย้ายวิชาในตารางได้
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `table-subject-${subject.id}`,
        data: {
            subject,
            fromTable: true,  // เพิ่มแฟล็กนี้เพื่อบ่งชี้ว่าลากมาจากตาราง
        },
    });

    // คำนวณจำนวนชั่วโมงรวมของวิชา
    const lectureHours = subject.lectureHour || 0;
    const labHours = subject.labHour || 0;
    const totalHours = lectureHours + labHours;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                        className={`w-full h-full p-1 cursor-grab ${isDragging ? 'opacity-30' : ''}`}
                        title="คลิกลากเพื่อย้าย หรือคลิกขวาเพื่อนำออก"
                    >
                        <div className="text-center">
                            <div className="font-medium text-green-950 dark:text-green-50">
                                {subject.subjectCode}
                                {subject.section && (
                                    <span className="text-[9px] ml-1 bg-green-200 dark:bg-green-700 px-1 py-0.5 rounded">
                                        sec.{subject.section}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] truncate text-green-900 dark:text-green-100">
                                {subject.subjectName}
                            </div>
                            <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                                <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded">
                                    {totalHours} ชม. ({lectureHours}/{labHours})
                                </span>
                                {colspan > 1 && (
                                    <span className="bg-green-300/30 dark:bg-green-600/30 px-1 rounded">
                                        {colspan} คาบ
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-slate-950 text-slate-50 dark:bg-slate-900">
                    <div className="text-xs p-1">
                        <div className="font-medium">
                            {subject.subjectCode}
                            {subject.section && <span className="ml-2">Section: {subject.section}</span>}
                        </div>
                        <div className="mt-1">{subject.subjectName}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>จำนวนหน่วยกิต:</div>
                            <div className="text-right">{subject.credit}</div>
                            <div>ชั่วโมงบรรยาย:</div>
                            <div className="text-right">{lectureHours} ชม.</div>
                            <div>ชั่วโมงปฏิบัติ:</div>
                            <div className="text-right">{labHours} ชม.</div>
                            <div>รวม:</div>
                            <div className="text-right">{totalHours} ชม. ({totalHours * 2} คาบ)</div>

                            {/* เพิ่มการแสดงข้อมูล section, room และ teacher */}
                            {subject.section && (
                                <>
                                    <div>Section:</div>
                                    <div className="text-right">{subject.section}</div>
                                </>
                            )}
                            {subject.room && (
                                <>
                                    <div>ห้องเรียน:</div>
                                    <div className="text-right">{subject.room.roomCode}</div>
                                </>
                            )}
                            {subject.teacher && (
                                <>
                                    <div>อาจารย์:</div>
                                    <div className="text-right">{subject.teacher.tName} {subject.teacher.tLastName}</div>
                                </>
                            )}
                        </div>
                        <div className="mt-1 text-[10px] opacity-75">
                            คลิกขวาเพื่อนำออก หรือคลิกลากเพื่อย้าย
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});
