import dotenv from 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import initSocket from './src/socket/index.js';
import { startPaymentJobs } from './src/jobs/payment.jobs.js';
import prisma from './src/config/database.js'; // 👈 FALTAVA IMPORTAR

// Trust proxy (for production deployments behind nginx, etc)
app.set('trust proxy', 1);

// Root endpoint
app.get('/', (req, res) => {
  res.redirect(`/api/${process.env.API_VERSION || 'v1'}`);
});

// API info endpoint
app.get(`/api/${process.env.API_VERSION || 'v1'}`, (req, res) => {
  res.json({
    status: 'OK',
    message: 'PrideConnect API - v1',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth_register: '/api/v1/auth/register',
      auth_login: '/api/v1/auth/login',
      auth_creator_register: '/api/v1/auth/creator-register',
      creators: '/api/v1/creators',
      users: '/api/v1/users/profile',
      posts: '/api/v1/posts',
      subscriptions:  '/api/v1/subscriptions',
      payments: '/api/v1/payments',
      withdrawals: '/api/v1/withdrawals',
      notifications: '/api/v1/notifications',
      messages: '/api/v1/messages',
    },
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Main server startup function
async function startServer() {
  try {
    // Test database connection
    logger.info('🔄 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start cron jobs for payments
    logger.info('🕐 Starting payment cron jobs...');
    startPaymentJobs();

    // Start HTTP server
    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        logger. info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        logger.info(`📍 API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
        logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        resolve();
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`❌ Port ${PORT} is already in use`);
          logger.error('💡 Try stopping the existing server or change PORT in .env');
          reject(err);
        } else {
          logger.error('❌ Server error:', err);
          reject(err);
        }
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('✅ HTTP server closed');

    try {
      // Disconnect from database
      await prisma.$disconnect();
      logger.info('✅ Database disconnected');

      logger.info('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle SIGTERM (Docker, Kubernetes, etc)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', reason);
  logger.error('Promise:', promise);
  // Don't exit in development, just log
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer().catch((error) => {
  logger.error('❌ Fatal error during startup:', error);
  process.exit(1);
});