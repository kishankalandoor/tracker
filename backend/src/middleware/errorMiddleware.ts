import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    },
  });
};
