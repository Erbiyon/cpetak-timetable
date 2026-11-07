"use client";

import { useState, useCallback, useEffect } from "react";
import { TimetableSubject, AssignmentEntry } from "../types";

export interface UseMultiTimetableDataOptions {
  termYear?: string;
  yearLevel: string;
  planType: string;
}

export function useMultiTimetableData({
  termYear: initialTermYear,
  yearLevel,
  planType,
}: UseMultiTimetableDataOptions) {
  const [termYear, setTermYear] = useState<string | undefined>(initialTermYear);
  const [plans, setPlans] = useState<TimetableSubject[]>([]);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [tableAssignments, setTableAssignments] = useState<{
    [subjectId: number]: AssignmentEntry[] | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to build multi-assignment map from timetable records
  const buildMultiAssignmentsMap = useCallback(
    (records: any[], termYearVal?: string) => {
      const assignments: {
        [subjectId: number]: AssignmentEntry[];
      } = {};

      records.forEach((item: any) => {
        const periods: number[] = [];
        for (let p = item.startPeriod; p <= item.endPeriod; p++) {
          if (
            !termYearVal?.startsWith("3/") &&
            item.day === 2 &&
            p >= 14 &&
            p <= 17
          ) {
            continue;
          }
          periods.push(p);
        }

        if (!assignments[item.planId]) assignments[item.planId] = [];
        assignments[item.planId].push({
          id: item.id,
          day: item.day,
          periods,
        });
      });

      return assignments;
    },
    []
  );

  const refreshData = useCallback(async () => {
    if (!termYear) return;
    setIsLoading(true);
    try {
      const [timetableRes, planRes] = await Promise.all([
        fetch(
          `/api/timetable?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${planType}`
        ),
        fetch(
          `/api/subject?termYear=${encodeURIComponent(termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${planType}`
        ),
      ]);

      if (timetableRes.ok) {
        const data = await timetableRes.json();
        setTimetableData(data);
        setTableAssignments(buildMultiAssignmentsMap(data, termYear));
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        if (Array.isArray(planData) && planData.length > 0) {
          setPlans(planData);
        }
      }
    } catch (error) {
      console.error("Error refreshing multi-timetable data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [termYear, yearLevel, planType, buildMultiAssignmentsMap]);

  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const termRes = await fetch("/api/term-year");
        if (!termRes.ok) return;
        const termData = await termRes.json();
        setTermYear(termData.termYear);

        const [timetableRes, planRes] = await Promise.all([
          fetch(
            `/api/timetable?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${planType}`
          ),
          fetch(
            `/api/subject?termYear=${encodeURIComponent(termData.termYear)}&yearLevel=${encodeURIComponent(yearLevel)}&planType=${planType}`
          ),
        ]);

        if (timetableRes.ok) {
          const timetableItems = await timetableRes.json();
          setTimetableData(timetableItems);
          setTableAssignments(buildMultiAssignmentsMap(timetableItems, termData.termYear));
        }

        if (planRes.ok) {
          const planItems = await planRes.json();
          setPlans(planItems);
        }
      } catch (error) {
        console.error("Error loading initial multi-timetable data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [yearLevel, planType, buildMultiAssignmentsMap]);

  return {
    termYear,
    plans,
    setPlans,
    timetableData,
    tableAssignments,
    setTableAssignments,
    isLoading,
    refreshData,
  };
}

