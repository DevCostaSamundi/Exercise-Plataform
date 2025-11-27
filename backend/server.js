import dotenv from 'dotenv';
import http from 'http';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import initSocket from './src/socket/index.js';

// Load environment variables
dotenv.config();

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
    endpoints: {
      health: '/health',
      auth_register: '/api/v1/auth/register',
      auth_login: '/api/v1/auth/login',
      auth_creator_register: '/api/v1/auth/creator-register',
      creators: '/api/v1/creators',
      users: '/api/v1/users/profile',
    },
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

// Start server with error handling for EADDRINUSE
const startServer = (port) => {
  server.listen(port, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    logger.info(`📍 API available at http://localhost:${port}/api/${process.env.API_VERSION || 'v1'}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} is already in use`);
      if (port === PORT) {
        const fallbackPort = PORT + 1;
        logger.info(`🔄 Trying fallback port ${fallbackPort}...`);
        startServer(fallbackPort);
      } else {
        logger.error('Could not find an available port. Please stop the existing server or use a different PORT in .env');
        process.exit(1);
      }
    } else {
      logger.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});