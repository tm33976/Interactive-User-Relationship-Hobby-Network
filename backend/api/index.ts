import serverless from 'serverless-http';
import app from '../src/app';
import connectDB from '../src/config/db';

let isConnected = false;

const handler = serverless(app);

module.exports = async (req: any, res: any) => {
  console.log('HANDLER INVOKED', new Date().toISOString(), 'isConnected:', isConnected, 'path:', req.url);
  try {
    if (!isConnected) {
      console.log('CALLING connectDB()');
      await connectDB();
      isConnected = true;
      console.log('connectDB() FINISHED');
    }
    return handler(req, res);
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};