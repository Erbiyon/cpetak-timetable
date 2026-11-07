import { describe, it, expect } from "vitest";
import {
  hasMultiAssignmentOverlap,
  calculateAssignmentPeriods,
} from "@/features/timetable/utils/timetable-calculations";

describe("Multi-Assignment Characterization & Utility Tests", () => {
  it("detects overlap when another subject is already assigned on the same day and periods", () => {
    const tableAssignments = {
      10: [
        { id: 101, day: 0, periods: [1, 2, 3] },
        { id: 102, day: 1, periods: [4, 5, 6] },
      ],
      20: [
        { id: 201, day: 0, periods: [7, 8, 9] },
      ],
    };

    // Candidate subject 30 wants day 0, periods [2, 3, 4] -> overlaps with subject 10
    const result = hasMultiAssignmentOverlap(tableAssignments, 30, 0, [2, 3, 4]);
    expect(result.hasOverlap).toBe(true);
    expect(result.overlappingSubjectId).toBe(10);
  });

  it("allows non-overlapping multi-assignments on the same day", () => {
    const tableAssignments = {
      10: [
        { id: 101, day: 0, periods: [1, 2, 3] },
      ],
    };

    // Candidate subject 30 wants day 0, periods [4, 5, 6] -> no overlap
    const result = hasMultiAssignmentOverlap(tableAssignments, 30, 0, [4, 5, 6]);
    expect(result.hasOverlap).toBe(false);
  });

  it("ignores self-overlap when activeSubjectId matches", () => {
    const tableAssignments = {
      10: [
        { id: 101, day: 0, periods: [1, 2, 3] },
      ],
    };

    // Subject 10 moving within its own slots
    const result = hasMultiAssignmentOverlap(tableAssignments, 10, 0, [1, 2, 3]);
    expect(result.hasOverlap).toBe(false);
  });

  it("calculates multi-slot periods skipping Wednesday activity periods for regular terms", () => {
    // If startPeriod is 12 and totalPeriods is 4 (i = 0,1,2,3 -> 12, 13, 14, 15)
    // On Wednesday, periods 14 and 15 are in activityPeriods [14,15,16,17], so they are skipped -> [12, 13]
    const periods = calculateAssignmentPeriods(2, 12, 4, false);
    expect(periods).toEqual([12, 13]);
  });

  it("does not skip Wednesday activity periods during Term 3 (summer)", () => {
    const periods = calculateAssignmentPeriods(2, 13, 4, true);
    expect(periods).toEqual([13, 14, 15, 16]);
  });
});
