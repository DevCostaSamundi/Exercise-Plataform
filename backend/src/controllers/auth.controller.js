import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import JwtService from '../services/jwt.service.js';
import emailService from '../services/email.service.js';
import ApiResponse from '../utils/response.js';
import cloudinaryService from '../services/cloudinary.service.js';
import logger from '../utils/logger.js';

import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { 
        email, 
        username, 
        password, 
        displayName,
        birthDate,
        genderIdentity,
        orientation,
        firstName, 
        lastName 
      } = req.body;

      // Normalize
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim();

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
        },
      });

      if (existingUser) {
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
          displayName,
          birthDate: birthDate ? new Date(birthDate) : null,
          genderIdentity,
          orientation,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          birthDate: true,
          genderIdentity: true,
          orientation: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(user.email, user.displayName || user.username).catch((err) => {
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
   * Register a new creator (handles multipart/form-data with files)
   */
  async creatorRegister(req, res, next) {
    // We'll perform operations in a transaction and cleanup files on error
    const uploadedFiles = []; // track saved file paths for cleanup if needed

    try {
      // req.body values are strings (because multipart/form-data)
      const {
        email,
        username,
        password,
        confirmPassword,
        displayName,
        birthDate,
        genderIdentity,
        orientation,
        location,
        bio,
        subscriptionPrice,
        fullName,
        cpf,
        pixKeyType,
        pixKey,
        criptoKey,
        agreeTerms,
        ageConfirm,
        contentOwnership
      } = req.body;

      // Normalize email/username
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim();

      // Parse arrays (sent as JSON strings)
      let contentTypes = [];
      let aesthetic = [];
      try {
        if (req.body.contentTypes) contentTypes = JSON.parse(req.body.contentTypes);
        if (req.body.aesthetic) aesthetic = JSON.parse(req.body.aesthetic);
      } catch (err) {
        logger.warn('creatorRegister: could not parse array fields (contentTypes/aesthetic)', err);
      }

      // Parse booleans
      const agree = String(agreeTerms) === 'true';
      const age = String(ageConfirm) === 'true';
      const contentOwn = String(contentOwnership) === 'true';

      // Basic validation
      if (!normalizedEmail || !normalizedUsername || !password || !confirmPassword) {
        return ApiResponse.error(res, 'Missing required fields', 400);
      }
      if (password !== confirmPassword) {
        return ApiResponse.error(res, 'Passwords do not match', 400);
      }
      if (!agree || !age || !contentOwn) {
        return ApiResponse.error(res, 'You must confirm terms, age and ownership', 400);
      }
      if (!bio || bio.length < 50) {
        return ApiResponse.error(res, 'Bio must have at least 50 characters', 400);
      }

            // Check duplicates (normalize before checking)
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] }
      });
      if (existingUser) {
        return ApiResponse.error(res, 'Email or username already registered', 409);
      }



      // Files metadata (if multer was used, req.files contains them)
      const kycDocs = {};
      if (req.files) {
        if (req.files.idDocument && req.files.idDocument[0]) {
          const file = req.files.idDocument[0];
          const result = await cloudinaryService.uploadBufferToCloudinary(file.buffer, { folder: 'kyc/id_documents', resource_type: 'image' });
          kycDocs.idDocument = { url: result.secure_url, public_id: result.public_id };
        }
        if (req.files.selfieWithId && req.files.selfieWithId[0]) {
          const file = req.files.selfieWithId[0];
          const result = await cloudinaryService.uploadBufferToCloudinary(file.buffer, { folder: 'kyc/selfies', resource_type: 'image' });
          kycDocs.selfieWithId = { url: result.secure_url, public_id: result.public_id };
        }
      }


      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Use a transaction: create user (with role CREATOR) and creator profile
      const subscriptionValue = subscriptionPrice ? parseFloat(subscriptionPrice) : 0;

      const [user, creator] = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            displayName,
            birthDate: birthDate ? new Date(birthDate) : null,
            genderIdentity,
            orientation,
            // set role to CREATOR
            role: 'CREATOR'
          }
        });

        const c = await tx.creator.create({
          data: {
            userId: u.id,
            displayName: displayName || u.displayName || u.username,
            description: bio || null,
            subscriptionPrice: subscriptionValue,
            kycDocuments: Object.keys(kycDocs).length ? kycDocs : null,
            socialLinks: null,
            isVerified: false,
            kycStatus: 'PENDING',
            followersCount: 0,
            postsCount: 0
          }
        });

        return [u, c];
      });

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30
      });

      return ApiResponse.success(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
          },
          accessToken: tokens.accessToken
        },
        'Creator registration submitted',
        201
      );
    } catch (error) {
      logger.error('creatorRegister error', error);

      // cleanup uploaded files if there were any
      try {
        if (Array.isArray(uploadedFiles) && uploadedFiles.length) {
          uploadedFiles.forEach((p) => {
            fs.unlink(p, (err) => {
              if (err) logger.warn('Failed to remove uploaded file during error cleanup', p, err);
              else logger.info('Removed uploaded file during error cleanup', p);
            });
          });
        }
      } catch (cleanupErr) {
        logger.warn('Error during file cleanup', cleanupErr);
      }

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
      const refreshToken  = req.body.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) throw new UnauthorizedError('Refresh token required');
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