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

      // กำหนดหลักสูตรที่ต้องจัด
      // ถ้าระบุ planType มาจะจัดเฉพาะหลักสูตรนั้น
      // ถ้าไม่ระบุจะจัดทุกหลักสูตร (DVE-MSIX จะถูก sync จาก DVE-LVC อัตโนมัติ)
      const planTypes = planType
        ? [planType]
        : ["FOUR_YEAR", "TRANSFER", "DVE-LVC"];

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

      let grandTotalSuccess = 0;
      let grandTotalFail = 0;

      // วนลูปแต่ละหลักสูตร
      for (const currentPlanType of planTypes) {
        console.log(`\n📋 กำลังจัดหลักสูตร: ${currentPlanType}`);

        // กำหนดชั้นปีตามประเภทหลักสูตร
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

        // วนลูปจัดตารางแต่ละชั้นปีในภาคเรียนปัจจุบัน
        for (const yearLevel of yearLevels) {
          console.log(
            `\n📚 กำลังจัดตาราง ${yearLevel} ภาคเรียนที่ ${termYear}`,
          );

          try {
            // ดึงข้อมูลวิชาทั้งหมดของชั้นปีนี้
            const subjectResponse = await fetch(
              `/api/subject?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${currentPlanType}`,
            );

            if (!subjectResponse.ok) {
              console.log(`   ไม่สามารถดึงข้อมูลวิชาได้`);
              continue;
            }

            const plans = await subjectResponse.json();
            console.log(`   พบวิชาทั้งหมด ${plans.length} วิชา`);

            // ดึงข้อมูลตารางที่มีอยู่แล้ว
            const timetableResponse = await fetch(
              `/api/timetable?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${currentPlanType}`,
            );

            let existingTimetables: any[] = [];
            if (timetableResponse.ok) {
              existingTimetables = await timetableResponse.json();
            }

            const assignedPlanIds = new Set(
              existingTimetables.map((t) => t.planId),
            );
            const unassignedPlans = plans.filter(
              (plan: any) => !assignedPlanIds.has(plan.id),
            );

            if (unassignedPlans.length === 0) {
              console.log(`   ไม่มีวิชาที่ต้องจัดตาราง`);
              continue;
            }

            console.log(`   จำนวนวิชาที่ต้องจัด: ${unassignedPlans.length}`);

            // เรียงลำดับวิชาตามจำนวนชั่วโมงเรียน (มากไปน้อย)
            const sortedPlans = [...unassignedPlans].sort((a, b) => {
              const totalHoursA = (a.lectureHour || 0) + (a.labHour || 0);
              const totalHoursB = (b.lectureHour || 0) + (b.labHour || 0);
              return totalHoursB - totalHoursA;
            });

            // สร้าง map ของตารางที่มีอยู่แล้ว
            const currentAssignments: {
              [planId: number]: { day: number; periods: number[] };
            } = {};
            for (const tt of existingTimetables) {
              if (!currentAssignments[tt.planId]) {
                const periods: number[] = [];
                for (let p = tt.startPeriod; p <= tt.endPeriod; p++) {
                  periods.push(p);
                }
                currentAssignments[tt.planId] = {
                  day: tt.day,
                  periods: periods,
                };
              }
            }

            let successCount = 0;
            let failCount = 0;

            // จัดตารางแต่ละวิชา
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

              console.log(
                `     กำลังจัดวิชา ${subject.subjectCode} (${totalPeriods} คาบ)`,
              );

              let scheduled = false;

              // ลองจัดตารางในแต่ละวัน
              for (let day = 0; day < MAX_DAYS && !scheduled; day++) {
                // ลองแต่ละช่วงเวลา
                for (
                  let startPeriod = 0;
                  startPeriod < MAX_PERIODS - totalPeriods + 1 && !scheduled;
                  startPeriod++
                ) {
                  const isWednesday = day === 2;

                  // สร้างรายการคาบที่ต้องการ
                  const neededPeriods: number[] = [];
                  let canScheduleHere = true;

                  for (let i = 0; i < totalPeriods; i++) {
                    const currentPeriod = startPeriod + i;

                    // ตรวจสอบว่าไม่ชนกับคาบกิจกรรมในวันพุธ
                    if (
                      isWednesday &&
                      activityPeriods.includes(currentPeriod)
                    ) {
                      canScheduleHere = false;
                      break;
                    }

                    neededPeriods.push(currentPeriod);
                  }

                  if (!canScheduleHere) {
                    continue;
                  }

                  // ตรวจสอบความขัดแย้ง
                  let hasConflict = false;

                  for (const [existingId, assignment] of Object.entries(
                    currentAssignments,
                  )) {
                    if (
                      assignment &&
                      assignment.day === day &&
                      Number(existingId) !== subject.id
                    ) {
                      // ตรวจสอบการทับซ้อน
                      const overlap = neededPeriods.some((p) =>
                        assignment.periods.includes(p),
                      );
                      if (overlap) {
                        hasConflict = true;
                        break;
                      }

                      // ตรวจสอบระยะห่าง 2 คาบ
                      const minNew = Math.min(...neededPeriods);
                      const maxNew = Math.max(...neededPeriods);
                      const minExisting = Math.min(...assignment.periods);
                      const maxExisting = Math.max(...assignment.periods);

                      if (maxNew + 2 >= minExisting && maxNew < minExisting) {
                        hasConflict = true;
                        break;
                      }

                      if (minNew <= maxExisting + 2 && minNew > maxExisting) {
                        hasConflict = true;
                        break;
                      }
                    }
                  }

                  if (!hasConflict) {
                    // บันทึกตาราง
                    try {
                      const startPeriodSave = Math.min(...neededPeriods);
                      const endPeriodSave = Math.max(...neededPeriods);

                      const response = await fetch("/api/timetable", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
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
                        scheduled = true;
                        successCount++;

                        // เพิ่มเข้า currentAssignments
                        currentAssignments[subject.id] = {
                          day,
                          periods: neededPeriods,
                        };

                        // ซิงค์สำหรับ DVE
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
                      } else {
                        const errorText = await response.text();
                        console.log(
                          `     บันทึกไม่สำเร็จ: ${response.status} - ${errorText}`,
                        );
                        continue;
                      }
                    } catch (error) {
                      console.log(`     เกิดข้อผิดพลาด: ${error}`);
                      continue;
                    }
                  }
                }
              }

              if (!scheduled) {
                console.log(`     ไม่สามารถจัดวิชา ${subject.subjectCode} ได้`);
                failCount++;
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
