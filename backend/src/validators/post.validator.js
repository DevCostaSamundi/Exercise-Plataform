import Joi from 'joi';

/**
 * Create post validation schema
 */
export const createPostSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).optional(),
  mediaType: Joi.string().valid('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT').default('IMAGE'),
  isPublic: Joi.boolean().default(false),
  isPPV: Joi.boolean().default(false),
  ppvPrice: Joi.number().min(0).when('isPPV', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

/**
 * Update post validation schema
 */
export const updatePostSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).optional(),
  isPublic: Joi.boolean().optional(),
  isPPV: Joi.boolean().optional(),
  ppvPrice: Joi.number().min(0).optional(),
});

/**
 * Get posts query validation schema
 */
export const getPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  creatorId: Joi.string().uuid().optional(),
  mediaType: Joi.string().valid('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT').optional(),
  isPublic: Joi.boolean().optional(),
});
