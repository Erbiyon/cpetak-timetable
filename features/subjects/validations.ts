import { CreateSubjectInput, SplitSubjectInput, UpdateSubjectInput } from "./types";

export interface SubjectValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

export function validateCreateSubjectInput(input: any): SubjectValidationResult<CreateSubjectInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["ข้อมูลไม่ถูกต้อง"] };
  }

  const subjectCode = typeof input.subjectCode === "string" ? input.subjectCode.trim() : "";
  const subjectName = typeof input.subjectName === "string" ? input.subjectName.trim() : "";
  const termYear = typeof input.termYear === "string" ? input.termYear.trim() : "";
  const yearLevel = typeof input.yearLevel === "string" ? input.yearLevel.trim() : "";
  const planType = typeof input.planType === "string" ? input.planType.trim() : "";
  const dep = typeof input.dep === "string" ? input.dep.trim() : "";

  if (!subjectCode || !subjectName || !termYear || !yearLevel || !planType || !dep) {
    errors.push("กรุณากรอกข้อมูลให้ครบถ้วน");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      subjectCode,
      subjectName,
      credit: Number(input.credit) || 0,
      lectureHour: Number(input.lectureHour) || 0,
      labHour: Number(input.labHour) || 0,
      termYear,
      yearLevel,
      planType,
      dep,
      roomId: input.roomId ? Number(input.roomId) : null,
      teacherId: input.teacherId ? Number(input.teacherId) : null,
      section: input.section ? String(input.section).trim() : null,
    },
  };
}

export function validateUpdateSubjectInput(input: any): SubjectValidationResult<UpdateSubjectInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["ข้อมูลไม่ถูกต้อง"] };
  }

  const id = Number(input.id);
  if (!id || isNaN(id)) {
    errors.push("กรุณาระบุ ID ของวิชาที่ต้องการอัปเดต");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const data: UpdateSubjectInput = { id };

  if (input.subjectCode !== undefined) data.subjectCode = String(input.subjectCode).trim();
  if (input.subjectName !== undefined) data.subjectName = String(input.subjectName).trim();
  if (input.credit !== undefined) data.credit = Number(input.credit);
  if (input.lectureHour !== undefined) data.lectureHour = Number(input.lectureHour);
  if (input.labHour !== undefined) data.labHour = Number(input.labHour);
  if (input.termYear !== undefined) data.termYear = String(input.termYear).trim();
  if (input.yearLevel !== undefined) data.yearLevel = String(input.yearLevel).trim();
  if (input.planType !== undefined) data.planType = String(input.planType).trim();
  if (input.dep !== undefined) data.dep = String(input.dep).trim();
  if (input.roomId !== undefined) data.roomId = input.roomId ? Number(input.roomId) : null;
  if (input.teacherId !== undefined) data.teacherId = input.teacherId ? Number(input.teacherId) : null;
  if (input.section !== undefined) data.section = input.section ? String(input.section).trim() : null;

  return {
    isValid: true,
    errors: [],
    data,
  };
}

export function validateSplitSubjectInput(input: any): SubjectValidationResult<SplitSubjectInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["ข้อมูลไม่ถูกต้อง"] };
  }

  const subjectId = Number(input.subjectId);
  if (!subjectId || isNaN(subjectId)) {
    errors.push("กรุณาระบุ subjectId");
  }

  if (!input.splitData || typeof input.splitData !== "object") {
    errors.push("กรุณาระบุ splitData");
  } else {
    const { part1, part2 } = input.splitData;
    if (!part1 || !part2) {
      errors.push("splitData ต้องมีทั้ง part1 และ part2");
    } else {
      if (typeof part1.partNumber !== "number" || typeof part2.partNumber !== "number") {
        errors.push("partNumber ต้องเป็นตัวเลข");
      }
      if (typeof part1.lectureHour !== "number" || typeof part1.labHour !== "number" ||
          typeof part2.lectureHour !== "number" || typeof part2.labHour !== "number") {
        errors.push("ชั่วโมงบรรยายและปฏิบัติการต้องเป็นตัวเลข");
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      subjectId,
      splitData: input.splitData,
    },
  };
}
