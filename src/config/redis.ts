import { config } from './index';

export const redisConfig = {
  url: config.redis.url,
  options: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  },
};
