import dotenv from 'dotenv';
import app from './src/app.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📍 API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
});

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
