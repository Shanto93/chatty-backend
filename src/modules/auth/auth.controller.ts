import { Response, NextFunction } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import authService from "./auth.service";
import { RegisterDTO, LoginDTO } from "./auth.types";

export class AuthController {
  async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: RegisterDTO = req.body;
      const result = await authService.register(data);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        status: "success",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: LoginDTO = req.body;
      const result = await authService.login(data);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await authService.refresh(refreshToken);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken");

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).json({
        status: "success",
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ADD THIS NEW METHOD
  async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();