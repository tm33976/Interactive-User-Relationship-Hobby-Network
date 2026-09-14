import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { logger } from './utils/logger';
import userRoutes from './routes/user.routes';
import graphRoutes from './routes/graph.routes';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Middleware 
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json());
app.use(morgan('tiny', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// TEMPORARY DEBUG ROUTE — remove after diagnosing
app.get('/api/ping-db', async (req, res) => {
  const start = Date.now();
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
    });
    res.json({ ok: true, ms: Date.now() - start });
  } catch (e: any) {
    res.status(500).json({ ok: false, ms: Date.now() - start, error: e.message });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/graph', graphRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to the Cybernauts API!');
});

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ✅ No app.listen() here — handled by index.ts
export default app;