import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import jwtConfig from '../config/jwt.js';
import { setupMessageSocket } from './messageSocket.js';

const authenticateSocket = (socket, next) => {
  try {
    let token = socket.handshake.auth.token;

    if (!token && socket.handshake.headers.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
    }

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, jwtConfig.secret);
    socket.userId = decoded.id || decoded.userId;

    if (!socket.userId) return next(new Error('Authentication error: user identifier missing'));

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
    transports:   ['websocket', 'polling'],
    pingTimeout:  60000,
    pingInterval: 25000,
    // ── Fix: não usar allowEIO3 — evita ligações legacy duplicadas
    allowEIO3: false,
  });

  // Autenticação no namespace principal (/)
  io.use(authenticateSocket);

  // Setup namespace /messages — o middleware de auth está dentro do setupMessageSocket
  // NÃO aplicar authenticateSocket aqui de novo — causava autenticação dupla
  setupMessageSocket(io);

  io.on('connection', (socket) => {
    logger.info(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);
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