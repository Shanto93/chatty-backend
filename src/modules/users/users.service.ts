import prisma from "@db/prisma";
import { NotFoundError } from "@utils/errors";
import { UserProfile } from "./users.types";
import { uploadToCloudinary } from "@utils/cloudinary.utils";

export class UsersService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      avatarUrl?: string;
      statusMessage?: string;
    }
  ): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  // ---> Cloudinary avatar upload method
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ avatarUrl: string }> {
    // Directly upload file buffer to Cloudinary
    const result = await uploadToCloudinary(file, "chat-app/avatars");
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.url },
    });
    return { avatarUrl: result.url };
  }

  async getUserById(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async searchUsers(
    query: string,
    currentUserId: string
  ): Promise<UserProfile[]> {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20,
    });
    return users;
  }
}

export default new UsersService();
