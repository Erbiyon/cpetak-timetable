export interface RoomItem {
  id: number;
  roomCode: string;
  roomType: string;
  roomCate: string | null;
}

export interface CreateRoomInput {
  roomCode: string;
  roomType: string;
  roomCate?: string | null;
}

export interface UpdateRoomInput {
  roomCode: string;
  roomType: string;
  roomCate?: string | null;
}
