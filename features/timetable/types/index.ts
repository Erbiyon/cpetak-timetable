export type PlanType = "FOUR_YEAR" | "TRANSFER" | "DVE-MSIX" | "DVE-LVC";

export type YearLevel = "1" | "2" | "3" | "4" | "ปี 1" | "ปี 2" | "ปี 3" | "ปี 4";

export interface TimetableConfig {
  planType: PlanType;
  yearLevel: YearLevel;
  title: string;
  isMultiAssignment?: boolean;
}

export interface AssignmentEntry {
  id?: number;
  day: number;
  periods: number[];
}

export interface TimetableSubject {
  id: number;
  subjectCode: string;
  subjectName: string;
  credit: number;
  lectureHour: number;
  labHour: number;
  section?: string | null;
  roomId?: number | null;
  teacherId?: number | null;
  yearLevel?: string;
  planType?: string;
  teacher?: {
    id: number;
    tId: string;
    tName: string;
    tLastName: string;
    teacherType: string;
  } | null;
  room?: {
    id: number;
    roomCode: string;
    roomType: string;
    roomCate?: string | null;
  } | null;
  coTeaching?: boolean;
  coTeachingGroupKey?: string;
}

export interface ConflictItem {
  type: string;
  message?: string;
  conflicts?: any[];
  mainSubject?: any;
}

