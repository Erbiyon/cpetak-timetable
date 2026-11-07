import { CreateRoomInput, UpdateRoomInput } from "./types";

export interface RoomValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

export function validateCreateRoomInput(input: any): RoomValidationResult<CreateRoomInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["ข้อมูลไม่ถูกต้อง"] };
  }

  const roomCode = typeof input.roomCode === "string" ? input.roomCode.trim() : "";
  const roomType = typeof input.roomType === "string" ? input.roomType.trim() : "";
  const roomCate = input.roomCate !== undefined && input.roomCate !== null ? String(input.roomCate).trim() : null;

  if (!roomCode || !roomType) {
    errors.push("roomCode และ roomType เป็นข้อมูลที่จำเป็น");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      roomCode,
      roomType,
      roomCate: roomCate || null,
    },
  };
}

export function validateUpdateRoomInput(input: any): RoomValidationResult<UpdateRoomInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["ข้อมูลไม่ถูกต้อง"] };
  }

  const roomCode = typeof input.roomCode === "string" ? input.roomCode.trim() : "";
  const roomType = typeof input.roomType === "string" ? input.roomType.trim() : "";
  const roomCate = input.roomCate !== undefined && input.roomCate !== null ? String(input.roomCate).trim() : null;

  if (!roomCode || !roomType) {
    errors.push("roomCode และ roomType เป็นข้อมูลที่จำเป็น");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      roomCode,
      roomType,
      roomCate: roomCate || null,
    },
  };
}
