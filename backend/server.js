import dotenv from 'dotenv';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import authRoutes from './src/routes/auth.routes.js';

// Load environment variables
dotenv.config();

app.use('/api/v1/auth', authRoutes);

// só responde para GET /api/v1
app.get('/api/v1', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PrideConnect API - v1',
    endpoints: {
      auth_register: '/api/v1/auth/register',
      auth_login: '/api/v1/auth/login',
      auth_creator_register: '/api/v1/auth/creator-register'
    },
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: 'API endpoint not found' });
});
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
