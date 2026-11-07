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

export interface CreateTimetableInput {
  planId: number;
  termYear: string;
  yearLevel: string;
  planType: string;
  day: number;
  startPeriod: number;
  endPeriod: number;
  roomId?: number | null;
  teacherId?: number | null;
  section?: string | null;
}

export interface TimetableConflictCheckOptions {
  planId: number;
  termYear: string;
  yearLevel: string;
  planType: string;
  day: number;
  startPeriod: number;
  endPeriod: number;
  teacherId?: number | null;
  roomId?: number | null;
  section?: string | null;
}

export type CreateTimetableResult =
  | {
      success: true;
      statusCode: 200;
      timetable: any;
      conflicts?: never;
      error?: never;
    }
  | {
      success: false;
      statusCode: number;
      conflicts: ConflictItem[];
      timetable?: never;
      error?: never;
    }
  | {
      success: false;
      statusCode: number;
      error: string;
      conflicts?: never;
      timetable?: never;
    };

export interface DeleteTimetableInput {
  planId: number;
}

export type DeleteTimetableResult =
  | {
      success: true;
      statusCode: 200;
      message: string;
      deletedPlans: number[];
      deletedCount: number;
      error?: never;
    }
  | {
      success: false;
      statusCode: number;
      error: string;
      message?: never;
      deletedPlans?: never;
      deletedCount?: never;
    };

export interface DeleteTimetableRecordInput {
  recordId: number;
}

export type DeleteTimetableRecordResult =
  | {
      success: true;
      statusCode: 200;
      deletedId: number;
      planId: number;
      error?: never;
    }
  | {
      success: false;
      statusCode: number;
      error: string;
      deletedId?: never;
      planId?: never;
    };

export interface ClearTimetableInput {
  termYear: string;
  yearLevel: string;
  planType: string;
}

export type ClearTimetableResult =
  | {
      success: true;
      statusCode: 200;
      message: string;
      deletedCount: number;
      error?: never;
    }
  | {
      success: false;
      statusCode: number;
      error: string;
      message?: never;
      deletedCount?: never;
    };

export interface GetTimetableQuery {
  roomId?: number;
  teacherId?: number;
  termYear?: string;
  yearLevel?: string;
  planType?: string;
}
