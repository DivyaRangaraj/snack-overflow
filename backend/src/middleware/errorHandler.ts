import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: messages,
      },
    });
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this information already exists.',
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found.',
        },
      });
      return;
    }
  }

  // Unknown errors — never expose internals
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    },
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
}
