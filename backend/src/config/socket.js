import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import jwtConfig from './jwt.js';

let io;

/**
 * Inicializa o Socket.IO
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware de autenticação
  io.use((socket, next) => {
    try {
      const token = socket. handshake.auth.token;
      
      if (!token) {
        logger.warn('Socket connection attempt without token');
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, jwtConfig.secret);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      
      logger.info(`✅ Socket authenticated:  User ${socket.userId}`);
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err. message);
      next(new Error('Invalid authentication token'));
    }
  });

  // Eventos de conexão
  io.on('connection', (socket) => {
    logger.info(`🔌 User connected: ${socket.userId} (${socket.id})`);

    // Entrar na sala pessoal do usuário
    socket.join(`user: ${socket.userId}`);
    
    // Confirmar conexão
    socket.emit('connected', {
      userId: socket. userId,
      message: 'Connected to notification server',
    });

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
      logger.info(`❌ User disconnected: ${socket.userId} - Reason: ${reason}`);
    });

    // Evento de erro
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('✅ Socket. IO initialized successfully');
  return io;
};

/**
 * Retorna a instância do Socket.IO
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized.  Call initializeSocket() first.');
  }
  return io;
};

export default { initializeSocket, getIO };