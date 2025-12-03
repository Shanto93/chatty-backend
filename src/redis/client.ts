import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (err:any) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis ready to accept commands');
});

redisClient.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Connect to Redis
redisClient.connect().catch(console.error);

export default redisClient;
