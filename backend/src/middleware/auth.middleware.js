import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

/**
 * Middleware de autenticação obrigatória
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
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
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Verificar se é criador
 */
export const requireCreator = async (req, res, next) => {
  try {
    if (! req.user) {
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
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
    });
  }
};

/**
 * Verificar se é admin
 */
export const requireAdmin = (req, res, next) => {
  if (! req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

export default {
  authenticate,
  optionalAuth,
  requireCreator,
  requireAdmin,
};