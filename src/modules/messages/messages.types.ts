export interface SendMessageDTO {
  roomId: string;
  content: string;
  attachment?: AttachmentData;
}

export interface AttachmentData {
  type: string;
  url: string;
  fileName: string | null;
  fileSize: number | null;
}

export interface MessageResponse {
  id: string;
  content: string;
  roomId: string;
  senderId: string;
  attachment: AttachmentData | null;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMessagesQuery {
  limit?: number;
  cursor?: string;
}
