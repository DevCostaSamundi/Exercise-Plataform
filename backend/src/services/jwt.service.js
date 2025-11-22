import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';

class JwtService {
  /**
   * Generate access token
   */
  static generateAccessToken(userId, role) {
    return jwt.sign(
      { userId, role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(userId, role) {
    return {
      accessToken: this.generateAccessToken(userId, role),
      refreshToken: this.generateRefreshToken(userId),
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

export default JwtService;
