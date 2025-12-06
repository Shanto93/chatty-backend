import presenceService from "@/redis-client/presence.service";
import { getChatGateway } from "@/sockets/index";
import prisma from "@db/prisma";
import { Prisma } from "@prisma/client";
import { uploadToCloudinary } from "@utils/cloudinary.utils";
import { ForbiddenError, NotFoundError } from "@utils/errors";
import {
  AttachmentData,
  MessageResponse,
  SendMessageDTO,
} from "./messages.types";

export class MessagesService {
  private readonly INITIAL_MESSAGES_LIMIT = 15;
  private readonly CACHE_LIMIT = 10;

  /**
   * SECURITY: Check if user is a member of the room
   * This is used across multiple methods to enforce access control
   */
  private async checkRoomMembership(
    userId: string,
    roomId: string
  ): Promise<void> {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError(
        "You must join this room first to access its content"
      );
    }
  }

  /**Send a new message*/
  async sendMessage(
    userId: string,
    data: SendMessageDTO
  ): Promise<MessageResponse> {
    // SECURITY: Verify membership before sending
    await this.checkRoomMembership(userId, data.roomId);

    const message = await prisma.message.create({
      data: {
        content: data.content,
        roomId: data.roomId,
        senderId: userId,
        ...(data.attachment && {
          attachment: data.attachment as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.room.update({
      where: { id: data.roomId },
      data: { updatedAt: new Date() },
    });

    const transformedMessage = this.transformMessage(message);

    // Update Redis cache with new message
    await this.updateMessageCache(data.roomId, transformedMessage);

    console.log(
      `Emitting message to room ${data.roomId}:`,
      transformedMessage.id
    );

    try {
      const chatGateway = getChatGateway();
      chatGateway.emitNewMessage(data.roomId, transformedMessage);
      console.log(`Message emitted successfully to room ${data.roomId}`);
    } catch (error) {
      console.error("Failed to emit socket event:", error);
    }

    return transformedMessage;
  }

  /**Get messages for a room with pagination*/
  async getMessages(
    roomId: string,
    userId: string,
    limit: number = 15,
    cursor?: string
  ): Promise<{
    messages: MessageResponse[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    // SECURITY FIX: Strict membership check for ALL rooms (public and private)
    await this.checkRoomMembership(userId, roomId);

    // Try to get cached messages first (only for initial load)
    if (!cursor) {
      const cachedMessages = await presenceService.getCachedMessages(roomId);
      if (cachedMessages && cachedMessages.length > 0) {
        console.log(
          `📦 Returning ${cachedMessages.length} cached messages for room ${roomId}`
        );

        const totalCount = await prisma.message.count({ where: { roomId } });
        const hasMore = totalCount > cachedMessages.length;
        const nextCursor =
          hasMore && cachedMessages.length > 0 ? cachedMessages[0].id : null;

        return {
          messages: cachedMessages,
          nextCursor,
          hasMore,
        };
      }
    }

    // Fetch messages from database
    const messages = await prisma.message.findMany({
      where: {
        roomId,
        ...(cursor && {
          createdAt: { lt: await this.getMessageCreatedAt(cursor) },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? resultMessages[resultMessages.length - 1].id
      : null;

    const transformedMessages = resultMessages.map((msg) =>
      this.transformMessage(msg)
    );

    // Cache the most recent messages (only on initial load)
    if (!cursor && transformedMessages.length > 0) {
      const messagesToCache = transformedMessages.slice(0, this.CACHE_LIMIT);
      await presenceService.cacheMessages(roomId, messagesToCache.reverse());
    }

    return {
      messages: transformedMessages.reverse(),
      nextCursor,
      hasMore,
    };
  }

  /**Get message creation timestamp by ID*/
  private async getMessageCreatedAt(messageId: string): Promise<Date> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { createdAt: true },
    });
    return message?.createdAt || new Date();
  }

  /*** Update Redis cache with new message*/
  private async updateMessageCache(
    roomId: string,
    message: MessageResponse
  ): Promise<void> {
    try {
      const cachedMessages =
        (await presenceService.getCachedMessages(roomId)) || [];

      cachedMessages.push(message);
      const updatedCache = cachedMessages.slice(-this.CACHE_LIMIT);

      await presenceService.cacheMessages(roomId, updatedCache);
      console.log(
        `Updated cache for room ${roomId}, now has ${updatedCache.length} messages`
      );
    } catch (error) {
      console.error("Failed to update message cache:", error);
    }
  }

  /**Upload attachment*/
  async uploadAttachment(
    userId: string,
    roomId: string,
    file: Express.Multer.File
  ): Promise<AttachmentData> {
    // SECURITY: Verify membership before uploading
    await this.checkRoomMembership(userId, roomId);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, "chat-app/attachments");

    // Determine file type
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
      result.format.toLowerCase()
    );

    return {
      url: result.url,
      fileName: file.originalname,
      fileSize: result.bytes,
      type: isImage ? "IMAGE" : "FILE",
    };
  }

  /*** Update a message (edit)*/
  async updateMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // SECURITY: Verify membership
    await this.checkRoomMembership(userId, message.roomId);

    if (message.senderId !== userId) {
      throw new ForbiddenError("You can only edit your own messages");
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await presenceService.invalidateRoomCache(message.roomId);

    const transformedMessage = this.transformMessage(updatedMessage);

    try {
      const chatGateway = getChatGateway();
      chatGateway.emitMessageUpdate(message.roomId, transformedMessage);
    } catch (error) {
      console.error("Failed to emit message update event:", error);
    }

    return transformedMessage;
  }

  /*** Delete a message*/
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // SECURITY: Verify membership
    await this.checkRoomMembership(userId, message.roomId);

    if (message.senderId !== userId) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId: message.roomId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "CREATOR" && membership.role !== "ADMIN")
      ) {
        throw new ForbiddenError(
          "You do not have permission to delete this message"
        );
      }
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    await presenceService.invalidateRoomCache(message.roomId);

    try {
      const chatGateway = getChatGateway();
      chatGateway.emitMessageDelete(message.roomId, messageId);
    } catch (error) {
      console.error("Failed to emit message delete event:", error);
    }
  }

  /*** Transform Prisma message to MessageResponse*/
  private transformMessage(message: any): MessageResponse {
    return {
      id: message.id,
      content: message.content,
      roomId: message.roomId,
      senderId: message.senderId,
      attachment: message.attachment
        ? (message.attachment as AttachmentData)
        : null,
      sender: message.sender,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export default new MessagesService();
