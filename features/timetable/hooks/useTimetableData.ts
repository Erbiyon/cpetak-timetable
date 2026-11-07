"use client";

import { useState, useCallback, useEffect } from "react";
import { TimetableSubject } from "../types";

export interface UseTimetableDataOptions {
  termYear?: string;
  yearLevel: string;
  planType: string;
}

export function useTimetableData({
  termYear: initialTermYear,
  yearLevel,
  planType,
}: UseTimetableDataOptions) {
  const [termYear, setTermYear] = useState<string | undefined>(initialTermYear);
  const [plans, setPlans] = useState<TimetableSubject[]>([]);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [tableAssignments, setTableAssignments] = useState<{
    [subjectId: number]: { day: number; periods: number[] } | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert raw timetable records into assignments map
  const buildAssignmentsMap = useCallback(
    (records: any[], termYearVal?: string) => {
      const assignments: {
        [subjectId: number]: { day: number; periods: number[] };
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
        assignments[item.planId] = { day: item.day, periods };
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
        setTableAssignments(buildAssignmentsMap(data, termYear));
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        if (Array.isArray(planData) && planData.length > 0) {
          setPlans(planData);
        }
      }
    } catch (error) {
      console.error("Error refreshing timetable data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [termYear, yearLevel, planType, buildAssignmentsMap]);

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
          setTableAssignments(buildAssignmentsMap(timetableItems, termData.termYear));
        }

        if (planRes.ok) {
          const planItems = await planRes.json();
          setPlans(planItems);
        }
      } catch (error) {
        console.error("Error loading initial timetable data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [yearLevel, planType, buildAssignmentsMap]);

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

