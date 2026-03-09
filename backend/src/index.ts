import cluster from 'cluster';
import os from 'os';
import http from 'http';
import axios from 'axios';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import connectDB from './config/db'; 
dotenv.config();

const port = process.env.PORT || 5000;
const PING_INTERVAL = 14 * 60 * 1000;

// ✅ keepAlive defined at top level
function keepAlive() {
  const selfUrl = `${process.env.BACKEND_URL}/api/health`;
  setInterval(async () => {
    try {
      console.log('📡 Keep-Alive: Pinging self to prevent Render sleep...');
      const response = await axios.get(selfUrl);
      console.log(`✅ Keep-Alive Status: ${response.status}`);
    } catch (error: any) {
      console.error('⚠️ Keep-Alive Failed:', error?.message || 'Unknown error');
    }
  }, PING_INTERVAL);
}

const startWorker = async () => {
  try {
    logger.info(`Worker ${process.pid} connecting to database...`);
    await connectDB(); 
    
    const server = http.createServer(app);
    server.listen(port, () => {
      logger.info(`Worker ${process.pid} started. Server running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error(`Worker ${process.pid} failed to start:`, error as Error);
    process.exit(1); 
  }
};

if (process.env.NODE_ENV === 'production' && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking server for ${numCPUs} CPUs`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    logger.warn(`Worker ${worker.process.pid} died. Forking a new worker...`);
    cluster.fork();
  });

  // ✅ Only primary pings — runs once, not on every worker
  if (process.env.BACKEND_URL) {
    keepAlive();
  }

} else {
  startWorker();
}