// import path from "path";
// import express, { type Request, type Response } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import { createServer } from "http";
// import prisma from "@db/prisma";
// import { errorHandler } from "@middleware/error.middleware";
// import redisClient from "@redis/client";

// import authRoutes from "./modules/auth/auth.routes";
// import usersRoutes from "./modules/users/users.routes";
// import roomsRoutes from "./modules/rooms/rooms.routes";
// import messagesRoutes from "./modules/messages/messages.routes";
// import adminRoutes from "./modules/admin/admin.routes";
// import { initializeSocketIO } from "./sockets/index";

// const app = express();
// const httpServer = createServer(app);

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://localhost:3000",
//   "https://localhost:3001",
//   "http://localhost:3001",
//   "https://chatty-frontend-nu.vercel.app",
//   "http://chatty-frontend-nu.vercel.app",
// ];

// if (process.env.CLIENT_URL) {
//   allowedOrigins.push(process.env.CLIENT_URL);
// }

// const corsOptions = {
//   origin: function (
//     origin: string | undefined,
//     callback: (err: Error | null, allow?: boolean) => void
//   ) {
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.warn(`Blocked by CORS: ${origin}`);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//   ],
//   exposedHeaders: ["Authorization"],
//   maxAge: 86400, // 24 hours
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));

// // Handle preflight requests explicitly (Express v5 compatible)
// app.options(/(.*)/, cors(corsOptions));

// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//     crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Health check
// app.get("/health", (_req: Request, res: Response) => {
//   res.json({ status: "ok", message: "Server is running" });
// });

// // API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", usersRoutes);
// app.use("/api/rooms", roomsRoutes);
// app.use("/api/messages", messagesRoutes);
// app.use("/api/admin", adminRoutes);

// // Error handler (must be last)
// app.use(errorHandler);

// // Initialize Socket.IO with CORS
// const io = initializeSocketIO(httpServer);
// app.set("io", io);

// async function startServer() {
//   try {
//     // Test database connection
//     await prisma.$connect();
//     console.log("Database connected");

//     // Test Redis connection
//     await redisClient.ping();
//     console.log("Redis connected successfully");

//     const PORT = process.env.PORT || 5001;
//     httpServer.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//       console.log(`Socket.IO listening on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//     process.exit(1);
//   }
// }

// // Handle graceful shutdown
// process.on("SIGINT", async () => {
//   console.log("\nShutting down gracefully...");
//   await prisma.$disconnect();
//   await redisClient.quit();
//   process.exit(0);
// });

// startServer();


// src/server.ts
import path from "path";
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import prisma from "@db/prisma";
import { errorHandler } from "@middleware/error.middleware";
import redisClient, { connectRedis, disconnectRedis } from "@redis/client";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import roomsRoutes from "./modules/rooms/rooms.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { initializeSocketIO } from "./sockets/index";

const app = express();
const httpServer = createServer(app);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://localhost:3001",
  "http://localhost:3001",
  "https://chatty-frontend-nu.vercel.app",
  "http://chatty-frontend-nu.vercel.app",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Authorization"],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly (Express v5 compatible)
app.options(/(.*)/, cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/admin", adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO with CORS
const io = initializeSocketIO(httpServer);
app.set("io", io);

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connected");

    // Test Redis connection (connect + ping)
    await connectRedis();
    await redisClient.ping();
    console.log("Redis connected successfully");

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  await disconnectRedis();
  process.exit(0);
});

startServer();
