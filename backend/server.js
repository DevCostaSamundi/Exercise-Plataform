import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import initSocket from './src/socket/index.js';
import prisma from './src/config/database.js';
import web3Service from './src/services/web3.service.js';
import { startBlockchainMonitor } from './src/jobs/blockchain-monitor.job.js';
import { validateWeb3Config } from './src/config/web3.config.js';

app.set('trust proxy', 1);

const API_VERSION = process.env.API_VERSION || 'v1';

app.get('/', (req, res) => res.redirect(`/api/${API_VERSION}`));

app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    status: 'OK', message: 'FlowConnect API',
    version: API_VERSION,
    environment: process.env.NODE_ENV || 'development',
  });
});

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

async function startServer() {
  try {
    logger.info('🔄 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    try {
      validateWeb3Config();
      logger.info('✅ Web3 configuration validated');
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('❌ Web3 configuration invalid:', error.message);
        await prisma.$disconnect();
        process.exit(1);
      } else {
        logger.warn('⚠️  Web3 configuration incomplete (dev mode):', error.message);
      }
    }

    try {
      await web3Service.initialize();
      logger.info('✅ Web3 service initialized');
      startBlockchainMonitor();
      logger.info('✅ Blockchain monitor started');
    } catch (error) {
      logger.warn('⚠️  Web3 service failed to initialize:', error.message);
    }

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

async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Fechar o servidor HTTP (para de aceitar ligações novas)
  server.close(async () => {
    logger.info('✅ HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('✅ Database disconnected');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // ── Timeout reduzido para 3s em dev, 10s em produção ──────────────
  // Em dev o nodemon mata o processo após ~2s — 10s causava "Forced shutdown"
  const shutdownTimeout = process.env.NODE_ENV === 'production' ? 10000 : 3000;
  setTimeout(() => {
    logger.warn(`⚠️  Forced shutdown after ${shutdownTimeout}ms timeout`);
    process.exit(1);
  }, shutdownTimeout);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled Promise Rejection:', reason);
  if (process.env.NODE_ENV === 'production') gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer().catch((error) => {
  logger.error('❌ Fatal error during startup:', error);
  process.exit(1);
});