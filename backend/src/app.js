import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// ── Rotas ─────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import creatorRoutes from './routes/creator.routes.js';
import postRoutes from './routes/post.routes.js';
import chatRoutes from './routes/chat.routes.js';
import creatorPostRoutes from './routes/creatorPost.routes.js';
import messageRoutes from './routes/message.routes.js';
import creatorDashboardRoutes from './routes/creatorDashboard.routes.js';
import commentRoutes from './routes/comment.routes.js';
import likeRoutes from './routes/like.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import trendingRoutes from './routes/trending.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import creatorSubscribersRoutes from './routes/creatorSubscribers.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import creatorSettingsRoutes from './routes/creatorSettings.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import web3authRoutes from './routes/web3auth.routes.js';
import cryptoPaymentRoutes from './routes/crypto-payment.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import aiCompanionRoutes from './routes/ai-companion.routes.js';
import aiChatRoutes from './routes/ai-chat.routes.js';

import errorMiddleware from './middleware/error.middleware.js';
import logger from './utils/logger.js';

const app = express();

// ── Segurança ─────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((o) => origin.startsWith(o))) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    logger.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
};

app.use(cors(corsOptions));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Middleware base ───────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Rotas API ─────────────────────────────────────────────────────────────────
const API_VERSION = process.env.API_VERSION || 'v1';
const API = `/api/${API_VERSION}`;

// Auth (público)
app.use(`${API}/auth`, authRoutes);

// ⚠️  CORRIGIDO: web3auth montado em /auth para evitar path duplo
// Internamente as rotas são /web3auth/login, /wallet, /wallet/balance, etc.
// Path final: /api/v1/auth/web3auth/login ✅
app.use(`${API}/auth`, web3authRoutes);

// Rotas de GESTÃO do criador — mais específicas, ANTES de /creators
app.use(`${API}/creator/settings`, creatorSettingsRoutes);
app.use(`${API}/creator-dashboard`, creatorDashboardRoutes);
app.use(`${API}/creator/posts`, creatorPostRoutes);
app.use(`${API}/creator/subscribers`, creatorSubscribersRoutes);

// Rotas PÚBLICAS de criadores — menos específicas, DEPOIS
app.use(`${API}/creators`, creatorRoutes);

// User (protegido)
app.use(`${API}/user`, userRoutes);

// Assinaturas
app.use(`${API}/subscriptions`, subscriptionRoutes);

// Favoritos
app.use(`${API}/favorites`, favoriteRoutes);

// Trending
app.use(`${API}/trending`, trendingRoutes);

// Wallet e transacções (monta /wallet e /transactions directamente)
app.use(`${API}`, transactionRoutes);

// Posts
app.use(`${API}/posts`, postRoutes);

// Comentários e likes (montam com prefixo /posts/:id internamente)
app.use(`${API}`, commentRoutes);
app.use(`${API}`, likeRoutes);

// Mensagens
app.use(`${API}/messages`, messageRoutes);

// Chat
app.use(`${API}/chat`, chatRoutes);

// Upload de média
app.use(`${API}/upload`, uploadRoutes);

// Notificações
app.use(`${API}/notifications`, notificationRoutes);

// Marketplace
// ⚠️  CORRIGIDO: estava em falta — todas as rotas de marketplace retornavam 404
app.use(`${API}/marketplace`, marketplaceRoutes);

// Shipping (etiquetas de envio)
// ⚠️  CORRIGIDO: estava em falta
app.use(`${API}/shipping`, shippingRoutes);

// Pagamentos crypto
app.use(`${API}/crypto-payment`, cryptoPaymentRoutes);

// AI Companions
app.use(`${API}/ai`, aiCompanionRoutes);
app.use(`${API}/ai`, aiChatRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.path,
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;