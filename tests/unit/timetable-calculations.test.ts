import { describe, it, expect } from "vitest";
import {
  getPeriodRange,
  isPeriodOverlap,
  formatPeriodRange,
} from "@/features/timetable/utils/timetable-calculations";

describe("Timetable Pure Calculations (features/timetable/utils)", () => {
  describe("getPeriodRange", () => {
    it("returns null for empty periods", () => {
      expect(getPeriodRange([])).toBeNull();
    });

    it("calculates start and end for consecutive periods", () => {
      expect(getPeriodRange([1, 2, 3])).toEqual({ startPeriod: 1, endPeriod: 3 });
      expect(getPeriodRange([4, 2, 3])).toEqual({ startPeriod: 2, endPeriod: 4 });
    });
  });

  describe("isPeriodOverlap", () => {
    it("detects exact and partial overlaps", () => {
      expect(isPeriodOverlap({ startPeriod: 1, endPeriod: 3 }, { startPeriod: 1, endPeriod: 3 })).toBe(true);
      expect(isPeriodOverlap({ startPeriod: 1, endPeriod: 3 }, { startPeriod: 3, endPeriod: 5 })).toBe(true);
      expect(isPeriodOverlap({ startPeriod: 3, endPeriod: 6 }, { startPeriod: 1, endPeriod: 4 })).toBe(true);
      expect(isPeriodOverlap({ startPeriod: 1, endPeriod: 6 }, { startPeriod: 2, endPeriod: 4 })).toBe(true);
    });

    it("returns false for non-overlapping periods", () => {
      expect(isPeriodOverlap({ startPeriod: 1, endPeriod: 3 }, { startPeriod: 4, endPeriod: 6 })).toBe(false);
    });
  });

  describe("formatPeriodRange", () => {
    it("formats single and range periods", () => {
      expect(formatPeriodRange([])).toBe("");
      expect(formatPeriodRange([2])).toBe("2");
      expect(formatPeriodRange([1, 2, 3])).toBe("1-3");
    });
  });
});
