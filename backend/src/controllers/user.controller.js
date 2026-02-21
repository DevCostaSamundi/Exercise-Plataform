import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors.js';

class UserController {
  /**
   * Get current user profile
   * GET /api/v1/user/profile
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
          bio: true,
          role: true,
          isVerified: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              displayName: true,
              isVerified: true,
              subscriptionPrice: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return ApiResponse.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/user/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, displayName, bio, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          firstName,
          lastName,
          displayName,
          bio,
          avatar,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          role: true,
        },
      });

      return ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/v1/user/password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });

      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user settings
   * GET /api/v1/user/settings
   */
  async getSettings(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          // Adicionar campos de configuração quando existirem no schema
          // notificationSettings: true,
          // privacySettings: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return ApiResponse.success(res, {
        personal: {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
        },
        notifications: {
          // Valores padrão - ajustar quando tiver no schema
          email: true,
          push: true,
          marketing: false,
        },
      }, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user settings
   * PUT /api/v1/user/settings
   */
  async updateSettings(req, res, next) {
    try {
      const { personal, notifications, privacy } = req.body;

      const updateData = {};

      if (personal) {
        if (personal.displayName !== undefined) updateData.displayName = personal.displayName;
        if (personal.bio !== undefined) updateData.bio = personal.bio;
        if (personal.avatar !== undefined) updateData.avatar = personal.avatar;
      }

      // Atualizar dados do usuário
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
        },
      });

      return ApiResponse.success(res, user, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update email
   * PUT /api/v1/user/email
   */
  async updateEmail(req, res, next) {
    try {
      const { email, password } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }

      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== req.user.id) {
        throw new ConflictError('Email already in use');
      }

      // Update email
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          email,
          isVerified: false, // Require re-verification
        },
        select: {
          id: true,
          email: true,
          username: true,
          isVerified: true,
        },
      });

      return ApiResponse.success(res, updatedUser, 'Email updated successfully.  Please verify your new email.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete account
   * DELETE /api/v1/user/account
   */
  async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }

      // Delete user (cascade will delete related data)
      await prisma.user.delete({
        where: { id: req.user.id },
      });

      return ApiResponse.success(res, null, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();