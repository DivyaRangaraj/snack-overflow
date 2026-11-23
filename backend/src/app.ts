import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import authRoutes from './routes/auth.routes';
import snackRoutes from './routes/snack.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' } },
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: config.nodeEnv });
  });

  // Routes
  app.use('/auth', authRoutes);
  app.use('/snacks', snackRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
