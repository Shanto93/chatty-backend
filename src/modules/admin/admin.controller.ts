import { Response, NextFunction } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import adminService from "./admin.service";

export class AdminController {
  async getDashboardStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();

      res.status(200).json({
        status: "success",
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await adminService.getAllUsers();

      res.status(200).json({
        status: "success",
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomsList(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rooms = await adminService.getRoomsList();

      res.status(200).json({
        status: "success",
        data: { rooms },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          status: "error",
          message: "Room ID is required",
        });
        return;
      }

      await adminService.deleteRoomAsAdmin(roomId);

      res.status(200).json({
        status: "success",
        message: "Room deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      const data = req.body;

      if (!roomId) {
        res.status(400).json({
          status: "error",
          message: "Room ID is required",
        });
        return;
      }

      const room = await adminService.updateRoomAsAdmin(roomId, data);

      res.status(200).json({
        status: "success",
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
