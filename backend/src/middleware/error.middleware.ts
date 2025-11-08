import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import { logger } from '../utils/logger';

// This handles Mongoose's "CastError" (e.g., an invalid ID format)
const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 Bad Request
};

// This handles Mongoose's "Duplicate Key" error (e.g., username taken)
const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 409); // 409 Conflict
};

// This handles Mongoose's "ValidationError" (e.g., "age is required")
const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400); // 400 Bad Request
};

// --- Response Functions ---

// Send detailed error response in Development
const sendErrorDev = (err: AppError | any, res: Response) => {
  logger.error('ERROR 💥', err);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// Send clean error response in Production
const sendErrorProd = (err: AppError, res: Response) => {
  // A) For our "operational" errors, we send a nice message to the client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // B) For programming or unknown errors, we don't leak details
  logger.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

// --- Main Handler ---

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default status and code if not already set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // We'll run in 'development' mode for this project
  // In a real prod build, you'd set NODE_ENV=production
  let error = { ...err };
  error.message = err.message;

  // Handle specific Mongoose errors
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  
  // For this project, we'll just send the "dev" error response
  // so we can see all the details
  sendErrorDev(error, res);
};

// --- 404 Not Found Handler ---
// This runs if no other route matches
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};