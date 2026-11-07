export interface SubjectRoom {
  id: number;
  roomCode: string;
  roomType?: string;
}

export interface SubjectTeacher {
  id: number;
  tName: string;
  tLastName: string;
  tId: string;
}

export interface SubjectItem {
  id: number;
  subjectCode: string;
  subjectName: string;
  credit: number;
  lectureHour: number;
  labHour: number;
  termYear: string;
  yearLevel: string;
  planType: string;
  dep: string;
  roomId: number | null;
  teacherId: number | null;
  section: string | null;
  room?: SubjectRoom | null;
  teacher?: SubjectTeacher | null;
  timetables?: any[];
}

export interface CreateSubjectInput {
  subjectCode: string;
  subjectName: string;
  credit: number;
  lectureHour: number;
  labHour: number;
  termYear: string;
  yearLevel: string;
  planType: string;
  dep: string;
  roomId?: number | null;
  teacherId?: number | null;
  section?: string | null;
}

export interface UpdateSubjectInput {
  id: number;
  subjectCode?: string;
  subjectName?: string;
  credit?: number;
  lectureHour?: number;
  labHour?: number;
  termYear?: string;
  yearLevel?: string;
  planType?: string;
  dep?: string;
  roomId?: number | null;
  teacherId?: number | null;
  section?: string | null;
}

export interface PatchSubjectInput {
  teacherId?: number | null;
  roomId?: number | null;
  section?: string | null;
  sectionNumber?: number | string | null;
  [key: string]: any;
}

export interface SubjectFilterOptions {
  yearLevel?: string;
  termYear?: string;
  planType?: string;
  dep?: string;
  subjectCode?: string;
}

export interface SplitPartInput {
  partNumber: number;
  lectureHour: number;
  labHour: number;
}

export interface SplitSubjectInput {
  subjectId: number;
  splitData: {
    part1: SplitPartInput;
    part2: SplitPartInput;
  };
}

export interface MergeSubjectInput {
  subjectId: number;
}
