export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginDTO {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    statusMessage: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}
