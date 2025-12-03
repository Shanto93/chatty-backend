import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '@db/prisma';
import presenceService from '@redis/presence.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  role?: string;
}

export class ChatGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: No token provided'));
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        socket.userId = decoded.id;
        socket.username = decoded.username;
        socket.role = decoded.role;
        console.log(`✅ Socket authenticated: User ${decoded.username} (${decoded.id})`);
        next();
      } catch (err) {
        console.error('❌ Socket authentication failed:', err);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      const username = socket.username;
      const role = socket.role;
      console.log(`🔌 User connected: ${username} (${userId})`);
      if (userId) {
        try {
          await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
          await presenceService.setUserOnline(userId);
          this.io.emit('user:online', { userId, username });
          this.broadcastStatsUpdate();
        } catch (error) {
          console.error('Error setting user online:', error);
        }
      }
      if (role === 'ADMIN') {
        socket.join('admin-room');
        console.log(`👑 Admin ${username} joined admin room`);
      }
      socket.on('room:join', async (roomId: string) => {
        try {
          const membership = await prisma.membership.findUnique({
            where: { userId_roomId: { userId: userId!, roomId } },
          });
          if (!membership) {
            socket.emit('error', { message: 'Not a member of this room' });
            return;
          }
          socket.join(roomId);
          console.log(`📥 User ${username} joined room ${roomId}`);
          await presenceService.addUserToRoom(roomId, userId!);
          socket.to(roomId).emit('room:user-joined', {
            roomId,
            user: { id: userId, username },
          });
          await this.broadcastRoomOnlineUpdate(roomId);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });
      socket.on('room:leave', async (roomId: string) => {
        try {
          socket.leave(roomId);
          console.log(`📤 User ${username} left room ${roomId}`);
          if (userId) {
            await presenceService.removeUserFromRoom(roomId, userId);
          }
          socket.to(roomId).emit('room:user-left', {
            roomId,
            userId,
          });
          await this.broadcastRoomOnlineUpdate(roomId);
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });
      socket.on('typing:start', (roomId: string) => {
        socket.to(roomId).emit('user:typing', { userId, username, roomId });
      });
      socket.on('typing:stop', (roomId: string) => {
        socket.to(roomId).emit('user:stopped-typing', { userId, username, roomId });
      });
      socket.on('disconnect', async () => {
        console.log(`🔌 User disconnected: ${username} (${userId})`);
        if (userId) {
          try {
            await prisma.user.update({ where: { id: userId }, data: { isOnline: false } });
            await presenceService.setUserOffline(userId);
            const userRooms = await presenceService.getUserRooms(userId);
            for (const roomId of userRooms) {
              await presenceService.removeUserFromRoom(roomId, userId);
              await this.broadcastRoomOnlineUpdate(roomId);
            }
            this.io.emit('user:offline', { userId, username });
            this.broadcastStatsUpdate();
          } catch (error) {
            console.error('Error setting user offline:', error);
          }
        }
      });
    });
  }

  public emitNewMessage(roomId: string, message: any) {
    this.io.to(roomId).emit('message:new', message);
    this.broadcastStatsUpdate();
    this.broadcastRoomMessageCountUpdate(roomId);
  }
  public emitMessageUpdate(roomId: string, message: any) {
    this.io.to(roomId).emit('message:updated', message);
  }
  public emitMessageDelete(roomId: string, messageId: string) {
    this.io.to(roomId).emit('message:deleted', messageId);
    this.broadcastRoomMessageCountUpdate(roomId);
  }
  public emitRoomUpdate(roomId: string, room: any) {
    this.io.to(roomId).emit('room:updated', room);
    this.io.to('admin-room').emit('admin:room-updated', room);
  }
  public broadcastRoomCreated(room: any) {
    this.io.emit('room:created', room);
    this.io.to('admin-room').emit('admin:room-created', room);
    this.broadcastStatsUpdate();
  }
  public broadcastRoomDeleted(roomId: string) {
    this.io.emit('room:deleted', roomId);
    this.io.to('admin-room').emit('admin:room-deleted', roomId);
    this.broadcastStatsUpdate();
  }
  public async broadcastStatsUpdate() {
    try {
      const [totalUsers, totalRooms, totalMessages, onlineUserIds] = await Promise.all([
        prisma.user.count(),
        prisma.room.count(),
        prisma.message.count(),
        presenceService.getOnlineUsers(),
      ]);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const messagesToday = await prisma.message.count({ where: { createdAt: { gte: startOfDay } } });
      const stats = {
        totalUsers,
        totalRooms,
        totalMessages,
        onlineUsers: onlineUserIds.length,
        messagesToday,
      };
      this.io.to('admin-room').emit('admin:stats-updated', stats);
    } catch (error) {
      console.error('Error broadcasting stats update:', error);
    }
  }
  private async broadcastRoomOnlineUpdate(roomId: string) {
    try {
      const onlineCount = await presenceService.getRoomOnlineCount(roomId);
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          _count: { select: { memberships: true } },
        },
      });
      if (room) {
        this.io.to('admin-room').emit('admin:room-online-updated', {
          roomId,
          onlineMembers: onlineCount,
          totalMembers: room._count.memberships,
        });
      }
    } catch (error) {
      console.error('Error broadcasting room online update:', error);
    }
  }
  private async broadcastRoomMessageCountUpdate(roomId: string) {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          _count: { select: { messages: true } },
        },
      });
      if (room) {
        this.io.to('admin-room').emit('admin:room-messages-updated', {
          roomId,
          messagesCount: room._count.messages,
        });
      }
    } catch (error) {
      console.error('Error broadcasting room message count update:', error);
    }
  }
  public broadcastUserStatusChange(userId: string, isOnline: boolean) {
    this.io.to('admin-room').emit('admin:user-status-changed', { userId, isOnline });
  }

  // === JOIN/LEAVE SYSTEM MESSAGE EMITTERS ===
  public broadcastUserJoinedRoom(
    roomId: string,
    user: { userId: string; username: string; displayName: string | null }
  ) {
    const content = `${user.displayName || user.username} joined the room`;
    const systemMessage = {
      id: `sys-joined-${user.userId}-${Date.now()}`,
      type: 'SYSTEM',
      action: 'USER_JOINED',
      content,
      roomId,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
      },
      createdAt: new Date().toISOString(),
    };
    this.io.to(roomId).emit('room:user-joined-system', systemMessage);
  }
  public broadcastUserLeftRoom(
    roomId: string,
    user: { userId: string; username: string; displayName: string | null }
  ) {
    const content = `${user.displayName || user.username} left the room`;
    const systemMessage = {
      id: `sys-left-${user.userId}-${Date.now()}`,
      type: 'SYSTEM',
      action: 'USER_LEFT',
      content,
      roomId,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
      },
      createdAt: new Date().toISOString(),
    };
    this.io.to(roomId).emit('room:user-left-system', systemMessage);
  }
}

export default ChatGateway;
