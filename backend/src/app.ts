import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { logger } from './utils/logger';
import userRoutes from './routes/user.routes';
import graphRoutes from './routes/graph.routes';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const axios = require('axios');

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

app.use('/api/users', userRoutes);
app.use('/api/graph', graphRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Cybernauts API!');
});

// ✅ Error Handling — must be registered BEFORE app.listen()
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Keep alive script
const PING_INTERVAL = 14 * 60 * 1000;

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

// ✅ Start server AFTER all middleware and routes are registered
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    keepAlive();
  }
});

export default app;