import Joi from 'joi';

/**
 * Create post validation schema
 */
export const createPostSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).optional(),
  
  // ✅ ADICIONADO: Validação para mediaUrls
  mediaUrls: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'Pelo menos uma mídia é obrigatória',
      'array.max': 'Máximo de 10 mídias por post',
      'any.required': 'mediaUrls é obrigatório'
    }),
  
  mediaType: Joi.string()
    .valid('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT')
    .default('IMAGE'),
  
  isPublic: Joi.boolean().default(false),
  isPPV: Joi.boolean().default(false),
  
  ppvPrice: Joi.number().min(0).when('isPPV', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
  
  // ✅ ADICIONADO: Campos extras do frontend
  tags: Joi.array().items(Joi.string()).optional().default([]),
  scheduledFor: Joi.date().iso().optional().allow(null),
});

/**
 * Update post validation schema
 */
export const updatePostSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).optional(),
  
  // ✅ ADICIONADO: Permitir atualizar mediaUrls
  mediaUrls: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(10)
    .optional(),
  
  mediaType: Joi.string()
    .valid('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT')
    .optional(),
  
  isPublic: Joi.boolean().optional(),
  isPPV: Joi.boolean().optional(),
  ppvPrice: Joi.number().min(0).optional().allow(null),
  
  tags: Joi.array().items(Joi.string()).optional(),
  scheduledFor: Joi.date().iso().optional().allow(null),
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