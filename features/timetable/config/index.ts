import { PlanType, YearLevel, TimetableConfig } from "../types";

export const TIMETABLE_CONFIGS: Record<string, TimetableConfig> = {
  // Four-Year Curriculum (ปี 1 - 4)
  "four-one-year": {
    planType: "FOUR_YEAR",
    yearLevel: "1",
    title: "จัดตารางสอน แผน 4 ปี ชั้นปีที่ 1",
    isMultiAssignment: false,
  },
  "four-two-year": {
    planType: "FOUR_YEAR",
    yearLevel: "2",
    title: "จัดตารางสอน แผน 4 ปี ชั้นปีที่ 2",
    isMultiAssignment: false,
  },
  "four-three-year": {
    planType: "FOUR_YEAR",
    yearLevel: "3",
    title: "จัดตารางสอน แผน 4 ปี ชั้นปีที่ 3",
    isMultiAssignment: false,
  },
  "four-four-year": {
    planType: "FOUR_YEAR",
    yearLevel: "4",
    title: "จัดตารางสอน แผน 4 ปี ชั้นปีที่ 4",
    isMultiAssignment: false,
  },

  // Transfer Curriculum (เทียบโอน ปี 1 - 3)
  "transfer-one-year": {
    planType: "TRANSFER",
    yearLevel: "1",
    title: "จัดตารางสอน แผนเทียบโอน ชั้นปีที่ 1",
    isMultiAssignment: true,
  },
  "transfer-two-year": {
    planType: "TRANSFER",
    yearLevel: "2",
    title: "จัดตารางสอน แผนเทียบโอน ชั้นปีที่ 2",
    isMultiAssignment: true,
  },
  "transfer-three-year": {
    planType: "TRANSFER",
    yearLevel: "3",
    title: "จัดตารางสอน แผนเทียบโอน ชั้นปีที่ 3",
    isMultiAssignment: true,
  },

  // DVE LVC (ปวช. ปี 1 - 2)
  "dve-one-year": {
    planType: "DVE-LVC",
    yearLevel: "1",
    title: "จัดตารางสอน แผน DVE (ปวช.) ชั้นปีที่ 1",
    isMultiAssignment: true,
  },
  "dve-two-year": {
    planType: "DVE-LVC",
    yearLevel: "2",
    title: "จัดตารางสอน แผน DVE (ปวช.) ชั้นปีที่ 2",
    isMultiAssignment: true,
  },

  // DVE MSIX (ม.6 ปี 1 - 2)
  "dve-ms-one-year": {
    planType: "DVE-MSIX",
    yearLevel: "1",
    title: "จัดตารางสอน แผน DVE (ม.6) ชั้นปีที่ 1",
    isMultiAssignment: true,
  },
  "dve-ms-two-year": {
    planType: "DVE-MSIX",
    yearLevel: "2",
    title: "จัดตารางสอน แผน DVE (ม.6) ชั้นปีที่ 2",
    isMultiAssignment: true,
  },
};
