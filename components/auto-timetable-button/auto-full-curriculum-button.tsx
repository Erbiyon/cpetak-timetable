import { Wand } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Loader2 } from "lucide-react";
import ButtonErrorBoundary from "./button-error-boundary";

interface AutoFullCurriculumButtonProps {
  termYear: string;
  planType?: string;
  onScheduleComplete?: () => void;
}

function AutoFullCurriculumButtonInternal({
  termYear,
  planType,
  onScheduleComplete,
}: AutoFullCurriculumButtonProps) {
  const [isScheduling, setIsScheduling] = useState(false);

  const handleAutoSchedule = useCallback(async () => {
    if (isScheduling) return;

    setIsScheduling(true);
    try {
      console.log("🚀 เริ่มการจัดตารางอัตโนมัติทั้งหลักสูตร");
      console.log(`ภาคเรียนที่: ${termYear}`);

      const planTypes = planType
        ? [planType]
        : ["FOUR_YEAR", "TRANSFER", "DVE-LVC"];

      const isTerm3 = typeof termYear === "string" && termYear.startsWith("3/");
      const activityPeriods = isTerm3 ? [] : [14, 15, 16, 17];
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

      let grandTotalSuccess = 0;
      let grandTotalFail = 0;

      for (const currentPlanType of planTypes) {
        console.log(`\n📋 กำลังจัดหลักสูตร: ${currentPlanType}`);

        let yearLevels: string[] = [];
        if (currentPlanType === "FOUR_YEAR") {
          yearLevels = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
        } else if (
          currentPlanType === "DVE-LVC" ||
          currentPlanType === "DVE-MSIX"
        ) {
          yearLevels = ["ปี 1", "ปี 2"];
        } else if (currentPlanType === "TRANSFER") {
          yearLevels = ["ปี 1", "ปี 2", "ปี 3"];
        }

        let totalSuccessCount = 0;
        let totalFailCount = 0;

        for (const yearLevel of yearLevels) {
          console.log(
            `\n📚 กำลังจัดตาราง ${yearLevel} ภาคเรียนที่ ${termYear}`,
          );

          try {
            const subjectResponse = await fetch(
              `/api/subject?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${currentPlanType}`,
            );

            if (!subjectResponse.ok) {
              console.log(`   ไม่สามารถดึงข้อมูลวิชาได้`);
              continue;
            }

            const plans = await subjectResponse.json();
            console.log(`   พบวิชาทั้งหมด ${plans.length} วิชา`);

            const timetableResponse = await fetch(
              `/api/timetable?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${currentPlanType}`,
            );

            let existingTimetables: any[] = [];
            if (timetableResponse.ok) {
              existingTimetables = await timetableResponse.json();
            }

            const isTerm3 =
              typeof termYear === "string" && termYear.startsWith("3/");
            const TERM3_SLOTS = 3;

            const existingRecordCount: { [planId: number]: number } = {};
            for (const tt of existingTimetables) {
              existingRecordCount[tt.planId] =
                (existingRecordCount[tt.planId] || 0) + 1;
            }

            const unassignedPlans = plans.filter((plan: any) =>
              isTerm3
                ? (existingRecordCount[plan.id] || 0) < TERM3_SLOTS
                : !existingRecordCount[plan.id],
            );

            if (unassignedPlans.length === 0) {
              console.log(`   ไม่มีวิชาที่ต้องจัดตาราง`);
              continue;
            }

            console.log(`   จำนวนวิชาที่ต้องจัด: ${unassignedPlans.length}`);

            const sortedPlans = [...unassignedPlans].sort((a, b) => {
              const totalHoursA = (a.lectureHour || 0) + (a.labHour || 0);
              const totalHoursB = (b.lectureHour || 0) + (b.labHour || 0);
              return totalHoursB - totalHoursA;
            });

            const currentAssignments: {
              [planId: number]: { day: number; periods: number[] }[];
            } = {};
            for (const tt of existingTimetables) {
              if (!currentAssignments[tt.planId])
                currentAssignments[tt.planId] = [];
              const periods: number[] = [];
              for (let p = tt.startPeriod; p <= tt.endPeriod; p++) {
                if (!isTerm3 && tt.day === 2 && p >= 14 && p <= 17) continue;
                periods.push(p);
              }
              currentAssignments[tt.planId].push({ day: tt.day, periods });
            }

            let successCount = 0;
            let failCount = 0;

            for (const subject of sortedPlans) {
              const totalHours =
                (subject.lectureHour || 0) + (subject.labHour || 0);
              const totalPeriods = totalHours * 2;

              if (totalPeriods === 0) {
                console.log(
                  `     ข้ามวิชา ${subject.subjectCode} (ไม่มีชั่วโมงเรียน)`,
                );
                continue;
              }

              const slotsNeeded = isTerm3
                ? TERM3_SLOTS - (existingRecordCount[subject.id] || 0)
                : 1;
              let slotsPlaced = 0;

              console.log(
                `     กำลังจัดวิชา ${subject.subjectCode} (${totalPeriods} คาบ, ต้องการ ${slotsNeeded} slot)`,
              );

              for (
                let day = 0;
                day < MAX_DAYS && slotsPlaced < slotsNeeded;
                day++
              ) {
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
                    if (
                      isWednesday &&
                      activityPeriods.includes(currentPeriod)
                    ) {
                      canScheduleHere = false;
                      break;
                    }
                    neededPeriods.push(currentPeriod);
                  }

                  if (!canScheduleHere) continue;

                  if (isTerm3) {
                    const selfEntries = currentAssignments[subject.id] || [];
                    const selfConflict = selfEntries.some((e) => {
                      if (e.day !== day) return false;
                      if (neededPeriods.some((p) => e.periods.includes(p)))
                        return true;
                      const minNew = Math.min(...neededPeriods);
                      const maxNew = Math.max(...neededPeriods);
                      const minExisting = Math.min(...e.periods);
                      const maxExisting = Math.max(...e.periods);
                      return (
                        (maxNew + 2 >= minExisting && maxNew < minExisting) ||
                        (minNew <= maxExisting + 2 && minNew > maxExisting)
                      );
                    });
                    if (selfConflict) continue;
                  }

                  let hasConflict = false;
                  for (const [existingId, entries] of Object.entries(
                    currentAssignments,
                  )) {
                    if (Number(existingId) === subject.id) continue;
                    for (const entry of entries) {
                      if (entry.day !== day) continue;
                      const overlap = neededPeriods.some((p) =>
                        entry.periods.includes(p),
                      );
                      if (overlap) {
                        hasConflict = true;
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
                        break;
                      }
                    }
                    if (hasConflict) break;
                  }

                  if (hasConflict) continue;

                  try {
                    const startPeriodSave = Math.min(...neededPeriods);
                    const endPeriodSave = Math.max(...neededPeriods);

                    const response = await fetch("/api/timetable", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        planId: subject.id,
                        termYear: termYear,
                        yearLevel: yearLevel,
                        planType: currentPlanType,
                        day: day,
                        startPeriod: startPeriodSave,
                        endPeriod: endPeriodSave,
                        roomId: subject.roomId || null,
                        teacherId: subject.teacherId || null,
                        section: subject.section || null,
                      }),
                    });

                    if (response.ok) {
                      console.log(
                        `     บันทึกสำเร็จ: ${subject.subjectCode} ในวัน${dayNames[day]} คาบ ${neededPeriods.join(",")}`,
                      );
                      slotsPlaced++;

                      if (!currentAssignments[subject.id])
                        currentAssignments[subject.id] = [];
                      currentAssignments[subject.id].push({
                        day,
                        periods: neededPeriods,
                      });

                      if (!isTerm3) {
                        const isDVEPlan =
                          currentPlanType === "DVE-MSIX" ||
                          currentPlanType === "DVE-LVC";
                        if (isDVEPlan) {
                          const targetPlanType =
                            currentPlanType === "DVE-MSIX"
                              ? "DVE-LVC"
                              : "DVE-MSIX";
                          try {
                            const searchResponse = await fetch(
                              `/api/subject?subjectCode=${encodeURIComponent(subject.subjectCode)}&termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${targetPlanType}`,
                            );
                            if (searchResponse.ok) {
                              const targetSubjects =
                                await searchResponse.json();
                              const matchingSubject = targetSubjects.find(
                                (s: any) =>
                                  s.subjectCode === subject.subjectCode,
                              );
                              if (matchingSubject) {
                                await fetch("/api/timetable", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
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
                                    teacherId:
                                      matchingSubject.teacherId || null,
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
                    }
                  } catch (error) {
                    console.log(`     เกิดข้อผิดพลาด: ${error}`);
                  }
                }
              }

              if (slotsPlaced < slotsNeeded) {
                console.log(
                  `     ไม่สามารถจัดวิชา ${subject.subjectCode} ได้ครบ (จัดได้ ${slotsPlaced}/${slotsNeeded})`,
                );
                failCount++;
              } else {
                successCount++;
              }
            }

            console.log(
              `   สรุป ${yearLevel} ภาคเรียนที่ ${termYear}: สำเร็จ ${successCount} วิชา, ไม่สำเร็จ ${failCount} วิชา`,
            );
            totalSuccessCount += successCount;
            totalFailCount += failCount;
          } catch (error) {
            console.error(
              `   เกิดข้อผิดพลาดในการจัดชั้นปี ${yearLevel}:`,
              error,
            );
          }
        }

        console.log(
          `\n📊 สรุปหลักสูตร ${currentPlanType}: สำเร็จ ${totalSuccessCount} วิชา, ไม่สำเร็จ ${totalFailCount} วิชา`,
        );
        grandTotalSuccess += totalSuccessCount;
        grandTotalFail += totalFailCount;
      }

      console.log(
        `\n✅ สรุปผลทั้งหมดทุกหลักสูตร (ภาคเรียนที่ ${termYear}): สำเร็จ ${grandTotalSuccess} วิชา, ไม่สำเร็จ ${grandTotalFail} วิชา`,
      );

      if (onScheduleComplete) {
        onScheduleComplete();
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการจัดตารางทั้งหลักสูตร:", error);
    } finally {
      setIsScheduling(false);
    }
  }, [termYear, planType, onScheduleComplete, isScheduling]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="gap-2"
            size="lg"
          >
            {isScheduling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand className="h-5 w-5" />
            )}
            {isScheduling ? "กำลังจัดตาราง..." : "จัดตารางทั้งหลักสูตร"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>จัดตารางอัตโนมัติให้กับทุกชั้นปีในหลักสูตรพร้อมกัน</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AutoFullCurriculumButton(
  props: AutoFullCurriculumButtonProps,
) {
  return (
    <ButtonErrorBoundary>
      <AutoFullCurriculumButtonInternal {...props} />
    </ButtonErrorBoundary>
  );
}
