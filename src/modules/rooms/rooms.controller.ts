import { Response, NextFunction } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import roomsService from "./rooms.service";
import { CreateRoomDTO, UpdateRoomDTO } from "./rooms.types";

class RoomsController {
  async createRoom(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateRoomDTO = req.body;
      const room = await roomsService.createRoom(userId, data);

      res.status(201).json({
        status: "success",
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;

      const room = await roomsService.getRoomById(roomId, userId);

      res.status(200).json({
        status: "success",
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async getJoinedRooms(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const rooms = await roomsService.getJoinedRooms(userId);

      res.status(200).json({
        status: "success",
        data: { rooms },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicRooms(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const rooms = await roomsService.getPublicRooms(userId);

      res.status(200).json({
        status: "success",
        data: { rooms },
      });
    } catch (error) {
      next(error);
    }
  }

  async searchRooms(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          status: "error",
          message: "Search query is required",
        });
        return;
      }

      const rooms = await roomsService.searchRooms(query, userId);

      res.status(200).json({
        status: "success",
        data: { rooms },
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
      const userId = req.user!.id;
      const { roomId } = req.params;
      const data: UpdateRoomDTO = req.body;

      const room = await roomsService.updateRoom(roomId, userId, data);

      res.status(200).json({
        status: "success",
        data: { room },
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
      const userId = req.user!.id;
      const { roomId } = req.params;

      await roomsService.deleteRoom(roomId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async joinRoom(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;

      await roomsService.joinRoom(roomId, userId);

      res.status(200).json({
        status: "success",
        message: "Successfully joined the room",
      });
    } catch (error) {
      next(error);
    }
  }

  async leaveRoom(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;

      await roomsService.leaveRoom(roomId, userId);

      res.status(200).json({
        status: "success",
        message: "Successfully left the room",
      });
    } catch (error) {
      next(error);
    }
  }

  async addMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;
      const { userId: targetUserId } = req.body;

      await roomsService.addMember(roomId, userId, targetUserId);

      res.status(200).json({
        status: "success",
        message: "Member added successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId, memberId } = req.params;

      await roomsService.removeMember(roomId, userId, memberId);

      res.status(200).json({
        status: "success",
        message: "Member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomMembers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;

      const members = await roomsService.getRoomMembers(roomId, userId);

      res.status(200).json({
        status: "success",
        data: { members },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId, memberId } = req.params;
      const { role } = req.body;

      if (!role || !["ADMIN", "MEMBER"].includes(role)) {
        res.status(400).json({
          status: "error",
          message: "Invalid role. Must be ADMIN or MEMBER",
        });
        return;
      }

      await roomsService.updateMemberRole(roomId, userId, memberId, role);

      res.status(200).json({
        status: "success",
        message: "Member role updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoomsController();