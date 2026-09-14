import mongoose from "mongoose";
import { logger } from "../utils/logger";

/**
 * Connects to the MongoDB database.
 * We'll call this function from our main app.ts (or index.ts)
 * to establish the connection on server startup.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error("MONGO_URI is not defined in environment variables.");
    throw new Error("MONGO_URI is not defined");
  }

  try {
    // Default maxPoolSize is 100 per process, which a free Atlas cluster
    // (500 connection cap) cannot absorb once there is more than one worker.
    await mongoose.connect(mongoUri, {
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      family: 4,
    });

    logger.info("MongoDB Connected successfully.");
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });
  } catch (error) {
    logger.error("Could not connect to MongoDB:", error as Error);
    throw error;
  }
};

export default connectDB;