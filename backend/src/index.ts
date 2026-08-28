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
  // os.cpus() reports the host's cores, not this container's share. On a small
  // instance that means forking eight-plus processes into half a gigabyte,
  // where they get OOM-killed and reforked in a loop. Default to one worker
  // and let WEB_CONCURRENCY raise it on a bigger plan.
  const numWorkers = Math.max(1, Number(process.env.WEB_CONCURRENCY) || 1);
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking ${numWorkers} worker(s) (host reports ${os.cpus().length} CPUs)`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // A worker that dies instantly (bad DB URI, OOM) would otherwise be reforked
  // as fast as the loop runs. Back off, and give up rather than spin forever.
  const RESTART_WINDOW_MS = 60_000;
  const MAX_RESTARTS = 5;
  let restarts: number[] = [];

  cluster.on('exit', (worker, code, signal) => {
    const now = Date.now();
    restarts = restarts.filter((t) => now - t < RESTART_WINDOW_MS);
    restarts.push(now);

    logger.warn(
      `Worker ${worker.process.pid} died (code ${code}, signal ${signal}). ` +
        `${restarts.length} restart(s) in the last minute.`
    );

    if (restarts.length > MAX_RESTARTS) {
      logger.error('Too many worker restarts in one minute — stopping so the platform can restart us cleanly.');
      process.exit(1);
    }

    setTimeout(() => cluster.fork(), 2000);
  });

  // ✅ Only primary pings — runs once, not on every worker
  if (process.env.BACKEND_URL) {
    keepAlive();
  }

} else {
  startWorker();
}