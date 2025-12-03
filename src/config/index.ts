import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/chat_app',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
