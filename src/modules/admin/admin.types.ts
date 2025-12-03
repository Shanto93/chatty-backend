export interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  onlineUsers: number;
  messagesToday: number;
}

export interface ActiveUserInfo {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  rooms: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface RoomInfo {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  totalMembers: number;
  onlineMembers: number;
  messagesCount: number;
  lastMessageAt: Date | null;
  createdById: string;
  createdAt: Date;
}
