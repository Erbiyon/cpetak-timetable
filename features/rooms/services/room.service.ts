import { prisma } from "@/lib/prisma";
import { CreateRoomInput, RoomItem, UpdateRoomInput } from "../types";

export class RoomService {
  /**
   * Retrieves all rooms ordered by roomCode ascending.
   */
  static async getRooms(): Promise<RoomItem[]> {
    return prisma.room_tb.findMany({
      select: {
        id: true,
        roomCode: true,
        roomType: true,
        roomCate: true,
      },
      orderBy: {
        roomCode: "asc",
      },
    });
  }

  /**
   * Finds a room by its numeric ID.
   */
  static async getRoomById(id: number): Promise<RoomItem | null> {
    return prisma.room_tb.findUnique({
      where: { id },
      select: {
        id: true,
        roomCode: true,
        roomType: true,
        roomCate: true,
      },
    });
  }

  /**
   * Finds a room by its roomCode.
   */
  static async getRoomByCode(roomCode: string): Promise<RoomItem | null> {
    return prisma.room_tb.findFirst({
      where: {
        roomCode,
      },
    });
  }

  /**
   * Checks if a room already exists with the given roomCode and roomType.
   */
  static async findDuplicate(roomCode: string, roomType: string, excludeId?: number) {
    const existing = await prisma.room_tb.findFirst({
      where: {
        roomCode: roomCode.trim(),
        roomType: roomType.trim(),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return existing;
  }

  /**
   * Creates a new room.
   */
  static async createRoom(input: CreateRoomInput) {
    return prisma.room_tb.create({
      data: {
        roomCode: input.roomCode.trim(),
        roomType: input.roomType.trim(),
        roomCate: input.roomCate || null,
      },
    });
  }

  /**
   * Updates an existing room by numeric ID.
   */
  static async updateRoom(id: number, input: UpdateRoomInput) {
    return prisma.room_tb.update({
      where: { id },
      data: {
        roomCode: input.roomCode.trim(),
        roomType: input.roomType.trim(),
        roomCate: input.roomCate || null,
      },
    });
  }

  /**
   * Deletes a room by numeric ID.
   */
  static async deleteRoom(id: number) {
    return prisma.room_tb.delete({
      where: { id },
    });
  }
}
