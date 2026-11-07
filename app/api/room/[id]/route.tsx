import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { RoomService } from "@/features/rooms/services/room.service";
import { validateUpdateRoomInput } from "@/features/rooms/validations";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  const params = await context.params;
  try {
    const numId = Number(params.id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const deleted = await RoomService.deleteRoom(numId);

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ไม่พบห้องหรือเกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  const params = await context.params;
  const { id } = params;
  try {
    const body = await request.json();
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const validation = validateUpdateRoomInput(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    const { roomCode, roomType, roomCate } = validation.data;

    const updatedRoom = await RoomService.updateRoom(roomId, {
      roomCode,
      roomType,
      roomCate,
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("ผิดพลาดในการอัปเดตห้อง:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตห้อง" },
      { status: 500 },
    );
  }
}
