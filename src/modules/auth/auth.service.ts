import prisma from "@db/prisma";
import { hashPassword, comparePassword } from "@utils/password.utils";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@utils/jwt.utils";
import { ConflictError, UnauthorizedError } from "@utils/errors";
import { RegisterDTO, LoginDTO, AuthResponse } from "./auth.types";

export class AuthService {
  /*** Register a new user*/
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new ConflictError("Email or username already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        displayName: data.displayName || data.username,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          data.displayName || data.username
        )}&background=random`,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /*** Login user*/
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.emailOrUsername },
          { username: data.emailOrUsername },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /*** Refresh access token*/
  async refresh(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Fetch fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      const newRefreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  /*** Logout user*/
  async logout(refreshToken: string): Promise<void> {
    try {
      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.user.update({
          where: { id: payload.id },
          data: { isOnline: false },
        });
      }
    } catch (error) {
      // Silent error handling
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export default new AuthService();
