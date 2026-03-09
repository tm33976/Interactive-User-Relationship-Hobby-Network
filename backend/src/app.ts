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
//  Middleware 
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


// Keep alive script
const PING_INTERVAL = 14 * 60 * 1000; 

function keepAlive() {
  const selfUrl = `${process.env.BACKEND_URL}/api/health`; // Updated to match your /api/health route

  setInterval(async () => {
    try {
      console.log('📡 Keep-Alive: Pinging self to prevent Render sleep...');
      const response = await axios.get(selfUrl);
      console.log(`✅ Keep-Alive Status: ${response.status}`);
    } catch (error: any) { // Using 'any' or a type guard fixes the TS18046 error
      console.error('⚠️ Keep-Alive Failed:', error?.message || 'Unknown error');
    }
  }, PING_INTERVAL);
}

/**
 * START THE PINGER
 * Ensure the server is listening before starting the heartbeat.
 * Replace 'PORT' with your existing port variable.
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  

  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    keepAlive();
  }
});



// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;