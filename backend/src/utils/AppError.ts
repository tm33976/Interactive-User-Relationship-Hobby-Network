// This is a simple, reusable class for all our operational errors
// (like "User not found" or "Cannot delete user")
class AppError extends Error {
  public statusCode: number;
  public status: 'fail' | 'error';
  public isOperational: boolean;

  /**
   * @param message The error message
   * @param statusCode The HTTP status code
   */
  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    // Set status to 'fail' for 4xx errors, 'error' for 5xx
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // We use this to distinguish our errors from unknown programming errors
    this.isOperational = true;

    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;