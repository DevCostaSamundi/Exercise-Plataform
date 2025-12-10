import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { setupMessageSocket } from './messageSocket.js';

// JWT authentication middleware for Socket.IO
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Setup de namespaces
  setupMessageSocket(io);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO initialized with JWT authentication');
  return io;
};

export default initSocket;