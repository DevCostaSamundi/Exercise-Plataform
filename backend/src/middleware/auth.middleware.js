import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { UnauthorizedError } from '../utils/errors.js';
import jwtConfig from '../config/jwt.js';

/**
 * Extrair e verificar token JWT do header
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return token || null;
};

/**
 * Middleware de autenticação obrigatória
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }

    const decoded = jwt.verify(token, jwtConfig.secret);

    // Suporta tokens assinados com 'id' (Web3Auth) e 'userId' (email/password)
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      throw new UnauthorizedError('Invalid token payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isVerified: true,
        creator: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Bloquear utilizadores desactivados
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    logger.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

/**
 * Autenticação opcional — não bloqueia se não houver token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        req.user = null;
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          isVerified: true,
          creator: {
            select: { id: true },
          },
        },
      });

      // Não autenticar utilizadores desactivados mesmo em rotas opcionais
      req.user = (user && user.isActive !== false) ? user : null;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Verificar se é criador — anexa req.creator
 */
export const requireCreator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });

    if (!creator) {
      return res.status(403).json({ success: false, message: 'Creator account required' });
    }

    req.creator = creator;
    next();
  } catch (error) {
    logger.error('Require creator error:', error);
    return res.status(500).json({ success: false, message: 'Authorization failed' });
  }
};

/**
 * Verificar se é criador — anexa req.user.creatorId
 */
export const authorizeCreator = async (req, res, next) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas criadores.',
      });
    }

    req.user.creatorId = creator.id;
    next();
  } catch (error) {
    logger.error('Authorize creator error:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar permissões' });
  }
};

/**
 * Verificar se é admin
 */
export const authorizeAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error:', error);
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message || 'Admin access required',
    });
  }
};

export default {
  authenticate,
  optionalAuth,
  requireCreator,
  authorizeCreator,
  authorizeAdmin,
};