/**
 * Pure calculation utilities for timetable scheduling and validations.
 */

import { AssignmentEntry } from "../types";

export interface PeriodRange {
  startPeriod: number;
  endPeriod: number;
}

/**
 * Calculates start and end period from an array of consecutive periods.
 */
export function getPeriodRange(periods: number[]): PeriodRange | null {
  if (!periods || periods.length === 0) return null;
  const sorted = [...periods].sort((a, b) => a - b);
  return {
    startPeriod: sorted[0],
    endPeriod: sorted[sorted.length - 1],
  };
}

/**
 * Checks if two period ranges on the same day overlap.
 */
export function isPeriodOverlap(
  range1: PeriodRange,
  range2: PeriodRange
): boolean {
  return (
    (range1.startPeriod <= range2.startPeriod && range1.endPeriod >= range2.startPeriod) ||
    (range1.startPeriod <= range2.endPeriod && range1.endPeriod >= range2.endPeriod) ||
    (range1.startPeriod >= range2.startPeriod && range1.endPeriod <= range2.endPeriod)
  );
}

/**
 * Formats period numbers array into a human-readable string (e.g. [1, 2, 3] -> "1-3").
 */
export function formatPeriodRange(periods: number[]): string {
  if (!periods || periods.length === 0) return "";
  const sorted = [...periods].sort((a, b) => a - b);
  if (sorted.length === 1) return `${sorted[0]}`;
  return `${sorted[0]}-${sorted[sorted.length - 1]}`;
}

/**
 * Calculates occupied period numbers starting from `period` for `totalPeriods` slots,
 * automatically skipping Wednesday activity periods (14-17) unless term starts with "3/".
 */
export function calculateAssignmentPeriods(
  day: number,
  startPeriod: number,
  totalPeriods: number,
  isTerm3: boolean = false
): number[] {
  const isWednesday = day === 2;
  const activityPeriods = isTerm3 ? [] : [14, 15, 16, 17];
  const periods: number[] = [];

  for (let i = 0; i < totalPeriods; i++) {
    const currentPeriod = startPeriod + i;
    if (isWednesday && activityPeriods.includes(currentPeriod)) {
      continue;
    }
    periods.push(currentPeriod);
  }

  return periods;
}

/**
 * Checks if a candidate assignment (day, periods) overlaps with any existing multi-assignment entries.
 * Ignores entries for the active subject itself unless checking self-overlap.
 */
export function hasMultiAssignmentOverlap(
  tableAssignments: Record<number, AssignmentEntry[] | null>,
  activeSubjectId: number,
  day: number,
  periods: number[]
): { hasOverlap: boolean; overlappingSubjectId?: number } {
  for (const [subjIdStr, entries] of Object.entries(tableAssignments)) {
    const existingSubjectId = parseInt(subjIdStr, 10);
    if (existingSubjectId === activeSubjectId || !entries) continue;

    const list = Array.isArray(entries) ? entries : [entries];
    for (const entry of list) {
      if (entry && entry.day === day) {
        const overlap = periods.some((p) => entry.periods.includes(p));
        if (overlap) {
          return { hasOverlap: true, overlappingSubjectId: existingSubjectId };
        }
      }
    }
  }

  return { hasOverlap: false };
}



