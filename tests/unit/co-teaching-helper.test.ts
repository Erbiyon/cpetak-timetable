import { describe, it, expect } from "vitest";
import { generateCoTeachingGroupKey } from "@/utils/co-teaching-helper";

describe("Co-Teaching Group Key Generator (utils/co-teaching-helper.ts)", () => {
  it("should generate correct group key with subjectCode and termYear without part number", () => {
    const key = generateCoTeachingGroupKey("CPE101", "1/2567");
    expect(key).toBe("CPE101-1/2567");
  });

  it("should generate correct group key with partNumber included", () => {
    const key = generateCoTeachingGroupKey("CPE101", "1/2567", 1);
    expect(key).toBe("CPE101-1-1/2567");

    const keyPart2 = generateCoTeachingGroupKey("CPE101", "1/2567", 2);
    expect(keyPart2).toBe("CPE101-2-1/2567");
  });

  it("should throw error if termYear format does not match regex", () => {
    expect(() => generateCoTeachingGroupKey("CPE101", "invalid-term")).toThrow(
      "Invalid termYear format: invalid-term"
    );
  });
});
