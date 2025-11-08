import { Request, Response, NextFunction } from 'express';

// This is a wrapper for our async route handlers
// It takes an async function (like our controllers)
// and makes sure to .catch() any errors and pass them to next()
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // This is the magic part
  };
};

export default asyncHandler;