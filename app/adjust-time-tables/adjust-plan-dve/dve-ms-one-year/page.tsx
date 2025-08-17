"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import DownloadButtonTimetable from "@/components/download-button/download-button-timetable";

export default function DveMsixOneYear() {
    const [termYear, setTermYear] = useState<string | undefined>(undefined);
    const [plans, setPlans] = useState<any[]>([]);
    const [activeSubject, setActiveSubject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dragOverCell, setDragOverCell] = useState<{ day: number; period: number } | null>(null);
    const [conflicts, setConflicts] = useState<any[]>([]);  // เพิ่ม state เก็บข้อมูลการชนกัน
    const [dragFailedSubjectId, setDragFailedSubjectId] = useState<number | null>(null); // State สำหรับเก็บ ID วิชาที่ลากไม่สำเร็จ
    const [timetableData, setTimetableData] = useState<any[]>([]); // เพิ่ม state สำหรับเก็บข้อมูลตารางเรียน

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
                                record.yearLevel === 'ปี 1' &&
                                record.planType === 'DVE-MSIX'
                            );

                            console.log(`Matching records found: ${matchingRecords.length}`);
                            if (matchingRecords.length > 0) {
                                console.log("Sample matching record:", matchingRecords[0]);
                            }
                        }
                    }

                    // ดึงข้อมูลตารางเรียนที่บันทึกไว้
                    const timetableRes = await fetch(`/api/timetable?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent('ปี 1')}&planType=DVE-MSIX`);
                    if (timetableRes.ok) {
                        const timetableData = await timetableRes.json();
                        console.log("Loaded timetable data:", timetableData);

                        setTimetableData(timetableData);

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

                    // ลองหลายแบบในการ query - ปรับให้ดึงทั้งสอง planType
                    console.log("=== Testing different query combinations ===");

                    // ลองแบบ 1: Query ทั้งสอง planType
                    const query1 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent('ปี 1')}`;
                    console.log("Query 1 (DVE both):", query1);

                    // ลองแบบ 2: Query เฉพาะ termYear
                    const query2 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}`;
                    console.log("Query 2:", query2);

                    let finalData = [];

                    // ลองเรียก API แต่ละแบบ
                    for (const [index, query] of [query1, query2].entries()) {
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

                            // กรองข้อมูลใน frontend - เอาเฉพาะ DVE-MSIX
                            finalData = allData.filter((record: any) => {
                                const matchTermYear = !termData.termYear || record.termYear === termData.termYear;
                                const matchYearLevel = record.yearLevel === 'ปี 1';
                                const matchPlanType = record.planType === 'DVE-MSIX';

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

                            console.log("Filtered DVE data:", finalData.length, "records");
                        }
                    }

                    // ตรวจสอบรูปแบบข้อมูลและกำหนดให้กับ state
                    if (Array.isArray(finalData)) {
                        setPlans(finalData);
                        console.log("Set plans with", finalData.length, "records (DVE-MSIX only)");
                    } else if (finalData && finalData.plans && Array.isArray(finalData.plans)) {
                        setPlans(finalData.plans);
                        console.log("Set plans with", finalData.plans.length, "records (DVE-MSIX only)");
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
            const year1Plans = plans.filter(plan => plan.yearLevel && plan.yearLevel.includes("ปี 1"));
            const dveMsixPlans = year1Plans.filter(plan => plan.planType === "DVE-MSIX");
            const dveLvcPlans = year1Plans.filter(plan => plan.planType === "DVE-LVC");
            console.log("วิชาปี 1 ทั้งหมด:", year1Plans.length);
            console.log("วิชา DVE-MSIX:", dveMsixPlans.length);
            console.log("วิชา DVE-LVC:", dveLvcPlans.length);
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
            // เคลียร์ conflicts เมื่อไม่มีการ drop
            setConflicts([]);
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
                    setDragFailedSubjectId(subjectId);
                    setConflicts([]); // เคลียร์ conflicts
                    setActiveSubject(null);
                    return;
                }

                // ตรวจสอบว่าไม่ทับช่วงกิจกรรมวันพุธ
                const isWednesday = day === 2;
                const activityPeriods = [14, 15, 16, 17]; // คาบกิจกรรมวันพุธ
                const wouldOverlapActivity = isWednesday && activityPeriods.some(actPeriod => {
                    return period <= actPeriod && period + totalPeriods - 1 >= actPeriod;
                });

                if (wouldOverlapActivity) {
                    console.warn("ไม่สามารถวางวิชาได้: ทับช่วงกิจกรรม");
                    setDragFailedSubjectId(subjectId);
                    setConflicts([]); // เคลียร์ conflicts
                    setActiveSubject(null);
                    return;
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
                    setDragFailedSubjectId(subjectId);
                    setConflicts([]); // เคลียร์ conflicts
                    setActiveSubject(null);
                    return;
                }

                // อัปเดต tableAssignments ก่อนส่งไป API (เพื่อให้ UI เห็นการเปลี่ยนแปลงทันที)
                const newAssignment = { day, periods };
                setTableAssignments(prev => ({
                    ...prev,
                    [subjectId]: newAssignment
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
                            yearLevel: 'ปี 1',
                            planType: 'DVE-MSIX',
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
                        console.log("พบการชนกัน - กำลังคืนสถานะ");

                        // คืนสถานะ tableAssignments เป็นค่าเดิม
                        setTableAssignments(prev => {
                            const newState = { ...prev };
                            if (activeSubject?.fromTable && activeSubject.originalAssignment) {
                                // ถ้าลากจากตาราง ให้คืนค่าเป็นตำแหน่งเดิม
                                newState[subjectId] = activeSubject.originalAssignment;
                            } else {
                                // ถ้าลากจากรายการ ให้ลบออกจากตาราง (คืนไปรายการ)
                                delete newState[subjectId];
                            }
                            return newState;
                        });

                        // ตั้งค่า conflicts และ dragFailedSubjectId
                        setConflicts(data.conflicts);
                        setDragFailedSubjectId(subjectId);
                    } else if (!response.ok) {
                        console.error("เกิดข้อผิดพลาดในการบันทึก");

                        // คืนสถานะเมื่อเกิดข้อผิดพลาด
                        setTableAssignments(prev => {
                            const newState = { ...prev };
                            if (activeSubject?.fromTable && activeSubject.originalAssignment) {
                                newState[subjectId] = activeSubject.originalAssignment;
                            } else {
                                delete newState[subjectId];
                            }
                            return newState;
                        });

                        setDragFailedSubjectId(subjectId);
                        setConflicts([]); // เคลียร์ conflicts เมื่อเกิดข้อผิดพลาดอื่น
                        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกตาราง');
                    } else {
                        // บันทึกสำเร็จ
                        console.log("บันทึกตารางเรียนสำเร็จ", data);
                        setConflicts([]); // เคลียร์การชนกัน
                        setDragFailedSubjectId(null); // เคลียร์ drag failed state

                        // ซิ๊งค์ไปยัง DVE-LVC หากมีวิชารหัสเดียวกัน
                        try {
                            // ค้นหาวิชาใน DVE-LVC ที่มี subjectCode เดียวกัน
                            const searchResponse = await fetch(`/api/subject?subjectCode=${encodeURIComponent(subject.subjectCode)}&termYear=${encodeURIComponent(termYear || '')}&yearLevel=${encodeURIComponent('ปี 1')}&planType=DVE-LVC`);

                            if (searchResponse.ok) {
                                const dveSubjects = await searchResponse.json();
                                const matchingSubject = dveSubjects.find((s: any) => s.subjectCode === subject.subjectCode);

                                if (matchingSubject) {
                                    console.log("พบวิชาใน DVE-LVC ที่ต้องซิ๊งค์:", matchingSubject.subjectCode);

                                    // บันทึกตารางสำหรับ DVE-LVC
                                    const syncResponse = await fetch('/api/timetable', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            planId: matchingSubject.id,
                                            termYear: termYear || '1',
                                            yearLevel: 'ปี 1',
                                            planType: 'DVE-LVC',
                                            day,
                                            startPeriod,
                                            endPeriod,
                                            roomId: matchingSubject.roomId || null,
                                            teacherId: matchingSubject.teacherId || null,
                                            section: matchingSubject.section || null
                                        }),
                                    });

                                    if (syncResponse.ok) {
                                        console.log("ซิ๊งค์ตารางไปยัง DVE-LVC สำเร็จ");
                                    } else {
                                        console.warn("ไม่สามารถซิ๊งค์ตารางไปยัง DVE-LVC ได้:", await syncResponse.text());
                                    }
                                }
                            }
                        } catch (syncError) {
                            console.warn("เกิดข้อผิดพลาดในการซิ๊งค์ไปยัง DVE-LVC:", syncError);
                        }
                    }
                } catch (error) {
                    console.error("เกิดข้อผิดพลาดในการบันทึกตารางเรียน:", error);

                    // คืนสถานะเมื่อเกิดข้อผิดพลาด
                    setTableAssignments(prev => {
                        const newState = { ...prev };
                        if (activeSubject?.fromTable && activeSubject.originalAssignment) {
                            newState[subjectId] = activeSubject.originalAssignment;
                        } else {
                            delete newState[subjectId];
                        }
                        return newState;
                    });

                    setDragFailedSubjectId(subjectId);
                    setConflicts([]); // เคลียร์ conflicts เมื่อเกิดข้อผิดพลาด
                }
            }
        } else {
            // ถ้า drop ไม่ใช่ในตาราง ให้เคลียร์ conflicts
            setConflicts([]);
        }

        setActiveSubject(null);
    }

    // ฟังก์ชั่นสำหรับลบวิชาออกจากตาราง
    async function handleRemoveAssignment(subjectId: number) {
        try {
            // หาข้อมูลวิชาก่อนลบ
            const subject = plans.find(plan => plan.id === subjectId);

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

            // เคลียร์ dragFailedSubjectId ถ้าเป็นวิชาเดียวกัน
            setDragFailedSubjectId(prev => prev === subjectId ? null : prev);

            // ซิ๊งค์การลบไปยัง DVE-LVC หากมีวิชารหัสเดียวกัน
            if (subject) {
                try {
                    const searchResponse = await fetch(`/api/subject?subjectCode=${encodeURIComponent(subject.subjectCode)}&termYear=${encodeURIComponent(termYear || '')}&yearLevel=${encodeURIComponent('ปี 1')}&planType=DVE-LVC`);

                    if (searchResponse.ok) {
                        const dveSubjects = await searchResponse.json();
                        const matchingSubject = dveSubjects.find((s: any) => s.subjectCode === subject.subjectCode);

                        if (matchingSubject) {
                            console.log("ลบวิชาใน DVE-LVC ด้วย:", matchingSubject.subjectCode);

                            await fetch(`/api/timetable/${matchingSubject.id}`, {
                                method: 'DELETE',
                            });

                            console.log("ซิ๊งค์การลบไปยัง DVE-LVC สำเร็จ");
                        }
                    }
                } catch (syncError) {
                    console.warn("เกิดข้อผิดพลาดในการซิ๊งค์การลบไปยัง DVE-LVC:", syncError);
                }
            }

        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลบข้อมูลตารางเรียน:", error);
        }
    }

    // แก้ไขฟังก์ชัน handleSplitSubject ในไฟล์หน้าหลักของหน้า DVE-MSIX-one-year
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

            // ซิ๊งค์การรวมวิชาไปยัง DVE-LVC หากมีวิชารหัสเดียวกัน
            try {
                console.log("🔄 ซิ๊งค์การรวมวิชาไปยัง DVE-LVC");

                // ค้นหาวิชาใน DVE-LVC ที่มี subjectCode เดียวกัน
                const searchResponse = await fetch(`/api/subject?subjectCode=${encodeURIComponent(mergedSubject.subjectCode)}&termYear=${encodeURIComponent(termYear || '')}&yearLevel=${encodeURIComponent('ปี 1')}&planType=DVE-LVC`);

                if (searchResponse.ok) {
                    const dveSubjects = await searchResponse.json();

                    // หาวิชาที่แบ่งแล้วใน DVE-LVC (มี "(ส่วนที่" ในชื่อ)
                    const splitSubjects = dveSubjects.filter((s: any) =>
                        s.subjectCode === mergedSubject.subjectCode &&
                        s.subjectName.includes('(ส่วนที่')
                    );

                    if (splitSubjects.length > 0) {
                        console.log(`พบวิชาที่แบ่งแล้วใน DVE-LVC จำนวน ${splitSubjects.length} ส่วน`);

                        // รวมวิชาแรกที่พบ (ระบบจะรวมทั้งหมดอัตโนมัติ)
                        const firstSplitSubject = splitSubjects[0];

                        const syncMergeResponse = await fetch('/api/subject/merge', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ subjectId: firstSplitSubject.id }),
                        });

                        if (syncMergeResponse.ok) {
                            console.log("✅ ซิ๊งค์การรวมวิชาไปยัง DVE-LVC สำเร็จ");
                        } else {
                            console.log("⚠️ ซิ๊งค์การรวมวิชาไปยัง DVE-LVC ไม่สำเร็จ:", await syncMergeResponse.text());
                        }
                    } else {
                        console.log("ไม่พบวิชาที่แบ่งแล้วใน DVE-LVC ที่ต้องรวม");
                    }
                }
            } catch (syncError) {
                console.log("⚠️ เกิดข้อผิดพลาดในการซิ๊งค์การรวมวิชา:", syncError);
            }

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
        console.log("Refreshing subjects and timetable data...");

        try {
            setIsLoading(true);

            // First, refresh the timetable assignments
            const timetableRes = await fetch(`/api/timetable?termYear=${encodeURIComponent(termYear || "")}&yearLevel=${encodeURIComponent('ปี 1')}&planType=DVE-MSIX`);
            if (timetableRes.ok) {
                const timetableData = await timetableRes.json();

                // Convert to tableAssignments format
                const assignments: { [subjectId: number]: { day: number, periods: number[] } } = {};
                setTimetableData(timetableData);

                timetableData.forEach((item: any) => {
                    const periods: number[] = [];
                    for (let p = item.startPeriod; p <= item.endPeriod; p++) {
                        if (item.day === 2 && p >= 14 && p <= 17) continue;
                        periods.push(p);
                    }

                    assignments[item.planId] = {
                        day: item.day,
                        periods: periods
                    };
                });

                setTableAssignments(assignments);
                console.log("Updated tableAssignments after refresh:", assignments);
            }

            // รีเฟรชข้อมูลวิชา - ดึงทั้งสอง planType สำหรับ DVE
            const planRes = await fetch(`/api/subject?termYear=${encodeURIComponent(termYear || "")}&yearLevel=${encodeURIComponent('ปี 1')}`);
            if (planRes.ok) {
                const allPlanData = await planRes.json();
                // กรองเฉพาะ DVE-MSIX
                const dvePlanData = allPlanData.filter((plan: any) =>
                    plan.planType === "DVE-MSIX"
                );

                if (Array.isArray(dvePlanData) && dvePlanData.length > 0) {
                    setPlans(dvePlanData);
                    console.log("Updated plans after refresh:", dvePlanData.length, "records (DVE-MSIX only)");
                }
            }

        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setIsLoading(false);
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
                    <div className="flex justify-between mx-8 pb-2 text-lg font-semibold">
                        ตารางเรียน ม.6 ขึ้น ปวส. ปี 1 ภาคเรียนที่ {termYear}
                        <DownloadButtonTimetable
                            currentTermYear={termYear}
                            timetables={timetableData}
                        />
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
                    yearLevel="ปี 1"
                    planType="DVE-MSIX"
                    plans={plans}
                    assignments={tableAssignments}
                    assignedCount={assignedSubjectsCount}
                    onRemoveAssignment={handleRemoveAssignment}
                    onSplitSubject={handleSplitSubject}
                    onMergeSubject={handleMergeSubject} // เพิ่มบรรทัดนี้
                    conflicts={conflicts}
                    onSubjectUpdate={handleSubjectUpdate}
                    dragFailedSubjectId={dragFailedSubjectId} // ส่ง dragFailedSubjectId ไปยัง PlansStatusCustom
                    onDragFailedReset={() => setDragFailedSubjectId(null)} // ฟังก์ชันรีเซ็ตเมื่อการลากไม่สำเร็จ
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