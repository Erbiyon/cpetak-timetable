import { TimetableConfig } from "../types";

export const TIMETABLE_CONFIGS: Record<string, TimetableConfig> = {
  // Four-Year Curriculum (ปี 1 - 4)
  "four-one-year": {
    planType: "FOUR_YEAR",
    yearLevel: "ปี 1",
    title: "ตารางเรียน 4 ปี ปี 1",
    isMultiAssignment: false,
  },
  "four-two-year": {
    planType: "FOUR_YEAR",
    yearLevel: "ปี 2",
    title: "ตารางเรียน 4 ปี ปี 2",
    isMultiAssignment: false,
  },
  "four-three-year": {
    planType: "FOUR_YEAR",
    yearLevel: "ปี 3",
    title: "ตารางเรียน 4 ปี ปี 3",
    isMultiAssignment: false,
  },
  "four-four-year": {
    planType: "FOUR_YEAR",
    yearLevel: "ปี 4",
    title: "ตารางเรียน 4 ปี ปี 4",
    isMultiAssignment: false,
  },

  // Transfer Curriculum (เทียบโอน ปี 1 - 3)
  "transfer-one-year": {
    planType: "TRANSFER",
    yearLevel: "ปี 1",
    title: "ตารางเรียน เทียบโอน ปี 1",
    isMultiAssignment: true,
  },
  "transfer-two-year": {
    planType: "TRANSFER",
    yearLevel: "ปี 2",
    title: "ตารางเรียน เทียบโอน ปี 2",
    isMultiAssignment: true,
  },
  "transfer-three-year": {
    planType: "TRANSFER",
    yearLevel: "ปี 3",
    title: "ตารางเรียน เทียบโอน ปี 3",
    isMultiAssignment: true,
  },

  // DVE LVC (ปวช. ปี 1 - 2)
  "dve-one-year": {
    planType: "DVE-LVC",
    yearLevel: "ปี 1",
    title: "ตารางเรียน ปวส. ปี 1 (ปวช.)",
    isMultiAssignment: true,
  },
  "dve-two-year": {
    planType: "DVE-LVC",
    yearLevel: "ปี 2",
    title: "ตารางเรียน ปวส. ปี 2 (ปวช.)",
    isMultiAssignment: true,
  },

  // DVE MSIX (ม.6 ปี 1 - 2)
  "dve-ms-one-year": {
    planType: "DVE-MSIX",
    yearLevel: "ปี 1",
    title: "ตารางเรียน ปวส. ปี 1 (ม.6)",
    isMultiAssignment: true,
  },
  "dve-ms-two-year": {
    planType: "DVE-MSIX",
    yearLevel: "ปี 2",
    title: "ตารางเรียน ปวส. ปี 2 (ม.6)",
    isMultiAssignment: true,
  },
};

