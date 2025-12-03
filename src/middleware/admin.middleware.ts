import type { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { ForbiddenError } from "@/utils/errors";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new ForbiddenError("Authentication required");
  }

  if (req.user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  next();
};
