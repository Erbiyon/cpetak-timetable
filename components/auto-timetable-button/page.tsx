import { Wand } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Loader2 } from "lucide-react";

interface AutoTimetableButtonProps {
    plans?: any[];
    termYear?: string;
    yearLevel?: string;
    planType?: string;
    currentAssignments?: { [subjectId: number]: { day: number; periods: number[] } | null };
    onScheduleComplete?: (newAssignments: { [subjectId: number]: { day: number; periods: number[] } }) => void;
}

export default function AutoTimetableButton({
    plans = [],
    termYear = "",
    yearLevel = "",
    planType = "",
    currentAssignments = {},
    onScheduleComplete
}: AutoTimetableButtonProps) {
    const [isScheduling, setIsScheduling] = useState(false);

    const handleAutoSchedule = async () => {
        if (isScheduling || !plans.length) return;

        setIsScheduling(true);
        try {
            console.log('🚀 เริ่มการจัดตารางอัตโนมัติ');


            const unassignedPlans = plans.filter(plan => !currentAssignments[plan.id]);

            if (unassignedPlans.length === 0) {
                console.log("ไม่มีวิชาที่ต้องจัดตาราง");
                return;
            }

            console.log(`จำนวนวิชาที่ต้องจัด: ${unassignedPlans.length}`);


            const sortedPlans = [...unassignedPlans].sort((a, b) => {
                const totalHoursA = (a.lectureHour || 0) + (a.labHour || 0);
                const totalHoursB = (b.lectureHour || 0) + (b.labHour || 0);
                return totalHoursB - totalHoursA;
            });


            const newAssignments = { ...currentAssignments };


            const activityPeriods = [14, 15, 16, 17];


            const MAX_DAYS = 7;
            const MAX_PERIODS = 25;

            const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

            let successCount = 0;
            let failCount = 0;


            for (const subject of sortedPlans) {
                const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
                const totalPeriods = totalHours * 2;

                if (totalPeriods === 0) {
                    console.log(`ข้ามวิชา ${subject.subjectCode} (ไม่มีชั่วโมงเรียน)`);
                    continue;
                }

                console.log(`\nกำลังจัดวิชา ${subject.subjectCode} (${totalPeriods} คาบ)`);
                console.log(`   อาจารย์: ${subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : 'ไม่ระบุ'}`);
                console.log(`   ห้อง: ${subject.room ? subject.room.roomCode : 'ไม่ระบุ'}`);

                let scheduled = false;


                for (let day = 0; day < MAX_DAYS && !scheduled; day++) {
                    console.log(`   ลองวัน ${dayNames[day]}`);


                    for (let startPeriod = 0; startPeriod < MAX_PERIODS - totalPeriods + 1 && !scheduled; startPeriod++) {
                        const isWednesday = day === 2;


                        const neededPeriods: number[] = [];
                        let canScheduleHere = true;

                        for (let i = 0; i < totalPeriods; i++) {
                            const currentPeriod = startPeriod + i;


                            if (isWednesday && activityPeriods.includes(currentPeriod)) {
                                canScheduleHere = false;
                                break;
                            }

                            neededPeriods.push(currentPeriod);
                        }


                        if (!canScheduleHere) {
                            continue;
                        }


                        let hasSimpleConflict = false;
                        let conflictReason = "";


                        for (const [existingId, assignment] of Object.entries(newAssignments)) {
                            if (assignment && assignment.day === day && Number(existingId) !== subject.id) {

                                const overlap = neededPeriods.some(p => assignment.periods.includes(p));
                                if (overlap) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ชนกับวิชา ID ${existingId}`;
                                    break;
                                }


                                const minNew = Math.min(...neededPeriods);
                                const maxNew = Math.max(...neededPeriods);
                                const minExisting = Math.min(...assignment.periods);
                                const maxExisting = Math.max(...assignment.periods);


                                if (maxNew + 2 >= minExisting && maxNew < minExisting) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ต้องเว้นระยะห่าง 2 คาบกับวิชา ID ${existingId}`;
                                    break;
                                }


                                if (minNew <= maxExisting + 2 && minNew > maxExisting) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ต้องเว้นระยะห่าง 2 คาบกับวิชา ID ${existingId}`;
                                    break;
                                }
                            }
                        }

                        if (!hasSimpleConflict) {

                            const tentativeAssignment = {
                                day,
                                periods: neededPeriods
                            };


                            newAssignments[subject.id] = tentativeAssignment;


                            try {
                                const startPeriodSave = Math.min(...neededPeriods);
                                const endPeriodSave = Math.max(...neededPeriods);

                                console.log(`     พยายามบันทึก: วัน ${day} คาบ ${startPeriodSave}-${endPeriodSave}`);

                                const response = await fetch('/api/timetable', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        planId: subject.id,
                                        termYear: termYear,
                                        yearLevel: yearLevel,
                                        planType: planType,
                                        day: day,
                                        startPeriod: startPeriodSave,
                                        endPeriod: endPeriodSave,
                                        roomId: subject.roomId || null,
                                        teacherId: subject.teacherId || null,
                                        section: subject.section || null
                                    }),
                                });

                                if (response.ok) {
                                    console.log(`บันทึกสำเร็จ: ${subject.subjectCode} ในวัน${dayNames[day]} คาบ ${neededPeriods.join(',')}`);
                                    scheduled = true;
                                    successCount++;


                                    const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
                                    if (isDVEPlan) {
                                        const targetPlanType = planType === "DVE-MSIX" ? "DVE-LVC" : "DVE-MSIX";

                                        try {

                                            const searchResponse = await fetch(`/api/subject?subjectCode=${encodeURIComponent(subject.subjectCode)}&termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${targetPlanType}`);

                                            if (searchResponse.ok) {
                                                const targetSubjects = await searchResponse.json();
                                                const matchingSubject = targetSubjects.find((s: any) => s.subjectCode === subject.subjectCode);

                                                if (matchingSubject) {
                                                    console.log(`     ซิ๊งค์ไปยัง ${targetPlanType} สำหรับวิชา ${subject.subjectCode}`);

                                                    const syncResponse = await fetch('/api/timetable', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({
                                                            planId: matchingSubject.id,
                                                            termYear: termYear,
                                                            yearLevel: yearLevel,
                                                            planType: targetPlanType,
                                                            day: day,
                                                            startPeriod: startPeriodSave,
                                                            endPeriod: endPeriodSave,
                                                            roomId: matchingSubject.roomId || null,
                                                            teacherId: matchingSubject.teacherId || null,
                                                            section: matchingSubject.section || null
                                                        }),
                                                    });

                                                    if (syncResponse.ok) {
                                                        console.log(`     ซิ๊งค์สำเร็จ: ${subject.subjectCode} ไปยัง ${targetPlanType}`);
                                                    } else {
                                                        console.log(`     ซิ๊งค์ไม่สำเร็จ: ${await syncResponse.text()}`);
                                                    }
                                                }
                                            }
                                        } catch (syncError) {
                                            console.log(`     เกิดข้อผิดพลาดในการซิ๊งค์: ${syncError}`);
                                        }
                                    }
                                } else {

                                    delete newAssignments[subject.id];
                                    const errorText = await response.text();
                                    console.log(`     บันทึกไม่สำเร็จ: ${response.status} - ${errorText}`);


                                    if (response.status === 409 && errorText.includes("Section")) {
                                        scheduled = false;
                                        break;
                                    }


                                    continue;
                                }
                            } catch (error) {

                                delete newAssignments[subject.id];
                                console.log(`     เกิดข้อผิดพลาด: ${error}`);
                                continue;
                            }
                        } else {
                            console.log(`     ข้ามคาบ ${startPeriod}-${startPeriod + totalPeriods - 1}: ${conflictReason}`);
                        }
                    }
                }

                if (!scheduled) {
                    console.log(`   ไม่สามารถจัดวิชา ${subject.subjectCode} ได้`);
                    failCount++;
                }
            }

            console.log(`\nสรุปผล: สำเร็จ ${successCount} วิชา, ไม่สำเร็จ ${failCount} วิชา`);


            if (onScheduleComplete) {
                const validAssignments = Object.fromEntries(
                    Object.entries(newAssignments).filter(([_, assignment]) => assignment !== null)
                ) as { [subjectId: number]: { day: number; periods: number[] } };
                onScheduleComplete(validAssignments);
            }

        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการจัดตาราง:", error);
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="secondary"
                        onClick={handleAutoSchedule}
                        disabled={isScheduling || plans.length === 0}
                        className="gap-2"
                    >
                        {isScheduling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wand className="h-4 w-4" />
                        )}
                        จัดตาราง
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>จัดตารางอัตโนมัติโดยเว้นระยะห่างระหว่างวิชา 2 คาบ</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}