// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import creatorRoutes from './routes/creator.routes.js';
import postRoutes from './routes/post.routes.js';
import chatRoutes from './routes/chat.routes.js';
import liveRoutes from './routes/live.routes.js';
import creatorSettingsRoutes from './routes/creatorSettings.routes.js';
import creatorPostRoutes from './routes/creatorPost.routes.js';
import messageRoutes from './routes/message.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import creatorDashboardRoutes from './routes/creatorDashboard.routes.js';

// Import middleware
import errorMiddleware from './middleware/error.middleware.js';
import logger from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());

// ------------------- CORS -------------------
// Allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // ✅ IMPORTANTE: Permitir requests sem origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    // ✅ Permitir origens na lista
    if (allowedOrigins. some(o => origin.startsWith(o))) {
      return callback(null, true);
    }

    // ⚠️ APENAS EM DESENVOLVIMENTO: Permitir localhost em qualquer porta
    if (process.env. NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    // ❌ Bloquear outras origens
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// Auth routes (inclui /register, /login, /creator-register, etc)
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// User routes
app.use(`/api/${API_VERSION}/user`, userRoutes);

// Subscription routes
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);

// ✅ IMPORTANTE: Creator management ANTES de rotas públicas
app.use(`/api/${API_VERSION}/creator`, creatorSettingsRoutes);
app.use(`/api/${API_VERSION}/creator/posts`, creatorPostRoutes);
app.use(`/api/${API_VERSION}/creator-dashboard`, creatorDashboardRoutes);

// Creator routes públicas (perfil, listar) - DEPOIS
app.use(`/api/${API_VERSION}/creators`, creatorRoutes);

// Post routes (públicos)
app.use(`/api/${API_VERSION}/posts`, postRoutes);

// Live routes
app.use(`/api/${API_VERSION}/lives`, liveRoutes);

// Message routes
app.use(`/api/${API_VERSION}/messages`, messageRoutes);

// Chat routes
app.use(`/api/${API_VERSION}/chat`, chatRoutes);

// Payment routes
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);

// Withdrawal routes
app.use(`/api/${API_VERSION}/withdrawals`, withdrawalRoutes);

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