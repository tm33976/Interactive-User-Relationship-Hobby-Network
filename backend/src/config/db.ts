import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Connects to the MongoDB database.
 * We'll call this function from our main app.ts (or index.ts)
 * to establish the connection on server startup.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    // Check if the MongoDB URI is provided in the .env file
    if (!mongoUri) {
      logger.error('MONGO_URI is not defined in .env file.');
      process.exit(1); // Exit the process with a failure code
    }

    // Attempt to connect to the database
    // We add some good-practice options here
    await mongoose.connect(mongoUri, {
      // These options are no longer needed in Mongoose 6+
      // but it's good to know they exist if you use an older version.
      // Mongoose 6+ has them as defaults:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    logger.info('MongoDB Connected successfully.');

    // Listen for any errors *after* the initial connection
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

  } catch (error) {
    logger.error('Could not connect to MongoDB:', error as Error);
    process.exit(1); // Exit if we can't connect
  }
};

export default connectDB;