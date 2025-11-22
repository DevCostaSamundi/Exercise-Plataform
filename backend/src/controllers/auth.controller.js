import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import JwtService from '../services/jwt.service.js';
import emailService from '../services/email.service.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictError('Email already registered');
        }
        throw new ConflictError('Username already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(user.email, user.username).catch((err) => {
        logger.error('Failed to send welcome email:', err);
      });

      return ApiResponse.success(
        res,
        { user, ...tokens },
        'Registration successful',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedError('Account is inactive');
      }

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return ApiResponse.success(
        res,
        { user: userWithoutPassword, ...tokens },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = JwtService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = JwtService.generateAccessToken(user.id, user.role);

      return ApiResponse.success(res, { accessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side should remove tokens)
   */
  async logout(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists
        return ApiResponse.success(
          res,
          null,
          'If email exists, password reset instructions have been sent'
        );
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = JwtService.generateAccessToken(user.id, user.role);

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      return ApiResponse.success(
        res,
        null,
        'If email exists, password reset instructions have been sent'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      // Verify token
      const decoded = JwtService.verifyAccessToken(token);

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      return ApiResponse.success(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
