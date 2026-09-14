import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error("MONGO_URI is not defined in environment variables.");
    throw new Error("MONGO_URI is not defined"); // throw, don't exit
  }

  try {
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
    throw error; // let the caller (api/index.ts) handle it and respond properly
  }
};

export default connectDB;