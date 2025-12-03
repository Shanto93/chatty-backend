import { ValidationError } from '@/utils/errors';
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e: ZodIssue) => {
          return `${e.path.join('.')}: ${e.message}`;
        });
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
