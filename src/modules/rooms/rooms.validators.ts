import { z } from "zod";

export const createRoomSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Room name is required")
      .max(100, "Room name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    isPrivate: z.boolean().optional().default(false),
  }),
});

export const updateRoomSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPrivate: z.boolean().optional(),
  }),
});

export const getRoomByIdSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
  }),
});

export const joinRoomSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
  }),
});

export const leaveRoomSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
  }),
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    roomId: z.string().min(1, "Room ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
  }),
});

export const searchRoomsSchema = z.object({
  query: z.object({
    query: z.string().min(2, "Search query must be at least 2 characters"),
  }),
});
