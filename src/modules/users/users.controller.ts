import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth.middleware';
import usersService from './users.service';
import { UpdateProfileDTO } from './users.types';

export class UsersController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user!.id;
      const profile = await usersService.getProfile(userId);
      res.status(200).json({
        status: 'success',
        data: { user: profile },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: UpdateProfileDTO = req.body;
      const profile = await usersService.updateProfile(userId, data);
      res.status(200).json({
        status: 'success',
        data: { user: profile },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const file = req.file;
    if (!file) {
      res.status(400).json({ status: 'error', message: 'No file provided' });
      return;
    }
    const result = await usersService.uploadAvatar(userId, file);

    // Emit avatar-updated event via socket.io
    const io = req.app.get('io');
    io.emit('avatar-updated', { userId, avatarUrl: result.avatarUrl });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      const currentUserId = req.user!.id;
      if (!query) {
        res.status(400).json({
          status: 'error',
          message: 'Search query is required',
        });
        return;
      }
      const users = await usersService.searchUsers(query, currentUserId);
      res.status(200).json({
        status: 'success',
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();