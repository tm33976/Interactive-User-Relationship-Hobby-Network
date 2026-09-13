import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import connectDB from './config/db';

dotenv.config();

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    const server = http.createServer(app);
    server.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error as Error);
    process.exit(1);
  }
};

start();