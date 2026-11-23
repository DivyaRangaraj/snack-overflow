import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import authRoutes from './routes/auth.routes';
import snackRoutes from './routes/snack.routes';
import requestRoutes from './routes/request.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Dynamic CORS configuration allowing localhost, Vercel, and Render deployments
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, server-to-server)
      if (!origin) return callback(null, true);
      if (
        config.frontendUrl === '*' ||
        origin === config.frontendUrl ||
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:3000' ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
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
  app.use('/snack-requests', requestRoutes);
  app.use('/notifications', notificationRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
