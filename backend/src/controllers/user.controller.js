import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors.js';

class UserController {
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
          firstName: true,
          lastName: true,
          avatar: true,
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
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, bio, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          firstName,
          lastName,
          bio,
          avatar,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
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
   * Update email
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

      return ApiResponse.success(res, updatedUser, 'Email updated successfully. Please verify your new email.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(req, res, next) {
    try {
      await prisma.user.delete({
        where: { id: req.user.id },
      });

      return ApiResponse.success(res, null, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has an active subscription to a creator
   */
  async getSubscriptionStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { creatorId } = req.query;

      if (!creatorId) {
        return ApiResponse.error(res, 'creatorId is required', 400);
      }

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: id,
          creatorId: creatorId,
          status: 'ACTIVE',
        },
      });

      return ApiResponse.success(res, { isSubscriber: !!subscription }, 'Subscription status retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has ever tipped a creator
   */
  async getHasTipped(req, res, next) {
    try {
      const { id } = req.params;
      const { creatorId } = req.query;

      if (!creatorId) {
        return ApiResponse.error(res, 'creatorId is required', 400);
      }

      const tip = await prisma.tip.findFirst({
        where: {
          fromUserId: id,
          toCreatorId: creatorId,
        },
      });

      return ApiResponse.success(res, { hasTipped: !!tip }, 'Tip status retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
