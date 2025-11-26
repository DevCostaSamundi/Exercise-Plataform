import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import  http from 'http';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import authRoutes from './src/routes/auth.routes.js';
import initSocket from './src/socket/index.js';
import errorHandle from '/backend/src/middleware/error.middleware.js';

// Load environment variables
dotenv.config();

app.set('trust proxy', 1);

app.use('/api/v1/auth', authRoutes);

// Root -> redireciona para /api/v1
app.get('/', (req, res) => {
  res.redirect(`/api/${process.env.API_VERSION || 'v1'}`);
});

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

app.use(errorHandle);

const PORT = process.env.PORT || 5000;

const server = http.creatorServer(app);
initSocket(server);
// Start server
server.listen(PORT, () => {
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