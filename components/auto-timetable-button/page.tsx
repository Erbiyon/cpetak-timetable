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

            // Find unassigned subjects
            const unassignedPlans = plans.filter(plan => !currentAssignments[plan.id]);

            if (unassignedPlans.length === 0) {
                console.log("❌ ไม่มีวิชาที่ต้องจัดตาราง");
                return;
            }

            console.log(`📝 จำนวนวิชาที่ต้องจัด: ${unassignedPlans.length}`);

            // Sort subjects by total hours (descending) to schedule larger subjects first
            const sortedPlans = [...unassignedPlans].sort((a, b) => {
                const totalHoursA = (a.lectureHour || 0) + (a.labHour || 0);
                const totalHoursB = (b.lectureHour || 0) + (b.labHour || 0);
                return totalHoursB - totalHoursA;
            });

            // Clone current assignments to build upon
            const newAssignments = { ...currentAssignments };

            // Activity periods to avoid (Wednesday periods 14-17)
            const activityPeriods = [14, 15, 16, 17];

            // Define day and period limits
            const MAX_DAYS = 7;  // Monday to Sunday (0-6)
            const MAX_PERIODS = 25;  // Maximum periods per day

            // Required gap between subjects (in periods)
            const REQUIRED_GAP = 2;

            // Day names for debugging
            const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

            let successCount = 0;
            let failCount = 0;

            // For each subject, find an available slot
            for (const subject of sortedPlans) {
                const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
                const totalPeriods = totalHours * 2;

                if (totalPeriods === 0) {
                    console.log(`⚠️ ข้ามวิชา ${subject.subjectCode} (ไม่มีชั่วโมงเรียน)`);
                    continue;
                }

                console.log(`\n📚 กำลังจัดวิชา ${subject.subjectCode} (${totalPeriods} คาบ)`);
                console.log(`   อาจารย์: ${subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : 'ไม่ระบุ'}`);
                console.log(`   ห้อง: ${subject.room ? subject.room.roomCode : 'ไม่ระบุ'}`);

                let scheduled = false;

                // Try each day
                for (let day = 0; day < MAX_DAYS && !scheduled; day++) {
                    console.log(`   ลองวัน ${dayNames[day]}`);

                    // Start from period 0 and try each possible starting period
                    for (let startPeriod = 0; startPeriod < MAX_PERIODS - totalPeriods + 1 && !scheduled; startPeriod++) {
                        const isWednesday = day === 2;

                        // Calculate periods needed for this subject
                        const neededPeriods: number[] = [];
                        let canScheduleHere = true;

                        for (let i = 0; i < totalPeriods; i++) {
                            const currentPeriod = startPeriod + i;

                            // Skip if this would overlap with Wednesday activities
                            if (isWednesday && activityPeriods.includes(currentPeriod)) {
                                canScheduleHere = false;
                                break;
                            }

                            neededPeriods.push(currentPeriod);
                        }

                        // Skip if can't schedule due to activity periods
                        if (!canScheduleHere) {
                            continue;
                        }

                        // Simple conflict check - check period overlap and required gap
                        let hasSimpleConflict = false;
                        let conflictReason = "";

                        // Check against current assignments (this session)
                        for (const [existingId, assignment] of Object.entries(newAssignments)) {
                            if (assignment && assignment.day === day && Number(existingId) !== subject.id) {
                                // Check direct period overlap
                                const overlap = neededPeriods.some(p => assignment.periods.includes(p));
                                if (overlap) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ชนกับวิชา ID ${existingId}`;
                                    break;
                                }

                                // Check 1-hour gap (2 periods) requirement
                                const minNew = Math.min(...neededPeriods);
                                const maxNew = Math.max(...neededPeriods);
                                const minExisting = Math.min(...assignment.periods);
                                const maxExisting = Math.max(...assignment.periods);

                                // If new subject ends less than 2 periods before existing subject starts
                                if (maxNew + 2 >= minExisting && maxNew < minExisting) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ต้องเว้นระยะห่าง 2 คาบกับวิชา ID ${existingId}`;
                                    break;
                                }

                                // If new subject starts less than 2 periods after existing subject ends
                                if (minNew <= maxExisting + 2 && minNew > maxExisting) {
                                    hasSimpleConflict = true;
                                    conflictReason = `ต้องเว้นระยะห่าง 2 คาบกับวิชา ID ${existingId}`;
                                    break;
                                }
                            }
                        }

                        if (!hasSimpleConflict) {
                            // We found a suitable slot - try to save it
                            const tentativeAssignment = {
                                day,
                                periods: neededPeriods
                            };

                            // Add to assignments
                            newAssignments[subject.id] = tentativeAssignment;

                            // Try to save to database immediately
                            try {
                                const startPeriodSave = Math.min(...neededPeriods);
                                const endPeriodSave = Math.max(...neededPeriods);

                                console.log(`     💾 พยายามบันทึก: วัน ${day} คาบ ${startPeriodSave}-${endPeriodSave}`);

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
                                    console.log(`     ✅ บันทึกสำเร็จ: ${subject.subjectCode} ในวัน${dayNames[day]} คาบ ${neededPeriods.join(',')}`);
                                    scheduled = true;
                                    successCount++;
                                } else {
                                    // Remove from assignments if save failed
                                    delete newAssignments[subject.id];
                                    const errorText = await response.text();
                                    console.log(`     ❌ บันทึกไม่สำเร็จ: ${response.status} - ${errorText}`);

                                    // Try next position
                                    continue;
                                }
                            } catch (error) {
                                // Remove from assignments if error occurred
                                delete newAssignments[subject.id];
                                console.log(`     ❌ เกิดข้อผิดพลาด: ${error}`);
                                continue;
                            }
                        } else {
                            console.log(`     ⚠️ ข้ามคาบ ${startPeriod}-${startPeriod + totalPeriods - 1}: ${conflictReason}`);
                        }
                    }
                }

                if (!scheduled) {
                    console.log(`   ❌ ไม่สามารถจัดวิชา ${subject.subjectCode} ได้`);
                    failCount++;
                }
            }

            console.log(`\n📊 สรุปผล: สำเร็จ ${successCount} วิชา, ไม่สำเร็จ ${failCount} วิชา`);

            // Call the callback with the new assignments
            if (onScheduleComplete) {
                const validAssignments = Object.fromEntries(
                    Object.entries(newAssignments).filter(([_, assignment]) => assignment !== null)
                ) as { [subjectId: number]: { day: number; periods: number[] } };
                onScheduleComplete(validAssignments);
            }

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการจัดตาราง:", error);
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