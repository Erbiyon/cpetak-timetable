import { describe, it, expect } from "vitest";

// Replicates period overlap validation from app/api/timetable/route.ts
function checkTimeOverlap(
  existingStart: number,
  existingEnd: number,
  newStart: number,
  newEnd: number
): boolean {
  // Logic from app/api/timetable/route.ts:
  // OR:
  // 1. (existing.startPeriod <= newStart && existing.endPeriod >= newStart)
  // 2. (existing.startPeriod <= newEnd && existing.endPeriod >= newEnd)
  // 3. (existing.startPeriod >= newStart && existing.endPeriod <= newEnd)
  const condition1 = existingStart <= newStart && existingEnd >= newStart;
  const condition2 = existingStart <= newEnd && existingEnd >= newEnd;
  const condition3 = existingStart >= newStart && existingEnd <= newEnd;
  return condition1 || condition2 || condition3;
}

describe("Timetable Conflict Detection (app/api/timetable/route.ts regression)", () => {
  it("detects exact same period conflict", () => {
    expect(checkTimeOverlap(1, 3, 1, 3)).toBe(true);
  });

  it("detects partial start period overlap", () => {
    // Existing is 1-3, new starts at 3 and ends at 5
    expect(checkTimeOverlap(1, 3, 3, 5)).toBe(true);
  });

  it("detects partial end period overlap", () => {
    // Existing is 3-6, new starts at 1 and ends at 4
    expect(checkTimeOverlap(3, 6, 1, 4)).toBe(true);
  });

  it("detects when new period completely engulfs existing period", () => {
    // Existing is 3-4, new is 2-6
    expect(checkTimeOverlap(3, 4, 2, 6)).toBe(true);
  });

  it("returns false when periods are completely non-overlapping", () => {
    // Existing 1-3, new 4-6
    expect(checkTimeOverlap(1, 3, 4, 6)).toBe(false);
    // Existing 5-7, new 1-3
    expect(checkTimeOverlap(5, 7, 1, 3)).toBe(false);
  });
});
