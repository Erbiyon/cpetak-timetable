import { CreateCurriculumInput } from "./types";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateCurriculumInput(body: any): ValidationResult<CreateCurriculumInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
  }

  const {
    id_sub,
    subject_name,
    credit,
    lacture_credit,
    lab_credit,
    out_credit,
    curriculum_type,
  } = body;

  if (!id_sub || typeof id_sub !== "string" || !id_sub.trim()) {
    return { success: false, error: "กรุณาระบุรหัสวิชา" };
  }

  if (!subject_name || typeof subject_name !== "string" || !subject_name.trim()) {
    return { success: false, error: "กรุณาระบุชื่อวิชา" };
  }

  const numCredit = Number(credit);
  const numLecture = Number(lacture_credit);
  const numLab = Number(lab_credit);
  const numOut = Number(out_credit);

  if (isNaN(numCredit) || isNaN(numLecture) || isNaN(numLab) || isNaN(numOut)) {
    return { success: false, error: "หน่วยกิตและชั่วโมงเรียนต้องเป็นตัวเลข" };
  }

  return {
    success: true,
    data: {
      id_sub: id_sub.trim(),
      subject_name: subject_name.trim(),
      credit: numCredit,
      lacture_credit: numLecture,
      lab_credit: numLab,
      out_credit: numOut,
      curriculum_type: typeof curriculum_type === "string" ? curriculum_type.trim() : "FOUR_YEAR",
    },
  };
}
