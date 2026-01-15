import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { UnauthorizedError } from '../utils/errors.js';
import jwtConfig from '../config/jwt.js';

/**
 * Middleware de autenticação obrigatória
 */


export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token not provided');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }
    
    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isVerified: true,
        creator: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};



/**
 * Autenticação opcional - não bloqueia se não tiver token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Se não houver token, apenas continua sem autenticar
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null; // Explicitamente definir como null
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // ✅ CORREÇÃO: Usar jwtConfig.secret ao invés de process.env.JWT_SECRET
      const decoded = jwt.verify(token, jwtConfig.secret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true,
          creator: {
            select: {
              id: true,
            },
          },
        },
      });

      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      // Token inválido, mas não retorna erro - apenas continua sem autenticar
      logger.warn('Optional auth - invalid token:', tokenError.message);
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    req.user = null;
    next(); // Continua mesmo com erro
  }
};

/**
 * Verificar se é criador
 */
export const requireCreator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Creator account required',
      });
    }

    req.creator = creator;
    next();
  } catch (error) {
    logger.error('Require creator error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
    });
  }
};

export const authorizeCreator = async (req, res, next) => {
  try {
    // Buscar perfil de criador
    const creator = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas criadores.',
      });
    }

    // ✅ Adicionar creatorId ao req.user
    req.user.creatorId = creator.id;
    next();
  } catch (error) {
    logger.error('Authorize creator error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissões',
    });
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
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
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