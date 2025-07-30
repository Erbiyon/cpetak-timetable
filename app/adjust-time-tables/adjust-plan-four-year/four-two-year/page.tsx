"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

export default function FourTwoYear() {
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
                    console.log("Term data received:", termData);
                    setTermYear(termData.termYear);

                    // ทดสอบดึงข้อมูลโดยไม่ใส่ query parameters ก่อน
                    console.log("=== Testing API without filters ===");
                    const testRes = await fetch("/api/subject");
                    if (testRes.ok) {
                        const allData = await testRes.json();
                        console.log(`Total records in database: ${allData.length}`);

                        if (allData.length > 0) {
                            console.log("Sample record:", allData[0]);

                            // ตรวจสอบว่ามีข้อมูลที่ตรงกับเงื่อนไขหรือไม่
                            const matchingRecords = allData.filter((record: any) =>
                                record.termYear === termData.termYear &&
                                record.yearLevel === 'ปี 2' &&
                                record.planType === 'FOUR_YEAR'
                            );

                            console.log(`Matching records found: ${matchingRecords.length}`);
                            if (matchingRecords.length > 0) {
                                console.log("Sample matching record:", matchingRecords[0]);
                            }
                        }
                    }

                    // ดึงข้อมูลตารางเรียนที่บันทึกไว้
                    const timetableRes = await fetch(`/api/timetable?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent('ปี 2')}&planType=FOUR_YEAR`);
                    if (timetableRes.ok) {
                        const timetableData = await timetableRes.json();
                        console.log("Loaded timetable data:", timetableData);

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

                    // ลองหลายแบบในการ query
                    console.log("=== Testing different query combinations ===");

                    // ลองแบบ 1: Query ปกติ
                    const query1 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent('ปี 2')}&planType=FOUR_YEAR`;
                    console.log("Query 1:", query1);

                    // ลองแบบ 2: Query เฉพาะ termYear
                    const query2 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}`;
                    console.log("Query 2:", query2);

                    // ลองแบบ 3: Query เฉพาะ planType
                    const query3 = `/api/subject?planType=FOUR_YEAR`;
                    console.log("Query 3:", query3);

                    let finalData = [];

                    // ลองเรียก API แต่ละแบบ
                    for (const [index, query] of [query1, query2, query3].entries()) {
                        console.log(`Testing query ${index + 1}:`, query);
                        const planRes = await fetch(query);
                        if (planRes.ok) {
                            const data = await planRes.json();
                            console.log(`Query ${index + 1} results:`, data.length, "records");
                            if (data.length > 0 && finalData.length === 0) {
                                finalData = data;
                                console.log(`Using results from query ${index + 1}`);
                                break;
                            }
                        } else {
                            console.log(`Query ${index + 1} failed:`, planRes.status, planRes.statusText);
                        }
                    }

                    // ถ้ายังไม่เจอข้อมูล ลองไม่ใส่ query parameters เลย
                    if (finalData.length === 0) {
                        console.log("No data found with filters, trying without filters...");
                        const planRes = await fetch("/api/subject");
                        if (planRes.ok) {
                            const allData = await planRes.json();
                            console.log("Total data without filters:", allData.length);

                            // กรองข้อมูลใน frontend
                            finalData = allData.filter((record: any) => {
                                const matchTermYear = !termData.termYear || record.termYear === termData.termYear;
                                const matchYearLevel = record.yearLevel === 'ปี 2';
                                const matchPlanType = record.planType === 'FOUR_YEAR';

                                console.log("Filtering record:", {
                                    id: record.id,
                                    termYear: record.termYear,
                                    yearLevel: record.yearLevel,
                                    planType: record.planType,
                                    matchTermYear,
                                    matchYearLevel,
                                    matchPlanType,
                                    match: matchTermYear && matchYearLevel && matchPlanType
                                });

                                return matchTermYear && matchYearLevel && matchPlanType;
                            });

                            console.log("Filtered data:", finalData.length, "records");
                        }
                    }

                    // ตรวจสอบรูปแบบข้อมูลและกำหนดให้กับ state
                    if (Array.isArray(finalData)) {
                        setPlans(finalData);
                        console.log("Set plans with", finalData.length, "records");
                    } else if (finalData && finalData.plans && Array.isArray(finalData.plans)) {
                        setPlans(finalData.plans);
                        console.log("Set plans with", finalData.plans.length, "records");
                    } else {
                        console.warn("API ส่งข้อมูลในรูปแบบที่ไม่ถูกต้อง");
                        setPlans([]);
                    }
                } else {
                    console.error("Failed to fetch term year:", termRes.status, termRes.statusText);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                setPlans([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []); // ลบ dependency termYear ออก เพราะเราจะจัดการใน function

    useEffect(() => {
        if (plans.length > 0) {
            console.log("ข้อมูลทั้งหมด:", plans.length);
            const year1Plans = plans.filter(plan => plan.yearLevel && plan.yearLevel.includes("ปี 2"));
            console.log("วิชาปี 2:", year1Plans.length);
            console.log("ตัวอย่างวิชาปี 2:", year1Plans.length > 0 ? year1Plans[0] : "ไม่พบ");
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
                            yearLevel: 'ปี 2',
                            planType: 'FOUR_YEAR',
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

    // แก้ไขฟังก์ชัน handleSplitSubject ในไฟล์หน้าหลักของหน้า FOUR_YEAR-one-year
    // Define SplitData type (adjust fields as needed)
    type SplitData = {
        lectureHour?: number;
        labHour?: number;
        [key: string]: any;
    };

    async function handleSplitSubject(subjectId: number, splitData: any) {
        try {
            setIsLoading(true);

            // เก็บข้อมูลวิชาเดิมก่อนแบ่ง
            const originalSubject = plans.find(plan => plan.id === subjectId);
            console.log("Original subject before split:", originalSubject);

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

            console.log("Split results received:", {
                updated: updatedSubject,
                new: newSubject
            });

            // อัปเดต state plans - แทนที่วิชาเดิมด้วยวิชาที่อัปเดตแล้ว และเพิ่มวิชาใหม่
            setPlans(prevPlans => {
                const updatedPlans = prevPlans.map(plan =>
                    plan.id === subjectId ? updatedSubject : plan
                );
                // เพิ่มวิชาใหม่เข้าไป
                return [...updatedPlans, newSubject];
            });

            // ลบการจัดตารางของวิชาเดิม (เพราะได้ถูกลบใน API แล้ว)
            setTableAssignments(prev => {
                const newAssignments = { ...prev };
                delete newAssignments[subjectId];
                return newAssignments;
            });

            console.log("Split successful - Updated: ", updatedSubject, "New: ", newSubject);

        } catch (error) {
            console.error("Error splitting subject:", error);
            // alert(`เกิดข้อผิดพลาดในการแบ่งวิชา: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    // เพิ่มฟังก์ชันรวมวิชา
    async function handleMergeSubject(subjectId: number) {
        try {
            setIsLoading(true);

            console.log("Starting merge for subject ID:", subjectId);

            const response = await fetch('/api/subject/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subjectId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to merge subject');
            }

            const { mergedSubject, deletedParts } = await response.json();

            console.log("Merge response:", {
                mergedSubject,
                deletedParts
            });

            // อัปเดต state plans - ลบส่วนที่ถูกรวมและอัปเดตส่วนที่เหลือ
            setPlans(prevPlans => {
                console.log("Previous plans:", prevPlans.length);

                // กรองออกส่วนที่ถูกลบ
                let updatedPlans = prevPlans.filter(plan => !deletedParts.includes(plan.id));

                console.log("After filtering deleted parts:", updatedPlans.length);

                // อัปเดตวิชาที่รวมแล้ว
                updatedPlans = updatedPlans.map(plan => {
                    if (plan.id === mergedSubject.id) {
                        console.log("Updating merged subject:", {
                            old: {
                                id: plan.id,
                                name: plan.subjectName,
                                room: plan.room,
                                teacher: plan.teacher,
                                section: plan.section
                            },
                            new: {
                                id: mergedSubject.id,
                                name: mergedSubject.subjectName,
                                room: mergedSubject.room,
                                teacher: mergedSubject.teacher,
                                section: mergedSubject.section
                            }
                        });
                        return mergedSubject;
                    }
                    return plan;
                });

                console.log("Final plans count:", updatedPlans.length);
                return updatedPlans;
            });

            // ลบการจัดตารางของส่วนที่ถูกรวม
            setTableAssignments(prev => {
                const newAssignments = { ...prev };

                // ลบการจัดตารางของส่วนที่ถูกลบ
                deletedParts.forEach((partId: number) => {
                    console.log("Removing assignment for deleted part:", partId);
                    delete newAssignments[partId];
                });

                // ลบการจัดตารางของวิชาที่รวมแล้ว (เพื่อให้สามารถจัดใหม่ได้)
                console.log("Removing assignment for merged subject:", mergedSubject.id);
                delete newAssignments[mergedSubject.id];

                return newAssignments;
            });

            console.log("Merge successful - Merged: ", mergedSubject, "Deleted: ", deletedParts);

        } catch (error: any) {
            console.error("Error merging subject:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    // แสดง loading indicator
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">กำลังโหลดข้อมูล...</span>
        </div>;
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
    const handleSubjectUpdate = async () => {
        console.log("Refreshing subjects data...", { termYear });

        try {
            setIsLoading(true); // เพิ่มการแสดง loading

            // ใช้ข้อมูล termYear ปัจจุบัน
            const currentTermYear = termYear || "";

            // ลองหลายวิธีในการโหลดข้อมูล
            let freshPlans = [];

            // วิธีที่ 1: ลองเรียก API พร้อม filters
            const response1 = await fetch(`/api/subject?termYear=${encodeURIComponent(currentTermYear)}&yearLevel=${encodeURIComponent('ปี 2')}&planType=FOUR_YEAR`);
            if (response1.ok) {
                const data1 = await response1.json();
                if (data1.length > 0) {
                    freshPlans = data1;
                    console.log("Method 1 success: loaded", freshPlans.length, "plans");
                }
            }

            // วิธีที่ 2: ถ้าไม่ได้ผล ลองโหลดทั้งหมดแล้วกรอง
            if (freshPlans.length === 0) {
                console.log("Method 1 failed, trying method 2...");
                const response2 = await fetch("/api/subject");
                if (response2.ok) {
                    const allData = await response2.json();
                    freshPlans = allData.filter((record: any) => {
                        const matchTermYear = !currentTermYear || record.termYear === currentTermYear;
                        const matchYearLevel = record.yearLevel === 'ปี 2';
                        const matchPlanType = record.planType === 'FOUR_YEAR';
                        return matchTermYear && matchYearLevel && matchPlanType;
                    });
                    console.log("Method 2 success: filtered", freshPlans.length, "plans from", allData.length, "total");
                }
            }

            // อัปเดต plans state ด้วยข้อมูลใหม่
            if (freshPlans.length > 0) {
                setPlans(freshPlans);
                console.log("Updated plans state with fresh data:", freshPlans.length, "records");

                // Debug: แสดงข้อมูลตัวอย่าง
                if (freshPlans[0]) {
                    console.log("Sample fresh plan:", {
                        id: freshPlans[0].id,
                        subjectCode: freshPlans[0].subjectCode,
                        section: freshPlans[0].section,
                        room: freshPlans[0].room,
                        teacher: freshPlans[0].teacher
                    });
                }
            } else {
                console.warn("No fresh plans found, keeping existing data");
            }

        } catch (error) {
            console.error("Error refreshing plans:", error);
        } finally {
            setIsLoading(false); // ปิด loading
        }
    };

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
                        ตารางเรียน 4 ปี ปี 2 ภาคเรียนที่ {termYear}
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
                    planType="FOUR_YEAR"
                    plans={plans}
                    assignments={tableAssignments}
                    assignedCount={assignedSubjectsCount}
                    onRemoveAssignment={handleRemoveAssignment}
                    onSplitSubject={handleSplitSubject}
                    onMergeSubject={handleMergeSubject} // เพิ่มบรรทัดนี้
                    conflicts={conflicts}
                    onSubjectUpdate={handleSubjectUpdate}
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
                                        height: '70px' // เพิ่มความสูงเล็กน้อยเพื่อรองรับ section
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="font-medium text-green-950 dark:text-green-50 mb-1">
                                            {activeSubject.subjectCode}
                                            {/* แสดง section ถ้ามี */}
                                            {activeSubject.section && (
                                                <span className="ml-1 text-[8px] bg-blue-200 dark:bg-blue-700 px-1 rounded">
                                                    {activeSubject.section}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] truncate max-w-[110px] text-green-900 dark:text-green-100">
                                            {activeSubject.subjectName}
                                        </div>

                                        {/* แสดงข้อมูลห้องและอาจารย์ถ้ามี */}
                                        {(activeSubject.room?.roomCode || activeSubject.teacher?.tName) && (
                                            <div className="text-[8px] mt-1 text-green-800 dark:text-green-200">
                                                {activeSubject.room?.roomCode && (
                                                    <span className="bg-yellow-200 dark:bg-yellow-700 px-1 rounded mr-1">
                                                        {activeSubject.room.roomCode}
                                                    </span>
                                                )}
                                                {activeSubject.teacher?.tName && (
                                                    <span className="bg-purple-200 dark:bg-purple-700 px-1 rounded">
                                                        {activeSubject.teacher.tName}
                                                    </span>
                                                )}
                                            </div>
                                        )}

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