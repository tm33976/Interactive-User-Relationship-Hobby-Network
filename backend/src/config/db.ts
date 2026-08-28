import mongoose from "mongoose";
import { logger } from "../utils/logger";

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
      logger.error("MONGO_URI is not defined in .env file.");
      process.exit(1);
    }
    // Default maxPoolSize is 100 per process, which a free Atlas cluster
    // (500 connection cap) cannot absorb once there is more than one worker.
    await mongoose.connect(mongoUri, {
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("MongoDB Connected successfully.");
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });
  } catch (error) {
    logger.error("Could not connect to MongoDB:", error as Error);
    process.exit(1);
  }
};

export default connectDB;
