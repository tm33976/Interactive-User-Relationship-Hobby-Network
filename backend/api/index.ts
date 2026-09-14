import serverless from 'serverless-http';
import app from '../src/app';
import connectDB from '../src/config/db';

let isConnected = false;

const handler = serverless(app);

module.exports = async (req: any, res: any) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    return handler(req, res);
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
};