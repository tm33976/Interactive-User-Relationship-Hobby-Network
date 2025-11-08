import cluster from 'cluster';
import os from 'os';
import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import connectDB from './config/db'; 
dotenv.config();

const port = process.env.PORT || 5000;

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking server for ${numCPUs} CPUs`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Forking a new worker...`);
    cluster.fork();
  });

} else {
    const startWorker = async () => {
    try {
      // 1. Await the DB connection
      logger.info(`Worker ${process.pid} connecting to database...`);
      await connectDB(); 
      
      //Once connected, create and start the server
      const server = http.createServer(app);
      server.listen(port, () => {
        logger.info(`Worker ${process.pid} started. Server running on http://localhost:${port}`);
      });

    } catch (error) {
      logger.error(`Worker ${process.pid} failed to start:`, error as Error);
      process.exit(1); 
    }
  };

  startWorker();

}