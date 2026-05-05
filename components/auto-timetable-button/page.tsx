import { Wand } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Loader2 } from "lucide-react";

interface AutoTimetableButtonProps {
  plans?: any[];
  termYear?: string;
  yearLevel?: string;
  planType?: string;
  currentAssignments?: {
    [subjectId: number]: { day: number; periods: number[] } | null;
  };
  onScheduleComplete?: (newAssignments: {
    [subjectId: number]: { day: number; periods: number[] };
  }) => void;
}

export default function AutoTimetableButton({
  plans = [],
  termYear = "",
  yearLevel = "",
  planType = "",
  currentAssignments = {},
  onScheduleComplete,
}: AutoTimetableButtonProps) {
  const [isScheduling, setIsScheduling] = useState(false);

  const handleAutoSchedule = async () => {
    if (isScheduling || !plans.length) return;

    setIsScheduling(true);
    try {
      console.log("🚀 เริ่มการจัดตารางอัตโนมัติ");

      const isTerm3 = typeof termYear === "string" && termYear.startsWith("3/");
      const TERM3_SLOTS = 3;

      // นับ record ที่มีอยู่แล้ว (currentAssignments เป็น array สำหรับ Term 3)
      // แปลง currentAssignments เดิม (single entry per id) เป็น multi-entry map
      const multiAssignments: {
        [id: number]: { day: number; periods: number[] }[];
      } = {};
      for (const [idStr, entry] of Object.entries(currentAssignments)) {
        if (!entry) continue;
        const id = Number(idStr);
        if (!multiAssignments[id]) multiAssignments[id] = [];
        if (Array.isArray(entry)) {
          multiAssignments[id].push(...entry);
        } else {
          multiAssignments[id].push(entry);
        }
      }

      const unassignedPlans = plans.filter((plan) =>
        isTerm3
          ? (multiAssignments[plan.id]?.length || 0) < TERM3_SLOTS
          : !multiAssignments[plan.id]?.length,
      );

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

      const activityPeriods = [14, 15, 16, 17];
      const MAX_DAYS = 7;
      const MAX_PERIODS = 25;
      const dayNames = [
        "จันทร์",
        "อังคาร",
        "พุธ",
        "พฤหัสบดี",
        "ศุกร์",
        "เสาร์",
        "อาทิตย์",
      ];

      let successCount = 0;
      let failCount = 0;

      for (const subject of sortedPlans) {
        const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
        const totalPeriods = totalHours * 2;

        if (totalPeriods === 0) {
          console.log(`ข้ามวิชา ${subject.subjectCode} (ไม่มีชั่วโมงเรียน)`);
          continue;
        }

        const slotsNeeded = isTerm3
          ? TERM3_SLOTS - (multiAssignments[subject.id]?.length || 0)
          : 1;
        let slotsPlaced = 0;

        console.log(
          `\nกำลังจัดวิชา ${subject.subjectCode} (${totalPeriods} คาบ, ต้องการ ${slotsNeeded} slot)`,
        );

        for (let day = 0; day < MAX_DAYS && slotsPlaced < slotsNeeded; day++) {
          console.log(`   ลองวัน ${dayNames[day]}`);

          for (
            let startPeriod = 0;
            startPeriod < MAX_PERIODS - totalPeriods + 1 &&
            slotsPlaced < slotsNeeded;
            startPeriod++
          ) {
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

            if (!canScheduleHere) continue;

            // Term 3: ตรวจว่าไม่ทับกับ slot เดิมของตัวเอง
            if (isTerm3) {
              const selfEntries = multiAssignments[subject.id] || [];
              const selfOverlap = selfEntries.some(
                (e) =>
                  e.day === day &&
                  neededPeriods.some((p) => e.periods.includes(p)),
              );
              if (selfOverlap) continue;
            }

            let hasConflict = false;
            let conflictReason = "";

            for (const [existingId, entries] of Object.entries(
              multiAssignments,
            )) {
              if (Number(existingId) === subject.id) continue;
              for (const entry of entries) {
                if (entry.day !== day) continue;
                const overlap = neededPeriods.some((p) =>
                  entry.periods.includes(p),
                );
                if (overlap) {
                  hasConflict = true;
                  conflictReason = `ชนกับวิชา ID ${existingId}`;
                  break;
                }
                const minNew = Math.min(...neededPeriods);
                const maxNew = Math.max(...neededPeriods);
                const minExisting = Math.min(...entry.periods);
                const maxExisting = Math.max(...entry.periods);
                if (
                  (maxNew + 2 >= minExisting && maxNew < minExisting) ||
                  (minNew <= maxExisting + 2 && minNew > maxExisting)
                ) {
                  hasConflict = true;
                  conflictReason = `ต้องเว้นระยะห่าง 2 คาบกับวิชา ID ${existingId}`;
                  break;
                }
              }
              if (hasConflict) break;
            }

            if (hasConflict) {
              console.log(
                `     ข้ามคาบ ${startPeriod}-${startPeriod + totalPeriods - 1}: ${conflictReason}`,
              );
              continue;
            }

            try {
              const startPeriodSave = Math.min(...neededPeriods);
              const endPeriodSave = Math.max(...neededPeriods);

              console.log(
                `     พยายามบันทึก: วัน ${day} คาบ ${startPeriodSave}-${endPeriodSave}`,
              );

              const response = await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planId: subject.id,
                  termYear,
                  yearLevel,
                  planType,
                  day,
                  startPeriod: startPeriodSave,
                  endPeriod: endPeriodSave,
                  roomId: subject.roomId || null,
                  teacherId: subject.teacherId || null,
                  section: subject.section || null,
                }),
              });

              if (response.ok) {
                console.log(
                  `บันทึกสำเร็จ: ${subject.subjectCode} ในวัน${dayNames[day]} คาบ ${neededPeriods.join(",")}`,
                );
                slotsPlaced++;
                if (!multiAssignments[subject.id])
                  multiAssignments[subject.id] = [];
                multiAssignments[subject.id].push({
                  day,
                  periods: neededPeriods,
                });

                // DVE sync (เฉพาะเทอมปกติ — Term 3 API จัดการเอง)
                if (!isTerm3) {
                  const isDVEPlan =
                    planType === "DVE-MSIX" || planType === "DVE-LVC";
                  if (isDVEPlan) {
                    const targetPlanType =
                      planType === "DVE-MSIX" ? "DVE-LVC" : "DVE-MSIX";
                    try {
                      const searchResponse = await fetch(
                        `/api/subject?subjectCode=${encodeURIComponent(subject.subjectCode)}&termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${targetPlanType}`,
                      );
                      if (searchResponse.ok) {
                        const targetSubjects = await searchResponse.json();
                        const matchingSubject = targetSubjects.find(
                          (s: any) => s.subjectCode === subject.subjectCode,
                        );
                        if (matchingSubject) {
                          await fetch("/api/timetable", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              planId: matchingSubject.id,
                              termYear,
                              yearLevel,
                              planType: targetPlanType,
                              day,
                              startPeriod: startPeriodSave,
                              endPeriod: endPeriodSave,
                              roomId: matchingSubject.roomId || null,
                              teacherId: matchingSubject.teacherId || null,
                              section: matchingSubject.section || null,
                            }),
                          });
                        }
                      }
                    } catch (syncError) {
                      console.log(
                        `     เกิดข้อผิดพลาดในการซิ๊งค์: ${syncError}`,
                      );
                    }
                  }
                }
              } else {
                const errorText = await response.text();
                console.log(
                  `     บันทึกไม่สำเร็จ: ${response.status} - ${errorText}`,
                );
                if (response.status === 409 && errorText.includes("Section")) {
                  break;
                }
              }
            } catch (error) {
              console.log(`     เกิดข้อผิดพลาด: ${error}`);
            }
          }
        }

        if (slotsPlaced < slotsNeeded) {
          console.log(
            `   ไม่สามารถจัดวิชา ${subject.subjectCode} ได้ครบ (จัดได้ ${slotsPlaced}/${slotsNeeded})`,
          );
          failCount++;
        } else {
          successCount++;
        }
      }

      console.log(
        `\nสรุปผล: สำเร็จ ${successCount} วิชา, ไม่สำเร็จ ${failCount} วิชา`,
      );

      if (onScheduleComplete) {
        // ส่ง assignments กลับ (flatten เป็น single entry เพื่อ compatibility)
        const result: {
          [subjectId: number]: { day: number; periods: number[] };
        } = {};
        for (const [idStr, entries] of Object.entries(multiAssignments)) {
          if (entries.length > 0) result[Number(idStr)] = entries[0];
        }
        onScheduleComplete(result);
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
