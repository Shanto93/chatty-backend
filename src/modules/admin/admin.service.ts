import prisma from "@db/prisma";
import presenceService from "@redis/presence.service";
import { DashboardStats, ActiveUserInfo, RoomInfo } from "./admin.types";

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalUsers, totalRooms, totalMessages, onlineUserIds] =
      await Promise.all([
        prisma.user.count(),
        prisma.room.count(),
        prisma.message.count(),
        presenceService.getOnlineUsers(),
      ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const messagesToday = await prisma.message.count({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    return {
      totalUsers,
      totalRooms,
      totalMessages,
      onlineUsers: onlineUserIds.length,
      messagesToday,
    };
  }

  // Get ALL users (not just active ones) with online status
  async getAllUsers(): Promise<ActiveUserInfo[]> {
    const onlineUserIds = await presenceService.getOnlineUsers();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        memberships: {
          select: {
            room: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user: any) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isOnline: onlineUserIds.includes(user.id),
      rooms: user.memberships.map((m: any) => m.room),
    }));
  }

  async getRoomsList(): Promise<RoomInfo[]> {
    const rooms = await prisma.room.findMany({
      include: {
        memberships: {
          select: {
            userId: true,
          },
        },
        messages: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            memberships: true,
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const roomInfoPromises = rooms.map(async (room: any) => {
      const onlineCount = await presenceService.getRoomOnlineCount(room.id);

      return {
        id: room.id,
        name: room.name,
        slug: room.slug,
        isPrivate: room.isPrivate,
        totalMembers: room._count.memberships,
        onlineMembers: onlineCount,
        messagesCount: room._count.messages,
        lastMessageAt: room.messages[0]?.createdAt || null,
        createdById: room.createdById,
        createdAt: room.createdAt,
      };
    });

    return Promise.all(roomInfoPromises);
  }

  // Admin can delete ANY room
  async deleteRoomAsAdmin(roomId: string): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Room not found");
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    await presenceService.invalidateRoomCache(roomId);
  }

  // Admin can update ANY room
  async updateRoomAsAdmin(
    roomId: string,
    data: { name?: string; description?: string; isPrivate?: boolean }
  ): Promise<RoomInfo> {
    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/\s+/g, "-");
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.isPrivate !== undefined) {
      updateData.isPrivate = data.isPrivate;
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
      include: {
        _count: {
          select: {
            memberships: true,
            messages: true,
          },
        },
      },
    });

    const onlineCount = await presenceService.getRoomOnlineCount(roomId);

    return {
      id: room.id,
      name: room.name,
      slug: room.slug,
      isPrivate: room.isPrivate,
      totalMembers: room._count.memberships,
      onlineMembers: onlineCount,
      messagesCount: room._count.messages,
      lastMessageAt: null,
      createdById: room.createdById,
      createdAt: room.createdAt,
    };
  }
}

export default new AdminService();