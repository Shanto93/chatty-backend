import { config } from './index';

export const databaseConfig = {
  url: config.database.url,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
