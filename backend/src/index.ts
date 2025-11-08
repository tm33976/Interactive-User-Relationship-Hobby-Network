import cluster from 'cluster';
import os from 'os';
import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import connectDB from './config/db'; // Make sure this is imported

// Load environment variables *at the very top*
// This ensures the primary process and workers can see it
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
  
  // --- THIS IS THE FIX ---
  // We wrap the worker startup in an async function
  // to ensure we *await* the database connection
  // before starting the server.
  
  const startWorker = async () => {
    try {
      // 1. Await the DB connection
      logger.info(`Worker ${process.pid} connecting to database...`);
      await connectDB(); 
      
      // 2. Once connected, create and start the server
      const server = http.createServer(app);
      server.listen(port, () => {
        logger.info(`Worker ${process.pid} started. Server running on http://localhost:${port}`);
      });

    } catch (error) {
      logger.error(`Worker ${process.pid} failed to start:`, error as Error);
      process.exit(1); // Exit worker if DB connection fails
    }
  };

  // Call the async startup function
  startWorker();
  // --- END OF FIX ---
}