import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import JwtService from '../services/jwt.service.js';
import emailService from '../services/email.service.js';
import ApiResponse from '../utils/response.js';
import cloudinaryService from '../services/cloudinary.service.js';
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
        genderIdentity,
        orientation,
        firstName,
        lastName
      } = req.body;

      // Normalize
      const normalizedEmail = email?. trim().toLowerCase();
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
          displayName,
          birthDate: birthDate ?  new Date(birthDate) : null,
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
          isVerified: true,
          createdAt: true,
        },
      });

      logger.info('✅ User created successfully:', { id: user.id, email: user.email });

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(user.email, user.displayName || user.username). catch((err) => {
        logger.error('Failed to send welcome email:', err);
      });

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
   * Register a new creator (handles multipart/form-data with files)
   */
  async creatorRegister(req, res, next) {
    const uploadedFiles = [];

    try {
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

      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim().toLowerCase();

      let contentTypes = [];
      let aesthetic = [];
      try {
        if (req.body.contentTypes) contentTypes = JSON.parse(req.body.contentTypes);
        if (req.body.aesthetic) aesthetic = JSON.parse(req.body.aesthetic);
      } catch (err) {
        logger.warn('creatorRegister: could not parse array fields', err);
      }

      const agree = String(agreeTerms) === 'true';
      const age = String(ageConfirm) === 'true';
      const contentOwn = String(contentOwnership) === 'true';

      if (!normalizedEmail || !normalizedUsername || !password || !confirmPassword) {
        return ApiResponse.error(res, 'Missing required fields', 400);
      }
      if (password !== confirmPassword) {
        return ApiResponse.error(res, 'Passwords do not match', 400);
      }
      if (!agree || !age || !contentOwn) {
        return ApiResponse.error(res, 'You must confirm terms, age and ownership', 400);
      }
      if (! bio || bio.length < 50) {
        return ApiResponse.error(res, 'Bio must have at least 50 characters', 400);
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] }
      });
      
      if (existingUser) {
        return ApiResponse. error(res, 'Email or username already registered', 409);
      }

      const kycDocs = {};
      if (req.files) {
        if (req.files.idDocument && req.files.idDocument[0]) {
          const file = req.files.idDocument[0];
          const result = await cloudinaryService.uploadBufferToCloudinary(file. buffer, { folder: 'kyc/id_documents', resource_type: 'image' });
          kycDocs.idDocument = { url: result.secure_url, public_id: result.public_id };
        }
        if (req.files.selfieWithId && req.files.selfieWithId[0]) {
          const file = req.files.selfieWithId[0];
          const result = await cloudinaryService.uploadBufferToCloudinary(file.buffer, { folder: 'kyc/selfies', resource_type: 'image' });
          kycDocs.selfieWithId = { url: result.secure_url, public_id: result.public_id };
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
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
            role: 'CREATOR'
          }
        });

        const c = await tx.creator.create({
          data: {
            userId: u.id,
            displayName: displayName || u.displayName || u.username,
            description: bio || null,
            subscriptionPrice: subscriptionValue,
            kycDocuments: Object.keys(kycDocs).length ?  kycDocs : null,
            socialLinks: null,
            isVerified: false,
            kycStatus: 'PENDING',
          }
        });

        return [u, c];
      });

      const tokens = JwtService.generateTokens(user.id, user. role);

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
            isCreator: true,
          },
          accessToken: tokens.accessToken
        },
        'Creator registration submitted',
        201
      );
    } catch (error) {
      logger.error('creatorRegister error', error);

      try {
        if (Array.isArray(uploadedFiles) && uploadedFiles.length) {
          uploadedFiles.forEach((p) => {
            fs.unlink(p, (err) => {
              if (err) logger.warn('Failed to remove uploaded file', p, err);
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
   * Login user - ✅ CORRIGIDO
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      logger.info('🔐 Login attempt:', { email });

      // ✅ Buscar por email OU username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: email.toLowerCase() },
          ],
        },
      });

      if (!user) {
        logger.warn('❌ User not found:', email);
        throw new UnauthorizedError('Invalid credentials');
      }

      logger.info('✅ User found:', { id: user.id, email: user.email });

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (! isPasswordValid) {
        logger.warn('❌ Invalid password for:', email);
        throw new UnauthorizedError('Invalid credentials');
      }

      logger.info('✅ Password valid');

      // Check if user is active
      if (!user.isActive) {
        logger.warn('❌ Inactive account:', email);
        throw new UnauthorizedError('Account is inactive');
      }

      // Generate tokens
      const tokens = JwtService.generateTokens(user.id, user.role);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info('✅ Login successful:', { id: user.id });

      return ApiResponse.success(
        res,
        { user: userWithoutPassword, ...tokens },
        'Login successful'
      );
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) throw new UnauthorizedError('Refresh token required');
      
      const decoded = JwtService.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const accessToken = JwtService.generateAccessToken(user.id, user. role);

      return ApiResponse.success(res, { accessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
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
        return ApiResponse.success(
          res,
          null,
          'If email exists, password reset instructions have been sent'
        );
      }

      const resetToken = JwtService.generateAccessToken(user.id, user.role);

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
      const { token, password } = req. body;

      const decoded = JwtService.verifyAccessToken(token);

      const hashedPassword = await bcrypt.hash(password, 10);

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