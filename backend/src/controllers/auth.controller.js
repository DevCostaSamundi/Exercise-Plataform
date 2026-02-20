/**
 * Auth Controller (Launchpad 2.0)
 * Simplified authentication - no email/cloudinary dependencies
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import JwtService from '../services/jwt.service.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      logger.info('📥 Registration attempt:', { email: req.body.email, username: req.body.username });

      const {
        email,
        username,
        password,
        displayName,
        birthDate,
        firstName,
        lastName
      } = req.body;

      // Normalize
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { username: normalizedUsername }
          ],
        },
      });

      if (existingUser) {
        logger.warn('❌ User already exists:', { email: existingUser.email, username: existingUser.username });

        if (existingUser.email === normalizedEmail) {
          throw new ConflictError('Email already registered');
        }
        throw new ConflictError('Username already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
          password: hashedPassword,
          displayName: displayName || normalizedUsername,
          birthDate: birthDate ? new Date(birthDate) : null,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          birthDate: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      });

      logger.info('✅ User created successfully:', { id: user.id, email: user.email });

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      return ApiResponse.success(
        res,
        { user, ...tokens },
        'Registration successful',
        201
      );
    } catch (error) {
      logger.error('❌ Registration error:', error);
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const normalizedEmail = email?.trim().toLowerCase();

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          password: true,
          role: true,
          isActive: true,
          isVerified: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info('✅ User logged in:', { id: user.id, email: user.email });

      return ApiResponse.success(
        res,
        { user: userWithoutPassword, ...tokens },
        'Login successful'
      );
    } catch (error) {
      logger.error('❌ Login error:', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      const tokens = JwtService.refreshAccessToken(refreshToken);

      return ApiResponse.success(
        res,
        tokens,
        'Token refreshed successfully'
      );
    } catch (error) {
      logger.error('❌ Refresh token error:', error);
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      // For JWT, client just needs to delete the token
      // We could add token blacklisting here if needed

      return ApiResponse.success(
        res,
        null,
        'Logout successful'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset (simplified - no email)
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      // In production, this would send an email
      // For Launchpad 2.0 MVP, we'll just return success
      logger.info('Password reset requested for:', email);

      return ApiResponse.success(
        res,
        null,
        'If this email exists, a reset link will be sent'
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
      const { token, newPassword } = req.body;

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      logger.info('✅ Password reset successful for:', user.email);

      return ApiResponse.success(
        res,
        null,
        'Password reset successful'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
          wallets: {
            select: {
              id: true,
              walletAddress: true,
              isPrimary: true,
            }
          }
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
