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
    // Allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);

    // Allow origins in allowedOrigins list
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }

    // Block all other origins
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
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
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Creator routes
app.use(`/api/${API_VERSION}/creators`, creatorRoutes);

// Post routes
app.use(`/api/${API_VERSION}/posts`, postRoutes);

// Live routes
app.use(`/api/${API_VERSION}/lives`, liveRoutes);

// Chat routes
app.use(`/api/${API_VERSION}`, chatRoutes);

// 404 handler for undefined routes
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