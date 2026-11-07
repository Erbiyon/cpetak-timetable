import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { RoomService } from "@/features/rooms/services/room.service";
import { validateCreateRoomInput } from "@/features/rooms/validations";

export async function GET() {
  try {
    const rooms = await RoomService.getRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("ผิดพลาดในการดึงข้อมูลห้อง:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้อง" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const validation = validateCreateRoomInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    const { roomCode, roomType, roomCate } = validation.data;

    const existing = await RoomService.findDuplicate(roomCode, roomType);
    if (existing) {
      return NextResponse.json(
        { error: `ห้อง ${roomCode} ในอาคาร ${roomType} มีอยู่แล้ว` },
        { status: 409 },
      );
    }

    const room = await RoomService.createRoom({
      roomCode,
      roomType,
      roomCate,
    });

    console.log("สร้างห้อง:", room);

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("ผิดพลาดในการสร้างห้อง:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างห้อง" },
      { status: 500 },
    );
  }
}
