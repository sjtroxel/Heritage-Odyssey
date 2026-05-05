import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { logger } from './services/logger.js';
import * as authController from './controllers/authController.js';
import { authenticate } from './middleware/auth.js';
import type { HealthStatus } from '@heritage-odyssey/shared/types';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };
  res.json(health);
});

// Auth routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.post('/api/auth/refresh', authController.refresh);

// Protected routes (placeholder)
app.get('/api/profile', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Error handling
app.use((err: Error, req: Request, _res: Response, _next: NextFunction) => {
  logger.error(err);
  _res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export { app };
