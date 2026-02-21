// src/app.js
// Launchpad 2.0 - Token Trading Platform on Base
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Import routes - Core Platform
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import web3authRoutes from './routes/web3auth.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// Import routes - Launchpad (Token Trading)
import tokenRoutes from './routes/token.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import cryptoPaymentRoutes from './routes/crypto-payment.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import trendingRoutes from './routes/trending.routes.js';
import tradeRoutes from './routes/trade.routes.js';

// Import routes - AI Marketing (Admin)
import aiRoutes from './routes/ai.routes.js';

// Import routes - Uploads
import uploadRoutes from './routes/upload.routes.js';

import errorMiddleware from './middleware/error.middleware.js';
import logger from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());

// ------------------- CORS -------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Wallet-Address'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
};

app.use(cors(corsOptions));

// ------------------- Rate Limiting -------------------
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ------------------- Middleware -------------------
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ------------------- Static Files (uploads) -------------------
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, '..', 'uploads');

// CORS middleware for uploads
const uploadsCorsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

// Serve uploads from both /uploads and /api/v1/uploads
app.use('/uploads', uploadsCorsMiddleware, express.static(uploadsPath));
app.use('/api/v1/uploads', uploadsCorsMiddleware, express.static(uploadsPath));

// ------------------- Health Check -------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ------------------- API Routes -------------------
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// API Routes - Launchpad 2.0
// ============================================

// Auth routes (públicas)
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// Token routes (Launchpad Core)
app.use(`/api/${API_VERSION}/tokens`, tokenRoutes);
app.use(`/api/${API_VERSION}/trades`, tradeRoutes);
app.use(`/api/${API_VERSION}/portfolio`, portfolioRoutes);

// User routes
app.use(`/api/${API_VERSION}/user`, userRoutes);

// Trending routes
app.use(`/api/${API_VERSION}/trending`, trendingRoutes);

// Upload routes (before transaction routes - they must be public)
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);

// Wallet and transaction routes
app.use(`/api/${API_VERSION}`, transactionRoutes);

// Notification routes
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// Web3 Auth routes
app.use(`/api/${API_VERSION}/web3-auth`, web3authRoutes);

// Crypto Payment routes
app.use(`/api/${API_VERSION}/crypto-payment`, cryptoPaymentRoutes);

// AI Marketing routes (admin-only)
app.use(`/api/${API_VERSION}/ai`, aiRoutes);

// ------------------- 404 handler -------------------
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.path,
  });
});

// ------------------- Error Handling Middleware -------------------
app.use(errorMiddleware);

export default app;