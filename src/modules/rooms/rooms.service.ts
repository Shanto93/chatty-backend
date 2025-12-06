import presenceService from "@/redis-client/presence.service";
import { getChatGateway } from "@/sockets/index";
import prisma from "@db/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "@utils/errors";
import { CreateRoomDTO, RoomResponse, UpdateRoomDTO } from "./rooms.types";

export class RoomsService {
  /*** Create a new room*/
  async createRoom(userId: string, data: CreateRoomDTO): Promise<RoomResponse> {
    const slug = data.name.toLowerCase().replace(/\s+/g, "-");

    // Check if room with this slug already exists
    const existingRoom = await prisma.room.findUnique({
      where: { slug },
    });

    if (existingRoom) {
      throw new ConflictError("A room with this name already exists");
    }

    // Create room with creator as first member
    const room = await prisma.room.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        isPrivate: data.isPrivate ?? false,
        createdById: userId,
        memberships: {
          create: {
            userId,
            role: "CREATOR",
          },
        },
      },
      include: {
        _count: {
          select: {
            memberships: true,
            messages: true,
          },
        },
      },
    });

    // Emit socket event for new room (only to public rooms)
    if (!room.isPrivate) {
      try {
        const chatGateway = getChatGateway();
        chatGateway.broadcastRoomCreated(room);
      } catch (error) {
        console.error("Failed to emit room created event:", error);
      }
    }

    return {
      ...room,
      isMember: true,
      isCreator: true,
    };
  }

  /*** Get room by ID*/
  async getRoomById(roomId: string, userId: string): Promise<RoomResponse> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: {
          where: { userId },
        },
        _count: {
          select: {
            memberships: true,
            messages: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    const membership = room.memberships[0];
    const isMember = !!membership;
    const isCreator = membership?.role === "CREATOR";

    // Check access for private rooms
    if (room.isPrivate && !isMember) {
      throw new ForbiddenError("You do not have access to this private room");
    }

    return {
      id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      isPrivate: room.isPrivate,
      avatarUrl: room.avatarUrl,
      createdById: room.createdById,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      isMember,
      isCreator,
      _count: room._count,
    };
  }

  /*** Get all rooms the user has joined*/
  async getJoinedRooms(userId: string): Promise<RoomResponse[]> {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            _count: {
              select: {
                memberships: true,
                messages: true,
              },
            },
          },
        },
      },
      orderBy: {
        room: {
          updatedAt: "desc",
        },
      },
    });

    return memberships.map((membership) => ({
      ...membership.room,
      isMember: true,
      isCreator: membership.role === "CREATOR",
    }));
  }

  /*** Get all public rooms*/
  async getPublicRooms(userId: string): Promise<RoomResponse[]> {
    const rooms = await prisma.room.findMany({
      where: {
        isPrivate: false,
      },
      include: {
        memberships: {
          where: { userId },
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
      take: 50, // Limit to 50 public rooms
    });

    return rooms.map((room) => {
      const membership = room.memberships[0];
      return {
        id: room.id,
        name: room.name,
        slug: room.slug,
        description: room.description,
        isPrivate: room.isPrivate,
        avatarUrl: room.avatarUrl,
        createdById: room.createdById,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        isMember: !!membership,
        isCreator: membership?.role === "CREATOR",
        _count: room._count,
      };
    });
  }

  /*** Search rooms by name or description*/
  async searchRooms(query: string, userId: string): Promise<RoomResponse[]> {
    const searchTerm = query.toLowerCase().trim();

    if (searchTerm.length < 2) {
      return [];
    }

    const rooms = await prisma.room.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            ],
          },
          {
            OR: [
              { isPrivate: false },
              {
                memberships: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        memberships: {
          where: { userId },
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
      take: 20,
    });

    return rooms.map((room) => {
      const membership = room.memberships[0];
      return {
        id: room.id,
        name: room.name,
        slug: room.slug,
        description: room.description,
        isPrivate: room.isPrivate,
        avatarUrl: room.avatarUrl,
        createdById: room.createdById,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        isMember: !!membership,
        isCreator: membership?.role === "CREATOR",
        _count: room._count,
      };
    });
  }

  /*** Update room details*/
  async updateRoom(
    roomId: string,
    userId: string,
    data: UpdateRoomDTO
  ): Promise<RoomResponse> {
    // Check if user has permission to update
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "CREATOR" && membership.role !== "ADMIN")
    ) {
      throw new ForbiddenError(
        "You do not have permission to update this room"
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/\s+/g, "-");

      // Check if new slug is already taken
      const existingRoom = await prisma.room.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: roomId },
        },
      });

      if (existingRoom) {
        throw new ConflictError("A room with this name already exists");
      }
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.isPrivate !== undefined) {
      updateData.isPrivate = data.isPrivate;
    }

    // Update the room
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

    // Emit socket event for room update
    try {
      const chatGateway = getChatGateway();
      chatGateway.emitRoomUpdate(roomId, room);
    } catch (error) {
      console.error("Failed to emit room update event:", error);
    }

    return {
      ...room,
      isMember: true,
      isCreator: membership.role === "CREATOR",
    };
  }

  /*** Delete a room*/
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    // Check if user is the creator
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!membership || membership.role !== "CREATOR") {
      throw new ForbiddenError("Only the room creator can delete the room");
    }

    // Delete the room (cascade will delete memberships and messages)
    await prisma.room.delete({
      where: { id: roomId },
    });

    // Clear room cache
    await presenceService.invalidateRoomCache(roomId);

    // Emit socket event for room deletion
    try {
      const chatGateway = getChatGateway();
      chatGateway.broadcastRoomDeleted(roomId);
    } catch (error) {
      console.error("Failed to emit room deleted event:", error);
    }
  }

  async joinRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError("Room not found");
    if (room.isPrivate)
      throw new ForbiddenError(
        "Cannot join a private room without an invitation"
      );
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (existingMembership)
      throw new ConflictError("You are already a member of this room");

    await prisma.membership.create({
      data: { userId, roomId, role: "MEMBER" },
    });
    await prisma.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });
    // SEND SYSTEM JOIN MESSAGE
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true },
    });
    if (user) {
      try {
        const chatGateway = getChatGateway();
        chatGateway.broadcastUserJoinedRoom(roomId, {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
        });
      } catch (error) {
        console.error("Failed to emit user joined event:", error);
      }
    }
  }

  /*** Leave a room*/
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (!membership)
      throw new NotFoundError("You are not a member of this room");
    if (membership.role === "CREATOR")
      throw new ForbiddenError(
        "Room creator cannot leave the room. Delete the room instead."
      );
    // SEND SYSTEM LEAVE MESSAGE
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true },
    });
    await prisma.membership.delete({
      where: { userId_roomId: { userId, roomId } },
    });
    await presenceService.removeUserFromRoom(roomId, userId);
    if (user) {
      try {
        const chatGateway = getChatGateway();
        chatGateway.broadcastUserLeftRoom(roomId, {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
        });
      } catch (error) {
        console.error("Failed to emit user left event:", error);
      }
    }
  }

  /*** Add a member to a room (invite)*/
  async addMember(
    roomId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    // Check if requester has permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "CREATOR" && membership.role !== "ADMIN")
    ) {
      throw new ForbiddenError("You do not have permission to add members");
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // Check if target user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictError("User is already a member of this room");
    }

    // Add member
    await prisma.membership.create({
      data: {
        userId: targetUserId,
        roomId,
        role: "MEMBER",
      },
    });

    // Update room's updatedAt timestamp
    await prisma.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Remove a member from a room
   */
  async removeMember(
    roomId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    // Check if requester has permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "CREATOR" && membership.role !== "ADMIN")
    ) {
      throw new ForbiddenError("You do not have permission to remove members");
    }

    // Check if target user is a member
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("User is not a member of this room");
    }

    // Cannot remove the creator
    if (targetMembership.role === "CREATOR") {
      throw new ForbiddenError("Cannot remove the room creator");
    }

    // Admin cannot remove another admin unless requester is creator
    if (targetMembership.role === "ADMIN" && membership.role !== "CREATOR") {
      throw new ForbiddenError("Only the creator can remove admins");
    }

    // Remove membership
    await prisma.membership.delete({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
    });

    // Remove user from room presence
    await presenceService.removeUserFromRoom(roomId, targetUserId);
  }

  /*** Get room members*/
  async getRoomMembers(roomId: string, userId: string) {
    // Check if user has access to the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    const isMember = room.memberships.length > 0;

    if (room.isPrivate && !isMember) {
      throw new ForbiddenError("You do not have access to this private room");
    }

    // Get all members
    const members = await prisma.membership.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            statusMessage: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // CREATOR first, then ADMIN, then MEMBER
        { joinedAt: "asc" },
      ],
    });

    return members.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      roomId: membership.roomId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user,
    }));
  }

  /*** Update member role (promote/demote)*/
  async updateMemberRole(
    roomId: string,
    userId: string,
    targetUserId: string,
    newRole: "ADMIN" | "MEMBER"
  ): Promise<void> {
    // Check if requester is the creator
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!membership || membership.role !== "CREATOR") {
      throw new ForbiddenError("Only the room creator can change member roles");
    }

    // Check if target user is a member
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("User is not a member of this room");
    }

    // Cannot change creator's role
    if (targetMembership.role === "CREATOR") {
      throw new ForbiddenError("Cannot change the creator's role");
    }

    // Update role
    await prisma.membership.update({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
      data: {
        role: newRole,
      },
    });
  }
}

export default new RoomsService();
