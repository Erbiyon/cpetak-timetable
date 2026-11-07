import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCreateRoomInput, validateUpdateRoomInput } from "@/features/rooms/validations";
import { RoomService } from "@/features/rooms/services/room.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room_tb: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Room Validations", () => {
  it("should validate valid create room input", () => {
    const input = {
      roomCode: "  LAB-01  ",
      roomType: "  อาคาร 1  ",
      roomCate: "  ปฏิบัติการ  ",
    };
    const result = validateCreateRoomInput(input);
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      roomCode: "LAB-01",
      roomType: "อาคาร 1",
      roomCate: "ปฏิบัติการ",
    });
  });

  it("should fail create validation when required fields are missing", () => {
    const res1 = validateCreateRoomInput({});
    expect(res1.isValid).toBe(false);
    expect(res1.errors).toContain("roomCode และ roomType เป็นข้อมูลที่จำเป็น");

    const res2 = validateCreateRoomInput({ roomCode: "101" });
    expect(res2.isValid).toBe(false);

    const res3 = validateCreateRoomInput({ roomType: "อาคาร 1" });
    expect(res3.isValid).toBe(false);
  });

  it("should handle null or optional roomCate", () => {
    const result = validateCreateRoomInput({
      roomCode: "101",
      roomType: "อาคาร 1",
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.roomCate).toBeNull();
  });

  it("should validate update room input correctly", () => {
    const result = validateUpdateRoomInput({
      roomCode: "102",
      roomType: "อาคาร 2",
      roomCate: null,
    });
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      roomCode: "102",
      roomType: "อาคาร 2",
      roomCate: null,
    });
  });
});

describe("RoomService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRooms should query room_tb ordered by roomCode asc", async () => {
    const mockRooms = [
      { id: 1, roomCode: "101", roomType: "อาคาร 1", roomCate: null },
      { id: 2, roomCode: "102", roomType: "อาคาร 1", roomCate: "Lecture" },
    ];
    vi.mocked(prisma.room_tb.findMany).mockResolvedValue(mockRooms as any);

    const rooms = await RoomService.getRooms();
    expect(rooms).toEqual(mockRooms);
    expect(prisma.room_tb.findMany).toHaveBeenCalledWith({
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
  });

  it("getRoomById should query room_tb with id", async () => {
    const mockRoom = { id: 1, roomCode: "101", roomType: "อาคาร 1", roomCate: null };
    vi.mocked(prisma.room_tb.findUnique).mockResolvedValue(mockRoom as any);

    const room = await RoomService.getRoomById(1);
    expect(room).toEqual(mockRoom);
    expect(prisma.room_tb.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        roomCode: true,
        roomType: true,
        roomCate: true,
      },
    });
  });

  it("getRoomByCode should query room_tb by roomCode", async () => {
    const mockRoom = { id: 1, roomCode: "101", roomType: "อาคาร 1", roomCate: null };
    vi.mocked(prisma.room_tb.findFirst).mockResolvedValue(mockRoom as any);

    const room = await RoomService.getRoomByCode("101");
    expect(room).toEqual(mockRoom);
    expect(prisma.room_tb.findFirst).toHaveBeenCalledWith({
      where: { roomCode: "101" },
    });
  });

  it("findDuplicate should find matching room by code and type", async () => {
    vi.mocked(prisma.room_tb.findFirst).mockResolvedValue({ id: 10 } as any);

    const result = await RoomService.findDuplicate("101", "อาคาร 1");
    expect(result).toBeDefined();
    expect(prisma.room_tb.findFirst).toHaveBeenCalledWith({
      where: {
        roomCode: "101",
        roomType: "อาคาร 1",
      },
    });
  });

  it("createRoom should trim inputs and call prisma create", async () => {
    const created = { id: 1, roomCode: "101", roomType: "อาคาร 1", roomCate: "Lab" };
    vi.mocked(prisma.room_tb.create).mockResolvedValue(created as any);

    const result = await RoomService.createRoom({
      roomCode: "  101  ",
      roomType: "  อาคาร 1  ",
      roomCate: "Lab",
    });

    expect(result).toEqual(created);
    expect(prisma.room_tb.create).toHaveBeenCalledWith({
      data: {
        roomCode: "101",
        roomType: "อาคาร 1",
        roomCate: "Lab",
      },
    });
  });

  it("updateRoom should trim inputs and call prisma update", async () => {
    const updated = { id: 1, roomCode: "101-B", roomType: "อาคาร 2", roomCate: null };
    vi.mocked(prisma.room_tb.update).mockResolvedValue(updated as any);

    const result = await RoomService.updateRoom(1, {
      roomCode: "  101-B  ",
      roomType: "  อาคาร 2  ",
      roomCate: null,
    });

    expect(result).toEqual(updated);
    expect(prisma.room_tb.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        roomCode: "101-B",
        roomType: "อาคาร 2",
        roomCate: null,
      },
    });
  });

  it("deleteRoom should call prisma delete with numeric id", async () => {
    const deleted = { id: 1, roomCode: "101", roomType: "อาคาร 1", roomCate: null };
    vi.mocked(prisma.room_tb.delete).mockResolvedValue(deleted as any);

    const result = await RoomService.deleteRoom(1);
    expect(result).toEqual(deleted);
    expect(prisma.room_tb.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
