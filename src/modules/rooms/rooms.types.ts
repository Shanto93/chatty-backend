export interface CreateRoomDTO {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface UpdateRoomDTO {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface RoomResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  avatarUrl: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  isMember?: boolean;
  isCreator?: boolean;
  _count?: {
    memberships: number;
    messages: number;
  };
}

export interface RoomMemberResponse {
  id: string;
  userId: string;
  roomId: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface AddMemberDTO {
  userId: string;
}
