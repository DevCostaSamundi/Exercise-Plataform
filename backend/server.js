import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import initSocket from './src/socket/index.js';
import prisma from './src/config/database.js';
import web3Service from './src/services/web3.service.js';
import { startBlockchainMonitor } from './src/jobs/blockchain-monitor.job.js';
import { validateWeb3Config } from './src/config/web3.config.js';

// Trust proxy (nginx, Railway, Render, etc.)
app.set('trust proxy', 1);

// ── Endpoints de info ─────────────────────────────────────────────────────────
const API_VERSION = process.env.API_VERSION || 'v1';

app.get('/', (req, res) => {
  res.redirect(`/api/${API_VERSION}`);
});

app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    status:      'OK',
    message:     'FlowConnect API',
    version:     API_VERSION,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health:               '/health',
      auth_register:        `/api/${API_VERSION}/auth/register`,
      auth_login:           `/api/${API_VERSION}/auth/login`,
      auth_creator_register:`/api/${API_VERSION}/auth/creator-register`,
      auth_web3:            `/api/${API_VERSION}/auth/web3auth/login`,
      creators:             `/api/${API_VERSION}/creators`,
      posts:                `/api/${API_VERSION}/posts`,
      subscriptions:        `/api/${API_VERSION}/subscriptions`,
      marketplace:          `/api/${API_VERSION}/marketplace`,
      notifications:        `/api/${API_VERSION}/notifications`,
      messages:             `/api/${API_VERSION}/messages`,
    },
  });
});

// ── Setup ─────────────────────────────────────────────────────────────────────
const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

// Inicializar Socket.IO
initSocket(server);

// ── Arranque ──────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // 1. Base de dados
    logger.info('🔄 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // 2. Web3 — validar configuração
    try {
      validateWeb3Config();
      logger.info('✅ Web3 configuration validated');
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        // Em produção, configuração inválida é fatal
        logger.error('❌ Web3 configuration invalid — aborting startup:', error.message);
        await prisma.$disconnect();
        process.exit(1);
      } else {
        logger.warn('⚠️  Web3 configuration incomplete (development mode — continuing):', error.message);
      }
    }

    // 3. Web3 Service — inicializar
    // ⚠️  CORRIGIDO: era web3Service.init() — método correcto é initialize()
    try {
      await web3Service.initialize();
      logger.info('✅ Web3 service initialized');

      startBlockchainMonitor();
      logger.info('✅ Blockchain monitor started');
    } catch (error) {
      logger.warn('⚠️  Web3 service failed to initialize:', error.message);
      logger.warn('   Blockchain monitor not started — payments will not be auto-confirmed');
    }

    // 4. HTTP Server
    await new Promise((resolve, reject) => {
      server
        .listen(PORT, () => {
          logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
          logger.info(`📍 API available at http://localhost:${PORT}/api/${API_VERSION}`);
          logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
          resolve();
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            logger.error(`❌ Port ${PORT} is already in use`);
            logger.error('💡 Stop the existing server or change PORT in .env');
          } else {
            logger.error('❌ Server error:', err);
          }
          reject(err);
        });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('✅ HTTP server closed');

    try {
      await prisma.$disconnect();
      logger.info('✅ Database disconnected');
      logger.info('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Forçar shutdown após 10 segundos
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', reason);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ── Start ─────────────────────────────────────────────────────────────────────
startServer().catch((error) => {
  logger.error('❌ Fatal error during startup:', error);
  process.exit(1);
});