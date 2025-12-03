export interface SocketUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
  attachment?: {
    type: 'IMAGE' | 'FILE';
    url: string;
    fileName?: string;
    fileSize?: number;
  };
}

export interface TypingPayload {
  roomId: string;
}

import { Socket } from 'socket.io';
