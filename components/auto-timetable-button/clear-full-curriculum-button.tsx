import { Eraser, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import ButtonErrorBoundary from "./button-error-boundary";

interface ClearFullCurriculumButtonProps {
  termYear: string;
  planType?: string;
  onClearComplete?: () => void;
}

async function checkCoTeaching(subjectId: number): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/subject/co-teaching/check?subjectId=${subjectId}`,
    );
    if (response.ok) {
      const data = await response.json();
      return data.planIds && data.planIds.length > 1;
    }
  } catch (error) {
    console.error("Error checking co-teaching:", error);
  }
  return false;
}

function ClearFullCurriculumButtonInternal({
  termYear,
  planType,
  onClearComplete,
}: ClearFullCurriculumButtonProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearFullCurriculum = useCallback(async () => {
    setIsClearing(true);
    try {
      console.log("🗑️ เริ่มการล้างตารางอัตโนมัติทั้งหลักสูตร");
      console.log(`ภาคเรียนที่: ${termYear}`);

      const planTypes = planType
        ? [planType]
        : ["FOUR_YEAR", "TRANSFER", "DVE-LVC"];

      let grandTotalCleared = 0;

      for (const currentPlanType of planTypes) {
        console.log(`\n📋 กำลังล้างหลักสูตร: ${currentPlanType}`);

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

        let totalClearedCount = 0;

        for (const yearLevel of yearLevels) {
          console.log(
            `\n📚 กำลังล้างตาราง ${yearLevel} ภาคเรียนที่ ${termYear}`,
          );

          try {
            // ดึงข้อมูลตารางที่มีอยู่แล้ว
            const timetableResponse = await fetch(
              `/api/timetable?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${currentPlanType}`,
            );

            if (!timetableResponse.ok) {
              console.log(`   ไม่สามารถดึงข้อมูลตารางได้`);
              continue;
            }

            const timetableData = await timetableResponse.json();
            console.log(`   พบตารางทั้งหมด ${timetableData.length} รายการ`);

            if (timetableData.length === 0) {
              console.log(`   ไม่มีตารางที่ต้องล้าง`);
              continue;
            }

            let clearedCount = 0;

            // ลบแต่ละรายการตาราง
            for (const timetable of timetableData) {
              try {
                let subjectId =
                  timetable.subjectId || timetable.planId || timetable.id;

                if (!subjectId && timetable.plan) {
                  subjectId = timetable.plan.id;
                }

                if (!subjectId) {
                  console.error(`     ❌ ไม่พบ subjectId ในข้อมูล`);
                  continue;
                }

                // ตรวจสอบ Co-Teaching
                const isCoTeaching = await checkCoTeaching(subjectId);
                if (isCoTeaching) {
                  console.log(`     📚 วิชา ID ${subjectId} เป็น Co-Teaching`);
                }

                // ลบตาราง
                const response = await fetch(`/api/timetable/${subjectId}`, {
                  method: "DELETE",
                });

                if (response.ok) {
                  console.log(`     ✅ ลบวิชา ID ${subjectId} สำเร็จ`);
                  clearedCount++;
                } else {
                  console.error(`     ❌ ลบวิชา ID ${subjectId} ไม่สำเร็จ`);
                }
              } catch (error) {
                console.error(`     ❌ เกิดข้อผิดพลาดในการลบวิชา:`, error);
              }
            }

            console.log(
              `   สรุป ${yearLevel}: ล้างสำเร็จ ${clearedCount} รายการ`,
            );
            totalClearedCount += clearedCount;
          } catch (error) {
            console.error(
              `   เกิดข้อผิดพลาดในการล้างชั้นปี ${yearLevel}:`,
              error,
            );
          }
        }

        // ซิงค์การล้างสำหรับ DVE
        if (currentPlanType === "DVE-LVC") {
          try {
            console.log(`\n🔄 ซิ๊งค์การล้างไปยัง DVE-MSIX`);

            for (const yearLevel of yearLevels) {
              const syncResponse = await fetch("/api/timetable/clear", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  termYear: termYear,
                  yearLevel: yearLevel,
                  planType: "DVE-MSIX",
                }),
              });

              if (syncResponse.ok) {
                console.log(`   ✅ ซิ๊งค์ ${yearLevel} ไปยัง DVE-MSIX สำเร็จ`);
              } else {
                console.log(
                  `   ⚠️ ซิ๊งค์ ${yearLevel} ไปยัง DVE-MSIX ไม่สำเร็จ`,
                );
              }
            }
          } catch (syncError) {
            console.log(`   ⚠️ เกิดข้อผิดพลาดในการซิ๊งค์การล้าง:`, syncError);
          }
        }

        console.log(
          `\n📊 สรุปหลักสูตร ${currentPlanType}: ล้างสำเร็จ ${totalClearedCount} รายการ`,
        );
        grandTotalCleared += totalClearedCount;
      }

      console.log(
        `\n✅ สรุปผลทั้งหมดทุกหลักสูตร (ภาคเรียนที่ ${termYear}): ล้างสำเร็จ ${grandTotalCleared} รายการ`,
      );

      if (onClearComplete) {
        onClearComplete();
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการล้างตารางทั้งหลักสูตร:", error);
    } finally {
      setIsClearing(false);
    }
  }, [termYear, planType, onClearComplete]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500 hover:border-transparent gap-2"
                disabled={isClearing}
                size="lg"
              >
                {isClearing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Eraser className="h-5 w-5" />
                )}
                {isClearing ? "กำลังล้าง..." : "ล้างทั้งหลักสูตร"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ⚠️ ยืนยันการล้างข้อมูลทั้งหลักสูตร
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong>
                        คุณกำลังจะล้างตารางเรียนทั้งหมดในภาคเรียนนี้:
                      </strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>หลักสูตร 4 ปี (ปี 1-4)</li>
                      <li>หลักสูตรเทียบโอน (ปี 1-3)</li>
                      <li>หลักสูตร ปวส. ทั้ง ปวช. และ ม.6 (ปี 1-2)</li>
                    </ul>
                    <p className="text-red-600 font-semibold mt-4">
                      การดำเนินการนี้ไม่สามารถย้อนกลับได้!
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearFullCurriculum}
                  className="bg-red-500 hover:bg-red-600"
                >
                  ยืนยันล้างทั้งหมด
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TooltipTrigger>
        <TooltipContent>
          <p>ล้างตารางเรียนทุกหลักสูตรพร้อมกัน (รวม Co-Teaching)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ClearFullCurriculumButton(
  props: ClearFullCurriculumButtonProps,
) {
  return (
    <ButtonErrorBoundary>
      <ClearFullCurriculumButtonInternal {...props} />
    </ButtonErrorBoundary>
  );
}
