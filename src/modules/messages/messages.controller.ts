import { Response, NextFunction } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import { SendMessageDTO } from "./messages.types";
import messagesService from "./messages.service";

class MessagesController {
  async sendMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: SendMessageDTO = req.body;

      const message = await messagesService.sendMessage(userId, data);

      res.status(201).json({
        status: "success",
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
      const cursor = req.query.cursor as string | undefined;

      const result = await messagesService.getMessages(
        roomId,
        userId,
        limit,
        cursor
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({
          status: "error",
          message: "Message content is required",
        });
        return;
      }

      const message = await messagesService.updateMessage(
        messageId,
        userId,
        content
      );

      res.status(200).json({
        status: "success",
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;

      await messagesService.deleteMessage(messageId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { roomId } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          status: "error",
          message: "No file uploaded",
        });
        return;
      }

      if (!roomId) {
        res.status(400).json({
          status: "error",
          message: "Room ID is required",
        });
        return;
      }

      const attachment = await messagesService.uploadAttachment(
        userId,
        roomId,
        file
      );

      res.status(200).json({
        status: "success",
        data: { attachment },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessagesController();
