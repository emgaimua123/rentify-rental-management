export interface CreateRoomInput {
  name: string;
  price: number;
  area?: number;
  type: string;
  status?: string;
}

export interface UpdateRoomInput {
  name?: string;
  price?: number;
  area?: number;
  type?: string;
  status?: string;
}

export interface RoomPreset {
  price: number;
  area?: number;
  type: string;
  status?: string;
}

export interface BulkGenerateRoomsDTO {
  prefix: string;
  startNumber: number;
  endNumber: number;
  preset: RoomPreset;
}
