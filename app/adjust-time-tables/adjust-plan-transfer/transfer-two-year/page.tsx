"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { snapCenterToCursor, restrictToWindowEdges } from "@dnd-kit/modifiers";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { TIMETABLE_CONFIGS } from "@/features/timetable/config";
import { useMultiTimetableData } from "@/features/timetable/hooks/useMultiTimetableData";
import { TimetableHeader } from "@/features/timetable/components/TimetableHeader";
import {
  calculateAssignmentPeriods,
  hasMultiAssignmentOverlap,
} from "@/features/timetable/utils/timetable-calculations";
import { AssignmentEntry } from "@/features/timetable/types";

const CONFIG = TIMETABLE_CONFIGS["transfer-two-year"];

export default function TransferTwoYear() {
  const {
    termYear,
    plans,
    setPlans,
    timetableData,
    tableAssignments,
    setTableAssignments,
    isLoading,
    refreshData,
  } = useMultiTimetableData({
    yearLevel: CONFIG.yearLevel,
    planType: CONFIG.planType,
  });

  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [dragOverCell, setDragOverCell] = useState<{
    day: number;
    period: number;
  } | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [dragFailedSubjectId, setDragFailedSubjectId] = useState<number | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragStart(event: any) {
    document.body.classList.add("dragging-active");

    const { active } = event;
    const isFromTable = active.id.startsWith("table-subject-");
    let subjectId: number;

    if (isFromTable) {
      subjectId = parseInt(active.id.replace("table-subject-", ""));
    } else {
      subjectId = parseInt(active.id.replace("subject-", ""));
    }

    const draggedSubject = plans.find((plan) => plan.id === subjectId);

    if (draggedSubject) {
      if (isFromTable) {
        setActiveSubject({
          ...draggedSubject,
          fromTable: true,
          originalAssignment: tableAssignments[draggedSubject.id],
          originalEntry: active.data.current?.subject?.assignmentData,
        });
      } else {
        setActiveSubject(draggedSubject);
      }
    }
  }

  function handleDragOver(event: any) {
    const { over } = event;

    if (over && over.id.startsWith("cell-")) {
      const [_, day, period] = over.id.split("-").map(Number);
      setDragOverCell((prev) => {
        if (prev && prev.day === day && prev.period === period) return prev;
        return { day, period };
      });
    } else {
      setDragOverCell(null);
    }
  }

  async function handleDragEnd(event: any) {
    document.body.classList.remove("dragging-active");

    const { active, over } = event;
    setDragOverCell(null);

    if (!over) {
      if (activeSubject?.fromTable) {
        const recordId = activeSubject.originalEntry?.recordId;
        handleRemoveAssignment(activeSubject.id, recordId);
      }
      setConflicts([]);
      setActiveSubject(null);
      return;
    }

    let subjectId: number;
    if (active.id.startsWith("table-subject-")) {
      subjectId = parseInt(active.id.replace("table-subject-", ""));
    } else {
      subjectId = parseInt(active.id.replace("subject-", ""));
    }

    if (over.id.startsWith("cell-")) {
      const [_, day, period] = over.id.split("-").map(Number);
      const subject = plans.find((plan) => plan.id === subjectId);

      if (subject) {
        const isCoTeaching = await checkCoTeaching(subjectId);
        const totalHours = (subject.lectureHour || 0) + (subject.labHour || 0);
        const totalPeriods = totalHours * 2;

        const lastPeriod = period + totalPeriods - 1;
        if (lastPeriod >= 25) {
          console.warn("ไม่สามารถวางวิชาได้: เกินขอบตาราง");
          setDragFailedSubjectId(subjectId);
          setConflicts([]);
          setActiveSubject(null);
          return;
        }

        const isWednesday = day === 2;
        const isTerm3 =
          typeof termYear === "string" && termYear.startsWith("3/");
        const activityPeriods = isTerm3 ? [] : [14, 15, 16, 17];
        const wouldOverlapActivity =
          isWednesday &&
          activityPeriods.some((actPeriod) => {
            return (
              period <= actPeriod && period + totalPeriods - 1 >= actPeriod
            );
          });

        if (wouldOverlapActivity) {
          console.warn("ไม่สามารถวางวิชาได้: ทับช่วงกิจกรรม");
          setDragFailedSubjectId(subjectId);
          setConflicts([]);
          setActiveSubject(null);
          return;
        }

        const periods = calculateAssignmentPeriods(
          day,
          period,
          totalPeriods,
          isTerm3,
        );

        if (!isCoTeaching) {
          const overlapResult = hasMultiAssignmentOverlap(
            tableAssignments,
            subjectId,
            day,
            periods,
          );

          if (overlapResult.hasOverlap) {
            console.warn("ไม่สามารถวางวิชาได้: ทับคาบวิชาอื่น");
            setDragFailedSubjectId(subjectId);
            setConflicts([]);
            setActiveSubject(null);
            return;
          }
        }

        if (isTerm3) {
          const selfEntries = tableAssignments[subjectId];
          if (Array.isArray(selfEntries)) {
            const selfOverlap = selfEntries.some(
              (e) =>
                e.day === day && periods.some((p: number) => e.periods.includes(p)),
            );
            if (selfOverlap) {
              setDragFailedSubjectId(subjectId);
              setConflicts([]);
              setActiveSubject(null);
              return;
            }
          }
        }

        const newAssignmentEntry: AssignmentEntry = { day, periods };
        setTableAssignments((prev) => {
          if (isTerm3) {
            const existing = prev[subjectId] || [];
            return { ...prev, [subjectId]: [...existing, newAssignmentEntry] };
          }
          return { ...prev, [subjectId]: [newAssignmentEntry] };
        });

        try {
          const startPeriod = Math.min(...periods);
          const endPeriod = Math.max(...periods);

          const response = await fetch("/api/timetable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              planId: subjectId,
              termYear: termYear || "1",
              yearLevel: CONFIG.yearLevel,
              planType: CONFIG.planType,
              day,
              startPeriod,
              endPeriod,
              roomId: subject.roomId || null,
              teacherId: subject.teacherId || null,
              section: subject.section || null,
            }),
          });

          const data = await response.json();

          if (response.status === 409 && data.conflicts) {
            console.log("พบการชนกัน - กำลังคืนสถานะ");
            setTableAssignments((prev) => {
              const newState = { ...prev };
              if (
                activeSubject?.fromTable &&
                activeSubject.originalAssignment
              ) {
                newState[subjectId] = activeSubject.originalAssignment;
              } else {
                delete newState[subjectId];
              }
              return newState;
            });

            setConflicts(data.conflicts);
            setDragFailedSubjectId(subjectId);
          } else if (!response.ok) {
            console.error("เกิดข้อผิดพลาดในการบันทึก");
            setTableAssignments((prev) => {
              const newState = { ...prev };
              if (
                activeSubject?.fromTable &&
                activeSubject.originalAssignment
              ) {
                newState[subjectId] = activeSubject.originalAssignment;
              } else {
                delete newState[subjectId];
              }
              return newState;
            });

            setDragFailedSubjectId(subjectId);
            setConflicts([]);
            throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกตาราง");
          } else {
            console.log("บันทึกตารางเรียนสำเร็จ", data);
            setConflicts([]);
            setDragFailedSubjectId(null);

            if (data.id) {
              setTableAssignments((prev) => {
                const existing = (prev[subjectId] || []) as AssignmentEntry[];
                const updated = existing.map((e) =>
                  e.day === day &&
                  JSON.stringify(e.periods) === JSON.stringify(periods)
                    ? { ...e, id: data.id }
                    : e,
                );
                return { ...prev, [subjectId]: updated };
              });
            }

            // Term 3: ถ้าลากจากตาราง ให้ลบ record เก่าออก
            if (
              isTerm3 &&
              activeSubject?.fromTable &&
              activeSubject.originalEntry?.recordId
            ) {
              await fetch(
                `/api/timetable/record/${activeSubject.originalEntry.recordId}`,
                { method: "DELETE" },
              );
            }

            await refreshData();
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการบันทึกตารางเรียน:", error);
          setTableAssignments((prev) => {
            const newState = { ...prev };
            if (activeSubject?.fromTable && activeSubject.originalAssignment) {
              newState[subjectId] = activeSubject.originalAssignment;
            } else {
              delete newState[subjectId];
            }
            return newState;
          });

          setDragFailedSubjectId(subjectId);
          setConflicts([]);
        }
      }
    } else {
      setConflicts([]);
    }

    setActiveSubject(null);
  }

  async function handleRemoveAssignment(subjectId: number, recordId?: number) {
    try {
      const isCoTeaching = await checkCoTeaching(subjectId);
      const url = recordId
        ? `/api/timetable/record/${recordId}`
        : `/api/timetable/${subjectId}`;
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("ลบตารางเรียนสำเร็จ:", data);

        if (recordId) {
          setTableAssignments((prev) => {
            const existing = (prev[subjectId] || []) as AssignmentEntry[];
            const updated = existing.filter((e) => e.id !== recordId);
            const newState = { ...prev };
            if (updated.length === 0) {
              delete newState[subjectId];
            } else {
              newState[subjectId] = updated;
            }
            return newState;
          });
        } else if (isCoTeaching && data.deletedPlans) {
          setTableAssignments((prev) => {
            const newState = { ...prev };
            data.deletedPlans.forEach((planId: number) => {
              delete newState[planId];
            });
            return newState;
          });
        } else {
          setTableAssignments((prev) => {
            const newState = { ...prev };
            delete newState[subjectId];
            return newState;
          });
        }

        await refreshData();
      } else {
        console.error("เกิดข้อผิดพลาดในการลบตารางเรียน");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบตารางเรียน:", error);
    }
  }

  async function handleSplitSubject(subjectId: number, splitData: any) {
    try {
      const response = await fetch("/api/subject/split", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          splitData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to split subject");
      }

      const { updatedSubject, newSubject } = await response.json();

      setPlans((prevPlans) => {
        const updatedPlans = prevPlans.map((plan) =>
          plan.id === subjectId ? updatedSubject : plan,
        );
        return [...updatedPlans, newSubject];
      });

      setTableAssignments((prev) => {
        const newAssignments = { ...prev };
        delete newAssignments[subjectId];
        return newAssignments;
      });
    } catch (error) {
      console.error("Error splitting subject:", error);
    }
  }

  async function handleMergeSubject(subjectId: number) {
    try {
      const response = await fetch("/api/subject/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subjectId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to merge subject");
      }

      const { mergedSubject, deletedParts } = await response.json();

      setPlans((prevPlans) => {
        let updatedPlans = prevPlans.filter(
          (plan) => !deletedParts.includes(plan.id),
        );

        updatedPlans = updatedPlans.map((plan) => {
          if (plan.id === mergedSubject.id) {
            return mergedSubject;
          }
          return plan;
        });

        return updatedPlans;
      });

      setTableAssignments((prev) => {
        const newAssignments = { ...prev };
        deletedParts.forEach((partId: number) => {
          delete newAssignments[partId];
        });
        delete newAssignments[mergedSubject.id];
        return newAssignments;
      });
    } catch (error: any) {
      console.error("Error merging subject:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  const isTerm3Current =
    typeof termYear === "string" && termYear.startsWith("3/");
  const assignedSubjectsCount = isTerm3Current
    ? Object.values(tableAssignments).filter(
        (a) => Array.isArray(a) && a.length >= 3,
      ).length
    : Object.values(tableAssignments).filter(
        (a) => a !== null && (!Array.isArray(a) || a.length > 0),
      ).length;

  const getPreviewPeriods = () => {
    if (!activeSubject || !dragOverCell) return null;

    const { day, period } = dragOverCell;
    const totalHours =
      (activeSubject.lectureHour || 0) + (activeSubject.labHour || 0);
    const totalPeriods = totalHours * 2;

    const lastPeriod = period + totalPeriods - 1;
    if (lastPeriod >= 25) {
      return { day, periods: [], isValid: false, message: "เกินขอบตาราง" };
    }

    const isTerm3Preview =
      typeof termYear === "string" && termYear.startsWith("3/");
    const hasMidweekActivity =
      !isTerm3Preview &&
      day === 2 &&
      ((period <= 14 && lastPeriod >= 14) ||
        (period >= 14 && period <= 17) ||
        (lastPeriod >= 14 && lastPeriod <= 17));

    if (hasMidweekActivity) {
      return { day, periods: [], isValid: false, message: "ทับช่วงกิจกรรม" };
    }

    const periods = calculateAssignmentPeriods(
      day,
      period,
      totalPeriods,
      isTerm3Preview,
    );

    let hasOverlap = false;
    let overlapSubject = null;

    Object.entries(tableAssignments).forEach(
      ([existingSubjectId, assignment]) => {
        if (parseInt(existingSubjectId) === activeSubject.id) return;
        if (!assignment) return;

        const entries = Array.isArray(assignment) ? assignment : [assignment];
        entries.forEach((entry) => {
          if (entry && entry.day === day) {
            const overlap = periods.some((p: number) => entry.periods.includes(p));
            if (overlap) {
              hasOverlap = true;
              const overlappingSubject = plans.find(
                (plan) => plan.id === parseInt(existingSubjectId),
              );
              if (overlappingSubject) {
                overlapSubject = overlappingSubject.subjectCode;
              }
            }
          }
        });
      },
    );

    if (hasOverlap) {
      return {
        day,
        periods: [],
        isValid: false,
        message: overlapSubject
          ? `ทับวิชา ${overlapSubject}`
          : "ทับคาบวิชาอื่น",
      };
    }

    return { day, periods, isValid: true, message: "" };
  };

  const previewInfo = getPreviewPeriods();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[snapCenterToCursor, restrictToWindowEdges]}
    >
      <div className="mx-auto px-4">
        <div className="bg-card text-card-foreground rounded-xl border my-5 py-6 shadow-sm mx-auto max-w-7xl">
          <TimetableHeader
            title={CONFIG.title}
            termYear={termYear}
            timetableData={timetableData}
            onRefresh={refreshData}
          />
          <div className="bg-card text-card-foreground px-8">
            <TimeTableCustom
              assignments={tableAssignments}
              plans={plans}
              onRemoveAssignment={handleRemoveAssignment}
              onRemoveRecord={(recordId) => {
                const subjectId = Object.entries(tableAssignments).find(
                  ([, val]) =>
                    Array.isArray(val) && val.some((e) => e.id === recordId),
                )?.[0];
                if (subjectId)
                  handleRemoveAssignment(parseInt(subjectId), recordId);
              }}
              activeSubject={activeSubject}
              dragOverCell={dragOverCell}
              termYear={termYear || ""}
            />
          </div>
          <PlansStatusCustom
            termYear={termYear || ""}
            yearLevel={CONFIG.yearLevel}
            planType={CONFIG.planType}
            plans={plans}
            assignments={tableAssignments}
            assignedCount={assignedSubjectsCount}
            onRemoveAssignment={handleRemoveAssignment}
            onSplitSubject={handleSplitSubject}
            onMergeSubject={handleMergeSubject}
            conflicts={conflicts}
            onSubjectUpdate={refreshData}
            dragFailedSubjectId={dragFailedSubjectId}
            onDragFailedReset={() => setDragFailedSubjectId(null)}
          />
        </div>
      </div>

      <DragOverlay>
        {activeSubject ? (
          <TooltipProvider>
            <Tooltip open={false}>
              <TooltipTrigger asChild>
                <div
                  className={`rounded border shadow-sm flex flex-col items-center justify-center p-2 text-xs ${
                    previewInfo && !previewInfo.isValid
                      ? "border-red-400 dark:border-red-600 bg-red-100/80 dark:bg-red-800/80"
                      : "border-green-400 dark:border-green-600 bg-green-100/80 dark:bg-green-800/80"
                  }`}
                  style={{
                    width: "160px",
                    minWidth: "120px",
                    height: "70px",
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium text-green-950 dark:text-green-50 mb-1">
                      {activeSubject.subjectCode}

                      {activeSubject.section && (
                        <span className="ml-1 text-[8px] bg-blue-200 dark:bg-blue-700 px-1 rounded">
                          {activeSubject.section}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] truncate max-w-[110px] text-green-900 dark:text-green-100">
                      {activeSubject.subjectName}
                    </div>

                    {(activeSubject.room?.roomCode ||
                      activeSubject.teacher?.tName) && (
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
                        {(activeSubject.lectureHour || 0) +
                          (activeSubject.labHour || 0)}{" "}
                        ชม.
                      </span>
                      <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded">
                        {((activeSubject.lectureHour || 0) +
                          (activeSubject.labHour || 0)) *
                          2}{" "}
                        คาบ
                      </span>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
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
