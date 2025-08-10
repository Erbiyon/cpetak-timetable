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
            // Find unassigned subjects
            const unassignedPlans = plans.filter(plan => !currentAssignments[plan.id]);

            if (unassignedPlans.length === 0) {
                console.log("No unassigned subjects to schedule");
                return;
            }

            console.log(`Starting auto-scheduling for ${unassignedPlans.length} subjects`);

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
            const MAX_DAYS = 7;  // Monday to Sunday
            const MAX_PERIODS = 25;  // Maximum periods per day

            // Required gap between subjects (in periods)
            const REQUIRED_GAP = 2;

            // For each subject, find an available slot
            for (const subject of sortedPlans) {
                const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
                const totalPeriods = totalHours * 2;

                if (totalPeriods === 0) continue;

                let scheduled = false;

                // Try each day
                for (let day = 0; day < MAX_DAYS && !scheduled; day++) {
                    // Start from period 0 and try each possible starting period
                    for (let startPeriod = 0; startPeriod < MAX_PERIODS - totalPeriods && !scheduled; startPeriod++) {
                        // Check if this slot is available
                        const isWednesday = day === 2;

                        // Calculate periods needed for this subject
                        const neededPeriods: number[] = [];
                        for (let i = 0; i < totalPeriods; i++) {
                            const currentPeriod = startPeriod + i;

                            // Skip if this would overlap with Wednesday activities
                            if (isWednesday && activityPeriods.includes(currentPeriod)) {
                                break; // Can't schedule here, try next position
                            }

                            neededPeriods.push(currentPeriod);
                        }

                        // If we couldn't get all needed periods (due to activity periods), skip this slot
                        if (neededPeriods.length < totalPeriods) continue;

                        // Check for conflicts with existing assignments
                        let hasConflict = false;
                        Object.entries(newAssignments).forEach(([existingSubjectId, assignment]) => {
                            if (assignment && assignment.day === day) {
                                // Check if any period overlaps
                                if (neededPeriods.some(p => assignment.periods.includes(p))) {
                                    hasConflict = true;
                                    return;
                                }

                                // Check if there's less than REQUIRED_GAP (2) periods gap between subjects
                                const minPeriod = Math.min(...neededPeriods);
                                const maxPeriod = Math.max(...neededPeriods);
                                const minExisting = Math.min(...assignment.periods);
                                const maxExisting = Math.max(...assignment.periods);

                                // If this subject would end less than REQUIRED_GAP periods before another subject starts
                                // Fixed: Use >= instead of > to ensure exactly REQUIRED_GAP periods gap
                                if (maxPeriod + REQUIRED_GAP >= minExisting && maxPeriod < minExisting) {
                                    hasConflict = true;
                                    return;
                                }

                                // If this subject would start less than REQUIRED_GAP periods after another subject ends
                                // Fixed: Use >= instead of > to ensure exactly REQUIRED_GAP periods gap
                                if (minPeriod <= maxExisting + REQUIRED_GAP && minPeriod > maxExisting) {
                                    hasConflict = true;
                                    return;
                                }
                            }
                        });

                        if (!hasConflict) {
                            // We found a suitable slot
                            newAssignments[subject.id] = {
                                day,
                                periods: neededPeriods
                            };

                            scheduled = true;
                            console.log(`Scheduled ${subject.subjectCode} on day ${day}, periods ${neededPeriods.join(',')}`);
                        }
                    }
                }

                if (!scheduled) {
                    console.log(`Could not schedule ${subject.subjectCode}`);
                }
            }

            // Save the new assignments to the database
            for (const [subjectId, assignment] of Object.entries(newAssignments)) {
                // Skip subjects that were already scheduled
                if (currentAssignments[Number(subjectId)]) continue;

                if (assignment) {
                    const subject = plans.find(plan => plan.id === Number(subjectId));
                    if (!subject) continue;

                    try {
                        const startPeriod = Math.min(...assignment.periods);
                        const endPeriod = Math.max(...assignment.periods);

                        await fetch('/api/timetable', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                planId: Number(subjectId),
                                termYear: termYear,
                                yearLevel: yearLevel,
                                planType: planType,
                                day: assignment.day,
                                startPeriod,
                                endPeriod,
                                roomId: subject.roomId || null,
                                teacherId: subject.teacherId || null,
                                section: subject.section || null
                            }),
                        });
                    } catch (error) {
                        console.error(`Error saving assignment for subject ${subjectId}:`, error);
                    }
                }
            }

            // Call the callback with the new assignments
            if (onScheduleComplete) {
                // Filter out null assignments to match the expected type
                const validAssignments = Object.fromEntries(
                    Object.entries(newAssignments).filter(([_, assignment]) => assignment !== null)
                ) as { [subjectId: number]: { day: number; periods: number[] } };
                onScheduleComplete(validAssignments);
            }

        } catch (error) {
            console.error("Error during auto-scheduling:", error);
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
