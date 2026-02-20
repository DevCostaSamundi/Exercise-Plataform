import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// JWT authentication middleware for Socket.IO
const authenticateSocket = (socket, next) => {
  try {
    // Tentar pegar token do auth
    let token = socket.handshake.auth.token;
    
    // Fallback para authorization header
    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      logger.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication required'));
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Aceitar tanto 'userId' quanto 'id'
    socket.userId = decoded.userId || decoded.id;
    
    if (!socket.userId) {
      logger.error('Socket authentication failed: userId missing in token', decoded);
      return next(new Error('Authentication error: userId missing'));
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
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ✅ Aplicar autenticação no namespace principal
  io.use(authenticateSocket);

  // Namespace para eventos de launchpad (trades, tokens, yields)
  const launchpadNamespace = io.of('/launchpad');
  launchpadNamespace.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Emitir evento de conexão bem-sucedida
    socket.emit('authenticated', { userId: socket.userId });

    // Subscrever em sala de usuário para notificações personalizadas
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  // Launchpad namespace para atualizações em tempo real
  launchpadNamespace.on('connection', (socket) => {
    logger.info(`✅ Launchpad socket connected: ${socket.id}`);

    // Subscrever em tokens específicos
    socket.on('subscribe:token', (tokenAddress) => {
      socket.join(`token:${tokenAddress}`);
      logger.info(`Socket ${socket.id} subscribed to token: ${tokenAddress}`);
    });

    socket.on('unsubscribe:token', (tokenAddress) => {
      socket.leave(`token:${tokenAddress}`);
      logger.info(`Socket ${socket.id} unsubscribed from token: ${tokenAddress}`);
    });
  });

  logger.info('✅ Socket.IO initialized with JWT authentication (Launchpad mode)');
  return io;
};

export default initSocket;