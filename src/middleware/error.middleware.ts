import { AppError } from '@/utils/errors';
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(process.env.NODE_ENV === 'production' && { stack: error.stack }),
    });
    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'production' && { 
      stack: error.stack,
      details: error.message 
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};
