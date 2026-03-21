import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import jwtConfig from '../config/jwt.js';
import { setupMessageSocket } from './messageSocket.js';

// Middleware de autenticação JWT para Socket.IO
const authenticateSocket = (socket, next) => {
  try {
    let token = socket.handshake.auth.token;

    // Fallback para authorization header
    if (!token && socket.handshake.headers.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      logger.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication required'));
    }

    // Usa jwtConfig — nunca process.env directamente
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Suporta tokens assinados com 'id' (Web3Auth) e 'userId' (email/password)
    socket.userId = decoded.id || decoded.userId;

    if (!socket.userId) {
      logger.error('Socket authentication failed: user identifier missing in token');
      return next(new Error('Authentication error: user identifier missing'));
    }

    logger.info(`✅ Socket authenticated: ${socket.id} (User: ${socket.userId})`);
    next();
  } catch (error) {
    logger.error('❌ Socket authentication error:', error.message);
    return next(new Error('Authentication failed: ' + error.message));
  }
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods:     ['GET', 'POST'],
    },
    transports:    ['websocket', 'polling'],
    pingTimeout:   60000,
    pingInterval:  25000,
  });

  // Autenticação no namespace principal
  io.use(authenticateSocket);

  // Setup namespace de mensagens
  const messageNamespace = setupMessageSocket(io);

  // Autenticação também no namespace de mensagens
  messageNamespace.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Room consistente: 'user:${id}'
    socket.join(`user:${socket.userId}`);

    socket.emit('authenticated', { userId: socket.userId });

    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('✅ Socket.IO initialized with JWT authentication');
  return io;
};

export default initSocket;