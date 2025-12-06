// import { createClient } from 'redis';

// const redisClient = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379',
// });

// redisClient.on('connect', () => {
//   console.log('Redis connected successfully');
// });

// redisClient.on('error', (err:any) => {
//   console.error('Redis Client Error:', err);
// });

// redisClient.on('ready', () => {
//   console.log('Redis ready to accept commands');
// });

// redisClient.on('reconnecting', () => {
//   console.log('Redis reconnecting...');
// });

// // Connect to Redis
// redisClient.connect().catch(console.error);

// export default redisClient;

// src/redis-client/client.ts
import { createClient, type RedisClientType } from "redis";
import config from "@config/index"; // uses your config/index.ts

const redisUrl = process.env.REDIS_URL || config.redis.url;

const redisClient: RedisClientType = createClient({
  url: redisUrl,
});

redisClient.on("connect", () => {
  console.log("Redis connected (low-level connect event)");
});

redisClient.on("error", (err: any) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("ready", () => {
  console.log("Redis ready to accept commands");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

/**
 * Explicit Redis connect helper.
 * Call this once during server startup.
 */
export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

/**
 * Explicit Redis shutdown helper.
 * Call this during graceful shutdown.
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

export default redisClient;
