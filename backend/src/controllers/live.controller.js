import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

class LiveController {
  /**
   * Get live configuration
   */
  async getLiveConfig(req, res, next) {
    try {
      const { id } = req.params;

      const live = await prisma.live.findUnique({
        where: { id },
        select: {
          id: true,
          creatorId: true,
          config: true,
        },
      });

      if (!live) {
        throw new NotFoundError('Live not found');
      }

      // Merge with defaults
      const config = {
        mode: 'open', // open, premium-only, tippers-only
        slowModeSeconds: 0,
        tippersWindowMinutes: 60,
        minTipToHighlight: 10,
        requireAuthToChat: false,
        bannedWords: [],
        ...(live.config || {}),
        creatorId: live.creatorId,
      };

      return ApiResponse.success(res, config, 'Live config retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new live session
   */
  async createLive(req, res, next) {
    try {
      const { config } = req.body;
      const creatorId = req.user.id;

      const live = await prisma.live.create({
        data: {
          creatorId,
          config: config || {},
        },
      });

      return ApiResponse.success(res, live, 'Live created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update live configuration
   */
  async updateLiveConfig(req, res, next) {
    try {
      const { id } = req.params;
      const { config } = req.body;

      const live = await prisma.live.findUnique({
        where: { id },
      });

      if (!live) {
        throw new NotFoundError('Live not found');
      }

      // Verify ownership
      if (live.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        return ApiResponse.error(res, 'Unauthorized', 403);
      }

      const updatedLive = await prisma.live.update({
        where: { id },
        data: { config },
      });

      return ApiResponse.success(res, updatedLive, 'Live config updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new LiveController();
