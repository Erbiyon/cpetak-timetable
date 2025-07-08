"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";

export default function TransferTwoYear() { // แก้ชื่อฟังก์ชันให้เป็น TransferTwoYear
    const [termYear, setTermYear] = useState<string | undefined>(undefined);
    const [plans, setPlans] = useState<any[]>([]);
    const [activeSubject, setActiveSubject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                    setTermYear(termData.termYear || "1/2568");
                } else {
                    setTermYear("1/2568");
                }

                // ดึงข้อมูลแผนการเรียนจาก API โดยไม่ส่ง parameter (เหมือนกับหน้า transfer-one-year)
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
            } catch (error) {
                console.error("Error fetching data:", error);
                setPlans([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    // ทำการกรองข้อมูลในหน้า two-year เพื่อตรวจสอบว่ามีวิชาของปี 2 หรือไม่
    useEffect(() => {
        if (plans.length > 0) {
            console.log("ข้อมูลทั้งหมด:", plans.length);
            const year2Plans = plans.filter(plan => plan.yearLevel && plan.yearLevel.includes("ปี 2"));
            console.log("วิชาปี 2:", year2Plans.length);
            console.log("ตัวอย่างวิชาปี 2:", year2Plans.length > 0 ? year2Plans[0] : "ไม่พบ");
        }
    }, [plans]);

    function handleDragStart(event: any) {
        const { active } = event;
        const subjectId = parseInt(active.id.replace('subject-', ''));
        const draggedSubject = plans.find(plan => plan.id === subjectId);

        if (draggedSubject) {
            setActiveSubject(draggedSubject);
        }
    }

    function handleDragEnd(event: any) {
        const { active, over } = event;

        if (!over) {
            setActiveSubject(null);
            return;
        }

        const subjectId = parseInt(active.id.replace('subject-', ''));

        // ถ้า drop บน cell ในตาราง
        if (over.id.startsWith('cell-')) {
            const [_, day, period] = over.id.split('-').map(Number);

            // กำหนดวิชาลงในตาราง
            setTableAssignments(prev => ({
                ...prev,
                [subjectId]: { day, periods: [period] }
            }));
        }

        setActiveSubject(null);
    }

    // แสดง loading indicator
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">กำลังโหลดข้อมูล...</div>;
    }

    // จำนวนวิชาที่จัดตารางแล้ว
    const assignedSubjectsCount = Object.values(tableAssignments).filter(
        assignment => assignment !== null
    ).length;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
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
                        />
                    </div>
                </div>
                <PlansStatusCustom
                    termYear={termYear}
                    yearLevel="ปี 2"
                    planType="TRANSFER"
                    plans={plans}
                    assignments={tableAssignments}
                    assignedCount={assignedSubjectsCount}
                />
            </div>

            {/* แสดง overlay เมื่อกำลังลาก */}
            <DragOverlay>
                {activeSubject ? (
                    <div className="rounded border border-green-400 dark:border-green-600 shadow-sm bg-green-100 dark:bg-green-800 w-[120px] h-[60px] flex items-center justify-center p-2 text-xs">
                        <div className="text-center">
                            <div className="font-medium text-green-950 dark:text-green-50 mb-1">
                                {activeSubject.subjectCode}
                            </div>
                            <div className="text-[10px] truncate max-w-[110px] text-green-900 dark:text-green-100">
                                {activeSubject.subjectName}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}