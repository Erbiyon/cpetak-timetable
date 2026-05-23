"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import DownloadButtonTimetable from "@/components/download-button/download-button-timetable";
import AutoFullCurriculumButton from "@/components/auto-timetable-button/auto-full-curriculum-button";
import ClearFullCurriculumButton from "@/components/auto-timetable-button/clear-full-curriculum-button";

export default function DveMsixTwoYear() {
  const [termYear, setTermYear] = useState<string | undefined>(undefined);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dragOverCell, setDragOverCell] = useState<{
    day: number;
    period: number;
  } | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [dragFailedSubjectId, setDragFailedSubjectId] = useState<number | null>(
    null,
  );
  const [timetableData, setTimetableData] = useState<any[]>([]);

  type AssignmentEntry = { id?: number; day: number; periods: number[] };
  const [tableAssignments, setTableAssignments] = useState<{
    [subjectId: number]: AssignmentEntry[] | null;
  }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleSubjectUpdate = useCallback(async () => {
    console.log("Refreshing subjects and timetable data...");

    try {
      setIsLoading(true);

      const timetableRes = await fetch(
        `/api/timetable?termYear=${encodeURIComponent(termYear || "")}&yearLevel=${encodeURIComponent("ปี 2")}&planType=DVE-MSIX`,
      );
      if (timetableRes.ok) {
        const timetableData = await timetableRes.json();

        const assignments: {
          [subjectId: number]: AssignmentEntry[];
        } = {};
        setTimetableData(timetableData);

        timetableData.forEach((item: any) => {
          const periods: number[] = [];
          for (let p = item.startPeriod; p <= item.endPeriod; p++) {
            if (
              !termYear?.startsWith("3/") &&
              item.day === 2 &&
              p >= 14 &&
              p <= 17
            )
              continue;
            periods.push(p);
          }

          if (!assignments[item.planId]) assignments[item.planId] = [];
          (assignments[item.planId] as AssignmentEntry[]).push({
            id: item.id,
            day: item.day,
            periods: periods,
          });
        });

        setTableAssignments(assignments);
        console.log("Updated tableAssignments after refresh:", assignments);
      }

      const planRes = await fetch(
        `/api/subject?termYear=${encodeURIComponent(termYear || "")}&yearLevel=${encodeURIComponent("ปี 2")}`,
      );
      if (planRes.ok) {
        const allPlanData = await planRes.json();
        const dvePlanData = allPlanData.filter(
          (plan: any) => plan.planType === "DVE-MSIX",
        );

        if (Array.isArray(dvePlanData) && dvePlanData.length > 0) {
          setPlans(dvePlanData);
          console.log(
            "Updated plans after refresh:",
            dvePlanData.length,
            "records (DVE-MSIX only)",
          );
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [termYear]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const termRes = await fetch("/api/term-year");
        if (termRes.ok) {
          const termData = await termRes.json();
          console.log("Term data received:", termData);
          setTermYear(termData.termYear);

          console.log("=== Testing API without filters ===");
          const testRes = await fetch("/api/subject");
          if (testRes.ok) {
            const allData = await testRes.json();
            console.log(`Total records in database: ${allData.length}`);

            if (allData.length > 0) {
              console.log("Sample record:", allData[0]);

              const matchingRecords = allData.filter(
                (record: any) =>
                  record.termYear === termData.termYear &&
                  record.yearLevel === "ปี 2" &&
                  record.planType === "DVE-MSIX",
              );

              console.log(`Matching records found: ${matchingRecords.length}`);
              if (matchingRecords.length > 0) {
                console.log("Sample matching record:", matchingRecords[0]);
              }
            }
          }

          const timetableRes = await fetch(
            `/api/timetable?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent("ปี 2")}&planType=DVE-MSIX`,
          );
          if (timetableRes.ok) {
            const timetableData = await timetableRes.json();
            console.log("Loaded timetable data:", timetableData);

            setTimetableData(timetableData);

            const assignments: {
              [subjectId: number]: AssignmentEntry[];
            } = {};

            timetableData.forEach((item: any) => {
              const periods: number[] = [];
              for (let p = item.startPeriod; p <= item.endPeriod; p++) {
                if (
                  !termData.termYear?.startsWith("3/") &&
                  item.day === 2 &&
                  p >= 14 &&
                  p <= 17
                )
                  continue;
                periods.push(p);
              }

              if (!assignments[item.planId]) assignments[item.planId] = [];
              (assignments[item.planId] as AssignmentEntry[]).push({
                id: item.id,
                day: item.day,
                periods: periods,
              });
            });

            setTableAssignments(assignments);
          }

          console.log("=== Testing different query combinations ===");

          const query1 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent("ปี 2")}`;
          console.log("Query 1 (DVE both):", query1);

          const query2 = `/api/subject?termYear=${encodeURIComponent(termData.termYear)}`;
          console.log("Query 2:", query2);

          let finalData = [];

          for (const [index, query] of [query1, query2].entries()) {
            console.log(`Testing query ${index + 1}:`, query);
            const planRes = await fetch(query);
            if (planRes.ok) {
              const data = await planRes.json();
              console.log(
                `Query ${index + 1} results:`,
                data.length,
                "records",
              );
              if (data.length > 0 && finalData.length === 0) {
                finalData = data;
                console.log(`Using results from query ${index + 1}`);
                break;
              }
            } else {
              console.log(
                `Query ${index + 1} failed:`,
                planRes.status,
                planRes.statusText,
              );
            }
          }

          if (finalData.length === 0) {
            console.log(
              "No data found with filters, trying without filters...",
            );
            const planRes = await fetch("/api/subject");
            if (planRes.ok) {
              const allData = await planRes.json();
              console.log("Total data without filters:", allData.length);

              finalData = allData.filter((record: any) => {
                const matchTermYear =
                  !termData.termYear || record.termYear === termData.termYear;
                const matchYearLevel = record.yearLevel === "ปี 2";
                const matchPlanType = record.planType === "DVE-MSIX";

                console.log("Filtering record:", {
                  id: record.id,
                  termYear: record.termYear,
                  yearLevel: record.yearLevel,
                  planType: record.planType,
                  matchTermYear,
                  matchYearLevel,
                  matchPlanType,
                  match: matchTermYear && matchYearLevel && matchPlanType,
                });

                return matchTermYear && matchYearLevel && matchPlanType;
              });

              console.log("Filtered DVE data:", finalData.length, "records");
            }
          }

          if (Array.isArray(finalData)) {
            setPlans(finalData);
            console.log(
              "Set plans with",
              finalData.length,
              "records (DVE-MSIX only)",
            );
          } else if (
            finalData &&
            finalData.plans &&
            Array.isArray(finalData.plans)
          ) {
            setPlans(finalData.plans);
            console.log(
              "Set plans with",
              finalData.plans.length,
              "records (DVE-MSIX only)",
            );
          } else {
            console.warn("API ส่งข้อมูลในรูปแบบที่ไม่ถูกต้อง");
            setPlans([]);
          }
        } else {
          console.error(
            "Failed to fetch term year:",
            termRes.status,
            termRes.statusText,
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      console.log("ข้อมูลทั้งหมด:", plans.length);
      const year1Plans = plans.filter(
        (plan) => plan.yearLevel && plan.yearLevel.includes("ปี 2"),
      );
      const dveMsixPlans = year1Plans.filter(
        (plan) => plan.planType === "DVE-MSIX",
      );
      const dveLvcPlans = year1Plans.filter(
        (plan) => plan.planType === "DVE-LVC",
      );
      console.log("วิชาปี 2 ทั้งหมด:", year1Plans.length);
      console.log("วิชา DVE-MSIX:", dveMsixPlans.length);
      console.log("วิชา DVE-LVC:", dveLvcPlans.length);
      console.log(
        "ตัวอย่างวิชาปี 2:",
        year1Plans.length > 0 ? year1Plans[0] : "ไม่พบ",
      );
    }
  }, [plans]);

  function handleDragStart(event: any) {
    document.body.classList.add("dragging-active");

    const { active } = event;

    const isFromTable = active.id.startsWith("table-subject-");
    let subjectId;

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
      // Early return if same cell — prevents infinite setState loop
      setDragOverCell((prev) => {
        if (prev && prev.day === day && prev.period === period) return prev;
        return { day, period };
      });
    } else {
      setDragOverCell((prev) => (prev === null ? null : null));
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

    let subjectId;
    if (active.id.startsWith("table-subject-")) {
      subjectId = parseInt(active.id.replace("table-subject-", ""));
    } else {
      subjectId = parseInt(active.id.replace("subject-", ""));
    }

    if (over.id.startsWith("cell-")) {
      const [_, day, period] = over.id.split("-").map(Number);

      const subject = plans.find((plan) => plan.id === subjectId);

      if (subject) {
        console.log("กำลังวางวิชา:", {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          room: subject.room,
          teacher: subject.teacher,
          section: subject.section,
        });

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
        const activityPeriods =
          typeof termYear === "string" && termYear.startsWith("3/")
            ? []
            : [14, 15, 16, 17];
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

        const periods: number[] = [];
        for (let i = 0; i < totalPeriods; i++) {
          let currentPeriod = period + i;
          if (isWednesday && activityPeriods.includes(currentPeriod)) {
            continue;
          }
          periods.push(currentPeriod);
        }

        let hasOverlap = false;
        Object.entries(tableAssignments).forEach(
          ([existingSubjectId, assignment]) => {
            if (parseInt(existingSubjectId) === subjectId) return;
            if (!assignment) return;

            const entries = Array.isArray(assignment)
              ? assignment
              : [assignment];
            entries.forEach((entry) => {
              if (entry && entry.day === day) {
                const overlap = periods.some((p) => entry.periods.includes(p));
                if (overlap) {
                  hasOverlap = true;
                }
              }
            });
          },
        );

        if (hasOverlap) {
          console.warn("ไม่สามารถวางวิชาได้: ทับคาบวิชาอื่น");
          setDragFailedSubjectId(subjectId);
          setConflicts([]);
          setActiveSubject(null);
          return;
        }

        const isTerm3 =
          typeof termYear === "string" && termYear.startsWith("3/");
        if (isTerm3) {
          const selfEntries = tableAssignments[subjectId];
          if (Array.isArray(selfEntries)) {
            const selfOverlap = selfEntries.some(
              (e) =>
                e.day === day && periods.some((p) => e.periods.includes(p)),
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
              yearLevel: "ปี 2",
              planType: "DVE-MSIX",
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
            console.log(
              "🎉 [FRONTEND-ปี2] บันทึกตารางเรียนสำเร็จ (API จะ sync อัตโนมัติ)",
              data,
            );
            setConflicts([]);
            setDragFailedSubjectId(null);

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

            await handleSubjectUpdate();
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
      const subject = plans.find((plan) => plan.id === subjectId);

      const url = recordId
        ? `/api/timetable/record/${recordId}`
        : `/api/timetable/${subjectId}`;
      await fetch(url, {
        method: "DELETE",
      });

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
      } else {
        setTableAssignments((prev) => {
          const newAssignments = { ...prev };
          delete newAssignments[subjectId];
          return newAssignments;
        });
      }

      setConflicts((prev) =>
        prev.filter(
          (conflict) =>
            !conflict.conflicts?.some((item: any) => item.planId === subjectId),
        ),
      );

      setDragFailedSubjectId((prev) => (prev === subjectId ? null : prev));

      console.log(
        "🗑️ [FRONTEND-ปี2] ลบตารางเรียนสำเร็จ (API จะ sync อัตโนมัติ) - วิชา:",
        subject?.subjectName,
      );

      await handleSubjectUpdate();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบข้อมูลตารางเรียน:", error);
    }
  }

  async function handleSplitSubject(subjectId: number, splitData: any) {
    try {
      setIsLoading(true);

      const originalSubject = plans.find((plan) => plan.id === subjectId);
      console.log("Original subject before split:", originalSubject);

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

      console.log("Split results received:", {
        updated: updatedSubject,
        new: newSubject,
      });

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

      console.log(
        "Split successful - Updated: ",
        updatedSubject,
        "New: ",
        newSubject,
      );
    } catch (error) {
      console.error("Error splitting subject:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMergeSubject(subjectId: number) {
    try {
      setIsLoading(true);

      console.log("Starting merge for subject ID:", subjectId);

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

      console.log("Merge response:", {
        mergedSubject,
        deletedParts,
      });

      setPlans((prevPlans) => {
        console.log("Previous plans:", prevPlans.length);

        let updatedPlans = prevPlans.filter(
          (plan) => !deletedParts.includes(plan.id),
        );

        console.log("After filtering deleted parts:", updatedPlans.length);

        updatedPlans = updatedPlans.map((plan) => {
          if (plan.id === mergedSubject.id) {
            console.log("Updating merged subject:", {
              old: {
                id: plan.id,
                name: plan.subjectName,
                room: plan.room,
                teacher: plan.teacher,
                section: plan.section,
              },
              new: {
                id: mergedSubject.id,
                name: mergedSubject.subjectName,
                room: mergedSubject.room,
                teacher: mergedSubject.teacher,
                section: mergedSubject.section,
              },
            });
            return mergedSubject;
          }
          return plan;
        });

        console.log("Final plans count:", updatedPlans.length);
        return updatedPlans;
      });

      setTableAssignments((prev) => {
        const newAssignments = { ...prev };

        deletedParts.forEach((partId: number) => {
          console.log("Removing assignment for deleted part:", partId);
          delete newAssignments[partId];
        });

        console.log(
          "Removing assignment for merged subject:",
          mergedSubject.id,
        );
        delete newAssignments[mergedSubject.id];

        return newAssignments;
      });

      console.log(
        "Merge successful - Merged: ",
        mergedSubject,
        "Deleted: ",
        deletedParts,
      );

      try {
        console.log("🔄 ซิ๊งค์การรวมวิชาไปยัง DVE-LVC");

        const searchResponse = await fetch(
          `/api/subject?subjectCode=${encodeURIComponent(mergedSubject.subjectCode)}&termYear=${encodeURIComponent(termYear || "")}&yearLevel=${encodeURIComponent("ปี 2")}&planType=DVE-LVC`,
        );

        if (searchResponse.ok) {
          const dveSubjects = await searchResponse.json();

          const splitSubjects = dveSubjects.filter(
            (s: any) =>
              s.subjectCode === mergedSubject.subjectCode &&
              s.subjectName.includes("(ส่วนที่"),
          );

          if (splitSubjects.length > 0) {
            console.log(
              `พบวิชาที่แบ่งแล้วใน DVE-LVC จำนวน ${splitSubjects.length} ส่วน`,
            );

            const firstSplitSubject = splitSubjects[0];

            const syncMergeResponse = await fetch("/api/subject/merge", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ subjectId: firstSplitSubject.id }),
            });

            if (syncMergeResponse.ok) {
              console.log("✅ ซิ๊งค์การรวมวิชาไปยัง DVE-LVC สำเร็จ");
            } else {
              console.log(
                "⚠️ ซิ๊งค์การรวมวิชาไปยัง DVE-LVC ไม่สำเร็จ:",
                await syncMergeResponse.text(),
              );
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

    const periods: number[] = [];
    for (let i = 0; i < totalPeriods; i++) {
      let currentPeriod = period + i;
      if (
        !isTerm3Preview &&
        day === 2 &&
        currentPeriod >= 14 &&
        currentPeriod <= 17
      ) {
        continue;
      }
      periods.push(currentPeriod);
    }

    let hasOverlap = false;
    let overlapSubject = null;

    Object.entries(tableAssignments).forEach(
      ([existingSubjectId, assignment]) => {
        if (parseInt(existingSubjectId) === activeSubject.id) return;
        if (!assignment) return;

        const entries = Array.isArray(assignment) ? assignment : [assignment];
        entries.forEach((entry) => {
          if (entry && entry.day === day) {
            const overlap = periods.some((p) => entry.periods.includes(p));
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
          <div className="flex justify-between items-center mx-8 pb-2 text-lg font-semibold">
            <div className="flex items-center gap-4">
              <span>ตารางเรียน ปวส. ปี 2 (ม.6) ภาคเรียนที่ {termYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <AutoFullCurriculumButton
                termYear={termYear || ""}
                onScheduleComplete={() => {
                  handleSubjectUpdate();
                }}
              />
              <ClearFullCurriculumButton
                termYear={termYear || ""}
                onClearComplete={() => {
                  handleSubjectUpdate();
                }}
              />
              <DownloadButtonTimetable
                currentTermYear={termYear}
                timetables={timetableData}
              />
            </div>
          </div>
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
            yearLevel="ปี 2"
            planType="DVE-MSIX"
            plans={plans}
            assignments={tableAssignments}
            assignedCount={assignedSubjectsCount}
            onRemoveAssignment={handleRemoveAssignment}
            onSplitSubject={handleSplitSubject}
            onMergeSubject={handleMergeSubject}
            conflicts={conflicts}
            onSubjectUpdate={handleSubjectUpdate}
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
