/**
 * Pure calculation utilities for timetable scheduling and validations.
 */

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

