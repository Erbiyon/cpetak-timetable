import { CreateTeacherInput, UpdateTeacherInput } from "./types";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateCreateTeacherInput(body: any): ValidationResult<CreateTeacherInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
  }

  const { tId, tName, tLastName, teacherType } = body;

  if (!tName || typeof tName !== "string" || !tName.trim() || !tLastName || typeof tLastName !== "string" || !tLastName.trim()) {
    return { success: false, error: "กรุณากรอกชื่อและนามสกุล" };
  }

  return {
    success: true,
    data: {
      tId: typeof tId === "string" && tId.trim() ? tId.trim() : undefined,
      tName: tName.trim(),
      tLastName: tLastName.trim(),
      teacherType: typeof teacherType === "string" && teacherType.trim() ? teacherType.trim() : "อาจารย์ภายนอกสาขา",
    },
  };
}

export function validateUpdateTeacherInput(body: any): ValidationResult<UpdateTeacherInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
  }

  const { tName, tLastName } = body;

  if (!tName || typeof tName !== "string" || !tName.trim() || !tLastName || typeof tLastName !== "string" || !tLastName.trim()) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  return {
    success: true,
    data: {
      tName: tName.trim(),
      tLastName: tLastName.trim(),
    },
  };
}
