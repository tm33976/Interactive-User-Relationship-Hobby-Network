import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { logger } from './utils/logger';

// --- IMPORT OUR NEW ROUTES AND MIDDLEWARE ---
import userRoutes from './routes/user.routes';
import graphRoutes from './routes/graph.routes';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';

// --- Create the Express App ---
const app = express();

// --- Middleware ---
app.use(helmet());

// --- THIS IS THE FIX ---
// We now read the frontend URL from the environment,
// but we keep 'localhost:5173' as a fallback for development.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
// --- END OF FIX ---

app.use(express.json());
app.use(morgan('tiny', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// --- API Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.use('/api/users', userRoutes);
app.use('/api/graph', graphRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Cybernauts API!');
});

// --- Error Handling ---
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Export the app
export default app;