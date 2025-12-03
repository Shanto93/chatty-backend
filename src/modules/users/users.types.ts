export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  role: string;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string;
  statusMessage?: string;
}

export interface SearchUsersQuery {
  query: string;
}
