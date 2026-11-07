export interface TeacherItem {
  id: number;
  tId: string;
  tName: string;
  tLastName: string;
  teacherType: string;
}

export interface CreateTeacherInput {
  tId?: string;
  tName: string;
  tLastName: string;
  teacherType?: string;
}

export interface UpdateTeacherInput {
  tName: string;
  tLastName: string;
}
