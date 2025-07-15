"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TransferOneYear() {
    const [termYear, setTermYear] = useState<string | undefined>(undefined);
    const [plans, setPlans] = useState<any[]>([]);
    const [activeSubject, setActiveSubject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dragOverCell, setDragOverCell] = useState<{ day: number; period: number } | null>(null);
    const [conflicts, setConflicts] = useState<any[]>([]);  // เพิ่ม state เก็บข้อมูลการชนกัน

    // สถานะของวิชาในตาราง
    const [tableAssignments, setTableAssignments] = useState<{
        [subjectId: number]: { day: number; periods: number[] } | null
    }>({});

    // กำหนด sensors ให้ใช้เฉพาะ pointer (mouse/touch)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // เริ่มลากเมื่อเลื่อนเมาส์ไป 8px
            },
        })
    );

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // ดึงข้อมูลปีการศึกษา
                const termRes = await fetch("/api/term-year");
                if (termRes.ok) {
                    const termData = await termRes.json();
                    setTermYear(termData.termYear);
                }

                // ดึงข้อมูลแผนการเรียนจาก API
                const planRes = await fetch("/api/subject");
                if (planRes.ok) {
                    const data = await planRes.json();
                    console.log("API response data:", data);

                    // ตรวจสอบรูปแบบข้อมูลและกำหนดให้กับ state
                    if (Array.isArray(data)) {
                        setPlans(data);
                    } else if (data && data.plans && Array.isArray(data.plans)) {
                        setPlans(data.plans);
                    } else {
                        console.warn("API ส่งข้อมูลในรูปแบบที่ไม่ถูกต้อง");
                        setPlans([]);
                    }
                } else {
                    console.warn("API ไม่ตอบสนอง");
                    setPlans([]);
                }

                // ดึงข้อมูลตารางเรียนที่บันทึกไว้
                if (termYear) {
                    const timetableRes = await fetch(`/api/timetable?termYear=${termYear}&yearLevel=ปี 2&planType=TRANSFER`);
                    if (timetableRes.ok) {
                        const timetableData = await timetableRes.json();

                        // แปลงข้อมูลเป็นรูปแบบ tableAssignments
                        const assignments: { [subjectId: number]: { day: number, periods: number[] } } = {};

                        timetableData.forEach((item: any) => {
                            const periods: number[] = [];
                            for (let p = item.startPeriod; p <= item.endPeriod; p++) {
                                // ข้ามคาบกิจกรรมวันพุธ (คาบ 14-17)
                                if (item.day === 2 && p >= 14 && p <= 17) continue;
                                periods.push(p);
                            }

                            assignments[item.planId] = {
                                day: item.day,
                                periods: periods
                            };
                        });

                        setTableAssignments(assignments);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setPlans([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [termYear]);

    useEffect(() => {
        if (plans.length > 0) {
            console.log("ข้อมูลทั้งหมด:", plans.length);
            const year1Plans = plans.filter(plan => plan.yearLevel && plan.yearLevel.includes("ปี 1"));
            console.log("วิชาปี 1:", year1Plans.length);
            console.log("ตัวอย่างวิชาปี 1:", year1Plans.length > 0 ? year1Plans[0] : "ไม่พบ");
        }
    }, [plans]);

    function handleDragStart(event: any) {
        const { active } = event;

        // ตรวจสอบว่าลากจากที่ไหน
        const isFromTable = active.id.startsWith('table-subject-');
        let subjectId;

        if (isFromTable) {
            subjectId = parseInt(active.id.replace('table-subject-', ''));
        } else {
            subjectId = parseInt(active.id.replace('subject-', ''));
        }

        const draggedSubject = plans.find(plan => plan.id === subjectId);

        if (draggedSubject) {
            // ถ้าลากจากตาราง ให้เพิ่มข้อมูลการจัดวาง
            if (isFromTable) {
                setActiveSubject({
                    ...draggedSubject,
                    fromTable: true,
                    originalAssignment: tableAssignments[draggedSubject.id]
                });
            } else {
                setActiveSubject(draggedSubject);
            }
        }
    }

    function handleDragOver(event: any) {
        const { over } = event;

        // อัพเดทข้อมูลเซลล์ที่กำลังวางเหนือ
        if (over && over.id.startsWith('cell-')) {
            const [_, day, period] = over.id.split('-').map(Number);
            setDragOverCell({ day, period });
        } else {
            setDragOverCell(null);
        }
    }

    async function handleDragEnd(event: any) {
        const { active, over } = event;

        // รีเซ็ต drag over cell
        setDragOverCell(null);

        if (!over) {
            // ถ้าไม่มีเป้าหมาย แต่กำลังลากวิชาจากตาราง ให้ลบการจัดวางออก
            if (activeSubject?.fromTable) {
                handleRemoveAssignment(activeSubject.id);
            }
            setActiveSubject(null);
            return;
        }

        // หา ID ของวิชาที่ถูกลาก
        let subjectId;
        if (active.id.startsWith('table-subject-')) {
            subjectId = parseInt(active.id.replace('table-subject-', ''));
        } else {
            subjectId = parseInt(active.id.replace('subject-', ''));
        }

        // ถ้า drop บน cell ในตาราง
        if (over.id.startsWith('cell-')) {
            const [_, day, period] = over.id.split('-').map(Number);

            // ค้นหาข้อมูลวิชาที่เป็นเวอร์ชันล่าสุด (มีการอัปเดตจาก AddSubDetail)
            const subject = plans.find(plan => plan.id === subjectId);

            if (subject) {
                // เพิ่ม Debug เพื่อตรวจสอบข้อมูลวิชาที่กำลังจะวางลงตาราง
                console.log("กำลังวางวิชา:", {
                    subjectCode: subject.subjectCode,
                    subjectName: subject.subjectName,
                    room: subject.room,
                    teacher: subject.teacher,
                    section: subject.section,
                });

                // คำนวณคาบเรียนจากชั่วโมง
                const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
                const totalPeriods = totalHours * 2;

                // ตรวจสอบว่ามีพื้นที่พอในตาราง
                const lastPeriod = period + totalPeriods - 1;
                if (lastPeriod >= 25) {
                    console.warn("ไม่สามารถวางวิชาได้: เกินขอบตาราง");
                    setActiveSubject(null);
                    return; // ไม่ดำเนินการต่อ
                }

                // ตรวจสอบว่าไม่ทับช่วงกิจกรรมวันพุธ
                const isWednesday = day === 2;
                const activityPeriods = [14, 15, 16, 17]; // คาบกิจกรรมวันพุธ
                const wouldOverlapActivity = isWednesday && activityPeriods.some(actPeriod => {
                    return period <= actPeriod && period + totalPeriods - 1 >= actPeriod;
                });

                if (wouldOverlapActivity) {
                    console.warn("ไม่สามารถวางวิชาได้: ทับช่วงกิจกรรม");
                    setActiveSubject(null);
                    return; // ไม่ดำเนินการต่อ
                }

                // สร้างช่วงคาบเรียน - คาบต่อเนื่องกัน
                const periods: number[] = [];
                for (let i = 0; i < totalPeriods; i++) {
                    // ข้ามช่วงกิจกรรมวันพุธ
                    let currentPeriod = period + i;
                    if (isWednesday && activityPeriods.includes(currentPeriod)) {
                        continue; // ข้ามคาบกิจกรรม
                    }
                    periods.push(currentPeriod);
                }

                // ตรวจสอบว่าไม่มีวิชาอื่นใช้คาบเดียวกันในวันเดียวกัน
                let hasOverlap = false;
                Object.entries(tableAssignments).forEach(([existingSubjectId, assignment]) => {
                    // ข้ามการตรวจสอบวิชาเดียวกัน (กรณีย้ายที่วิชาเดิม)
                    if (parseInt(existingSubjectId) === subjectId) return;

                    if (assignment && assignment.day === day) {
                        // ตรวจสอบว่ามีคาบที่ซ้อนกันหรือไม่
                        const overlap = periods.some(p => assignment.periods.includes(p));
                        if (overlap) {
                            hasOverlap = true;
                        }
                    }
                });

                if (hasOverlap) {
                    console.warn("ไม่สามารถวางวิชาได้: ทับคาบวิชาอื่น");
                    setActiveSubject(null);
                    return; // ไม่ดำเนินการต่อ
                }

                // กำหนดวิชาลงในตาราง - ใช้ข้อมูลวิชาล่าสุดจาก plans
                setTableAssignments(prev => ({
                    ...prev,
                    [subjectId]: { day, periods }
                }));

                // บันทึกลง Database
                try {
                    const startPeriod = Math.min(...periods);
                    const endPeriod = Math.max(...periods);

                    const response = await fetch('/api/timetable', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            planId: subjectId,
                            termYear: termYear || '1',
                            yearLevel: 'ปี 2', // Change from 'ปี 1' to 'ปี 2'
                            planType: 'TRANSFER',
                            day,
                            startPeriod,
                            endPeriod,
                            roomId: subject.roomId || null,
                            teacherId: subject.teacherId || null,
                            section: subject.section || null
                        }),
                    });

                    const data = await response.json();

                    // ถ้ามีการชนกัน (409 Conflict)
                    if (response.status === 409 && data.conflicts) {
                        setConflicts(data.conflicts);
                    } else if (!response.ok) {
                        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกตาราง');
                    } else {
                        // บันทึกสำเร็จ
                        console.log("บันทึกตารางเรียนสำเร็จ", data);
                        setConflicts([]); // เคลียร์การชนกัน
                    }
                } catch (error) {
                    console.error("เกิดข้อผิดพลาดในการบันทึกตารางเรียน:", error);
                }
            }
        }

        setActiveSubject(null);
    }

    // ฟังก์ชั่นสำหรับลบวิชาออกจากตาราง
    async function handleRemoveAssignment(subjectId: number) {
        try {
            // ลบข้อมูลจากฐานข้อมูล
            await fetch(`/api/timetable/${subjectId}`, {
                method: 'DELETE',
            });

            // ลบข้อมูลจาก state
            setTableAssignments(prev => {
                const newAssignments = { ...prev };
                delete newAssignments[subjectId];
                return newAssignments;
            });

            // เคลียร์ conflicts ที่อาจเกี่ยวข้องกับวิชานี้
            setConflicts(prev => prev.filter(conflict =>
                !conflict.conflicts?.some((item: any) => item.planId === subjectId)
            ));
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลบข้อมูลตารางเรียน:", error);
        }
    }

    // ฟังก์ชันสำหรับแบ่งวิชา
    async function handleSplitSubject(
        subjectId: number,
        splitData: {
            part1: { lectureHour: number; labHour: number; partNumber: number };
            part2: { lectureHour: number; labHour: number; partNumber: number };
        }
    ) {
        try {
            setIsLoading(true); // แสดง loading indicator

            // เรียก API เพื่อแบ่งวิชา
            const response = await fetch('/api/subject/split', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subjectId,
                    splitData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to split subject');
            }

            // รับข้อมูลวิชาทั้งสองส่วนที่อัปเดตแล้วจาก backend
            const { updatedSubject, newSubject } = await response.json();

            console.log("Split successful:", { updatedSubject, newSubject });

            // อัปเดต state plans - แทนที่วิชาเดิมด้วยวิชาที่อัปเดตแล้ว และเพิ่มวิชาใหม่
            setPlans(prevPlans => {
                const updatedPlans = prevPlans.map(plan =>
                    plan.id === subjectId ? updatedSubject : plan
                );
                return [...updatedPlans, newSubject];
            });

            // ถ้ามี assignment ของวิชาเดิม ให้ลบออก
            if (tableAssignments[subjectId]) {
                await handleRemoveAssignment(subjectId);
            }
        } catch (error) {
            console.error("Error splitting subject:", error);
            // แสดง error notification ถ้าต้องการ
        } finally {
            setIsLoading(false);
        }
    }

    // แสดง loading indicator
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">กำลังโหลดข้อมูล...</div>;
    }

    // จำนวนวิชาที่จัดตารางแล้ว
    const assignedSubjectsCount = Object.values(tableAssignments).filter(
        assignment => assignment !== null
    ).length;

    // คำนวณตัวอย่างคาบเรียนสำหรับการแสดง preview
    const getPreviewPeriods = () => {
        if (!activeSubject || !dragOverCell) return null;

        const { day, period } = dragOverCell;
        const totalHours = (activeSubject.lectureHour || 0) + (activeSubject.labHour || 0);
        const totalPeriods = totalHours * 2;

        // ตรวจสอบว่ามีพื้นที่พอในตาราง
        const lastPeriod = period + totalPeriods - 1;
        if (lastPeriod >= 25) {
            return { day, periods: [], isValid: false, message: "เกินขอบตาราง" };
        }

        // ตรวจสอบว่าไม่ทับช่วงกิจกรรม
        const hasMidweekActivity = day === 2 &&
            ((period <= 14 && lastPeriod >= 14) || // เริ่มก่อนกิจกรรมแต่ทับกิจกรรม
                (period >= 14 && period <= 17) ||      // เริ่มในช่วงกิจกรรม
                (lastPeriod >= 14 && lastPeriod <= 17)); // จบในช่วงกิจกรรม

        if (hasMidweekActivity) {
            return { day, periods: [], isValid: false, message: "ทับช่วงกิจกรรม" };
        }

        // สร้างคาบเรียน
        const periods: number[] = [];
        for (let i = 0; i < totalPeriods; i++) {
            let currentPeriod = period + i;
            if (day === 2 && (currentPeriod >= 14 && currentPeriod <= 17)) {
                continue; // ข้ามคาบกิจกรรม
            }
            periods.push(currentPeriod);
        }

        // ตรวจสอบว่าไม่ทับคาบวิชาอื่น
        let hasOverlap = false;
        let overlapSubject = null;

        Object.entries(tableAssignments).forEach(([existingSubjectId, assignment]) => {
            // ข้ามการตรวจสอบวิชาเดียวกัน (กรณีย้ายที่วิชาเดิม)
            if (parseInt(existingSubjectId) === activeSubject.id) return;

            if (assignment && assignment.day === day) {
                // ตรวจสอบว่ามีคาบที่ซ้อนกันหรือไม่
                const overlap = periods.some(p => assignment.periods.includes(p));
                if (overlap) {
                    hasOverlap = true;
                    const overlappingSubject = plans.find(plan => plan.id === parseInt(existingSubjectId));
                    if (overlappingSubject) {
                        overlapSubject = overlappingSubject.subjectCode;
                    }
                }
            }
        });

        if (hasOverlap) {
            return {
                day,
                periods: [],
                isValid: false,
                message: overlapSubject
                    ? `ทับวิชา ${overlapSubject}`
                    : "ทับคาบวิชาอื่น"
            };
        }

        return { day, periods, isValid: true, message: "" };
    };

    // ข้อมูลสำหรับแสดง preview
    const previewInfo = getPreviewPeriods();

    // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการอัปเดตข้อมูลวิชา
    function handleSubjectUpdate() {
        // บังคับให้ render ใหม่ทันที
        setPlans([...plans]);

        // บันทึกข้อมูลที่อัปเดตลง database
        Object.entries(tableAssignments).forEach(async ([subjectId, assignment]) => {
            if (!assignment) return;

            const subject = plans.find(p => p.id === parseInt(subjectId));
            if (!subject) return;

            const { day, periods } = assignment;
            const startPeriod = Math.min(...periods);
            const endPeriod = Math.max(...periods);

            try {
                await fetch('/api/timetable', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        planId: parseInt(subjectId),
                        termYear: termYear || '1',
                        yearLevel: 'ปี 2', // Change from 'ปี 1' to 'ปี 2'
                        planType: 'TRANSFER',
                        day,
                        startPeriod,
                        endPeriod,
                        roomId: subject.roomId || null,
                        teacherId: subject.teacherId || null,
                        section: subject.section || null
                    }),
                });
            } catch (error) {
                console.error("Failed to update subject details:", error);
            }
        });
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[snapCenterToCursor]}
        >
            <div className="mx-auto px-4">
                <div className="bg-card text-card-foreground rounded-xl border my-5 py-6 shadow-sm mx-auto max-w-7xl">
                    <div className="mx-8 pb-2 text-lg font-semibold">
                        ตารางเรียน เทียบโอน ปี 2 ภาคเรียนที่ {termYear}
                    </div>
                    <div className="bg-card text-card-foreground px-8">
                        <TimeTableCustom
                            assignments={tableAssignments}
                            plans={plans}
                            onRemoveAssignment={handleRemoveAssignment}
                            activeSubject={activeSubject}
                            dragOverCell={dragOverCell}
                        />
                    </div>
                </div>
                <PlansStatusCustom
                    termYear={termYear || ""}
                    yearLevel="ปี 2"
                    planType="TRANSFER"
                    plans={plans}
                    assignments={tableAssignments}
                    assignedCount={assignedSubjectsCount}
                    onRemoveAssignment={handleRemoveAssignment}
                    onSplitSubject={handleSplitSubject}
                    conflicts={conflicts}
                    onSubjectUpdate={handleSubjectUpdate} // เพิ่ม prop นี้
                />
            </div>

            {/* แสดง overlay เมื่อกำลังลาก */}
            <DragOverlay>
                {activeSubject ? (
                    <TooltipProvider>
                        <Tooltip open={false}>  {/* ไม่แสดง tooltip ขณะลาก */}
                            <TooltipTrigger asChild>
                                <div
                                    className={`rounded border shadow-sm flex flex-col items-center justify-center p-2 text-xs ${previewInfo && !previewInfo.isValid
                                        ? "border-red-400 dark:border-red-600 bg-red-100/80 dark:bg-red-800/80"
                                        : "border-green-400 dark:border-green-600 bg-green-100/80 dark:bg-green-800/80"
                                        }`}
                                    style={{
                                        width: `${Math.min(((activeSubject.lectureHour || 0) + (activeSubject.labHour || 0)) * 60, 300)}px`,
                                        minWidth: '120px',
                                        height: '60px'
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="font-medium text-green-950 dark:text-green-50 mb-1">
                                            {activeSubject.subjectCode}
                                        </div>
                                        <div className="text-[10px] truncate max-w-[110px] text-green-900 dark:text-green-100">
                                            {activeSubject.subjectName}
                                        </div>
                                        <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                                            <span className="bg-green-200 dark:bg-green-700 px-1 rounded">
                                                {(activeSubject.lectureHour || 0) + (activeSubject.labHour || 0)} ชม.
                                            </span>
                                            <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded">
                                                {((activeSubject.lectureHour || 0) + (activeSubject.labHour || 0)) * 2} คาบ
                                            </span>
                                        </div>

                                        {/* แสดงข้อมูลตัวอย่างคาบเรียน */}
                                        {previewInfo && (
                                            <div className={`mt-1 text-[8px] px-1 rounded ${previewInfo.isValid
                                                ? "bg-green-300/30 dark:bg-green-600/30"
                                                : "bg-red-300/30 dark:bg-red-600/30"
                                                }`}>
                                                {previewInfo.isValid
                                                    ? `${['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][previewInfo.day]} คาบ ${previewInfo.periods.join(', ')}`
                                                    : `⚠️ ${previewInfo.message}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {/* ไม่จำเป็นต้องมีเนื้อหาตรงนี้ เพราะเราตั้งค่า open={false} */}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}