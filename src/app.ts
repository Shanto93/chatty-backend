import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import roomsRoutes from "./modules/rooms/rooms.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import adminRoutes from "./modules/admin/admin.routes";

const createApp = () => {
  const app = express();

  const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposedHeaders: ["Set-Cookie"],
    })
  );

  app.options("*", cors());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: "Too many requests from this IP, please try again later.",
  });

  app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Hello World!" });
  });

  app.use("/api/", limiter);

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/rooms", roomsRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
