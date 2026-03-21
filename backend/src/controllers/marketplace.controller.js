/**
 * Marketplace Controller
 * CRUD de produtos, gestão da loja, listagem pública.
 */

import prisma from '../config/database.js';
import {
  HTTP_STATUS,
  MARKETPLACE,
  STORE_STATUS,
  NOTIFICATION_TYPES,
  PAGINATION,
} from '../config/constants.js';

// ─────────────────────────────────────────────
// LOJA PÚBLICA — Ver produtos de uma criadora
// ─────────────────────────────────────────────

/**
 * GET /api/v1/marketplace/store/:creatorId
 * Pública. Retorna os produtos activos da loja de uma criadora.
 */
export async function getCreatorStore(req, res) {
  try {
    const { creatorId } = req.params;
    const {
      category,
      type,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
    } = req.query;

    // Verificar se a loja está activa
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { creatorId },
    });

    if (storeProfile && storeProfile.storeStatus === STORE_STATUS.BANNED) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Esta loja não está disponível.',
      });
    }

    const where = {
      creatorId,
      isActive: true,
      isChatOnly: false,
      ...(category && { category }),
      ...(type && { type }),
      ...(minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      },
    };

    const allowedSorts = ['createdAt', 'price', 'soldCount', 'viewsCount'];
    const sortField = allowedSorts.includes(sort) ? sort : 'createdAt';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          physicalQuestion: {
            select: {
              isUsed: true,
              itemCondition: true,
              hygieneState: true,
              deliveryDays: true,
            },
          },
          _count: { select: { storeReviews: true } },
        },
        orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
        skip:  (parseInt(page) - 1) * parseInt(limit),
        take:  parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    // Calcular rating médio por produto
    const productIds = products.map(p => p.id);
    const ratings = await prisma.storeReview.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, moderationStatus: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingMap = Object.fromEntries(
      ratings.map(r => [r.productId, {
        avgRating:    Math.round((r._avg.rating || 0) * 10) / 10,
        reviewCount:  r._count.rating,
      }])
    );

    const enriched = products.map(p => ({
      ...p,
      avgRating:   ratingMap[p.id]?.avgRating   || 0,
      reviewCount: ratingMap[p.id]?.reviewCount || 0,
    }));

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enriched,
      meta: {
        total,
        page:       parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        storeStatus: storeProfile?.storeStatus || STORE_STATUS.ACTIVE,
      },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * GET /api/v1/marketplace/product/:productId
 * Pública. Retorna detalhe de um produto.
 */
export async function getProduct(req, res) {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            user: { select: { username: true, avatar: true, isVerified: true } },
            storeProfile: {
              select: { storeStatus: true, storeRating: true, totalSales: true },
            },
          },
        },
        physicalQuestion: true,
        storeReviews: {
          where: { moderationStatus: 'APPROVED' },
          include: {
            buyer: { select: { username: true, avatar: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Produto não encontrado.',
      });
    }

    // Incrementar views
    await prisma.product.update({
      where: { id: productId },
      data:  { viewsCount: { increment: 1 } },
    });

    const avgRating = product.storeReviews.length > 0
      ? product.storeReviews.reduce((sum, r) => sum + r.rating, 0) / product.storeReviews.length
      : 0;

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * GET /api/v1/marketplace/explore
 * Pública. Explorar produtos de todas as criadoras.
 */
export async function exploreMarketplace(req, res) {
  try {
    const {
      category,
      type,
      minPrice,
      maxPrice,
      sort = 'soldCount',
      page = 1,
      limit = 24,
    } = req.query;

    const where = {
      isActive:   true,
      isChatOnly: false,
      creator: {
        storeProfile: {
          storeStatus: { not: STORE_STATUS.BANNED },
        },
      },
      ...(category && { category }),
      ...(type && { type }),
      ...(minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      },
    };

    const allowedSorts = ['soldCount', 'createdAt', 'price', 'viewsCount'];
    const sortField = allowedSorts.includes(sort) ? sort : 'soldCount';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              user: { select: { username: true, avatar: true } },
            },
          },
        },
        orderBy: { [sortField]: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: products,
      meta: {
        total,
        page:       parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// DASHBOARD DA CRIADORA — CRUD de produtos
// ─────────────────────────────────────────────

/**
 * GET /api/v1/marketplace/creator/products
 * Protegida (criadora). Lista todos os seus produtos.
 */
export async function getMyProducts(req, res) {
  try {
    const creatorId = req.creator.id;
    const { page = 1, limit = 20, category, isActive } = req.query;

    const where = {
      creatorId,
      ...(category  && { category }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          physicalQuestion: true,
          _count: { select: { storeReviews: true, orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: products,
      meta: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * POST /api/v1/marketplace/creator/products
 * Protegida (criadora). Cria um novo produto.
 */
export async function createProduct(req, res) {
  try {
    const creatorId = req.creator.id;

    // Verificar se a loja não está banida
    const storeProfile = await prisma.storeProfile.findUnique({ where: { creatorId } });
    if (storeProfile?.storeStatus === STORE_STATUS.BANNED) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'A tua loja está banida e não pode adicionar produtos.',
      });
    }

    const {
      name,
      description,
      category,
      type,
      price,
      floorPrice,
      images,
      videoProofUrl,
      stock,
      isUnlimited,
      digitalFileUrl,
      arweaveId,
      nftEnabled,
      nftEditionMax,
      nftRoyaltyPercent,
      nftTransferable,
      nftExpiresInDays,
      acceptsCustomInstructions,
      customDeadlineDays,
      isChatOnly,
      // Questionário físico
      physicalQuestion,
    } = req.body;

    // Validar obrigatoriedade do questionário para físicos
    if (
      (type === 'PHYSICAL' || type === 'HYBRID') &&
      !physicalQuestion
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Produtos físicos requerem o preenchimento do questionário de condição.',
      });
    }

    // Validar royalty NFT
    if (nftEnabled && nftRoyaltyPercent !== undefined) {
      if (nftRoyaltyPercent < 5 || nftRoyaltyPercent > 15) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Royalty NFT deve ser entre 5% e 15%.',
        });
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          creatorId,
          name,
          description,
          category,
          type,
          price:       parseFloat(price),
          floorPrice:  floorPrice ? parseFloat(floorPrice) : null,
          images:      images || [],
          videoProofUrl,
          stock:       stock ? parseInt(stock) : null,
          isUnlimited: Boolean(isUnlimited),
          digitalFileUrl,
          arweaveId,
          nftEnabled:         Boolean(nftEnabled),
          nftEditionMax:      nftEditionMax ? parseInt(nftEditionMax) : null,
          nftRoyaltyPercent:  nftRoyaltyPercent ? parseFloat(nftRoyaltyPercent) : 10,
          nftTransferable:    nftTransferable !== false,
          nftExpiresInDays:   nftExpiresInDays ? parseInt(nftExpiresInDays) : null,
          acceptsCustomInstructions: Boolean(acceptsCustomInstructions),
          customDeadlineDays: customDeadlineDays ? parseInt(customDeadlineDays) : 7,
          isChatOnly:         Boolean(isChatOnly),
        },
      });

      // Criar questionário físico se aplicável
      if (physicalQuestion && (type === 'PHYSICAL' || type === 'HYBRID')) {
        await tx.productPhysicalQuestion.create({
          data: {
            productId:               created.id,
            isUsed:                  physicalQuestion.isUsed,
            itemCondition:           physicalQuestion.itemCondition,
            hygieneState:            physicalQuestion.hygieneState,
            biologicalRiskConfirmed: physicalQuestion.biologicalRiskConfirmed,
            deliveryDays:            parseInt(physicalQuestion.deliveryDays),
            trackingGuarantee:       physicalQuestion.trackingGuarantee,
            noDeliveryPolicy:        physicalQuestion.noDeliveryPolicy,
            timestampPhotoUrl:       physicalQuestion.timestampPhotoUrl,
            hasVideoProof:           Boolean(physicalQuestion.hasVideoProof),
          },
        });
      }

      // Garantir que o store profile existe
      await tx.storeProfile.upsert({
        where:  { creatorId },
        update: {},
        create: {
          creatorId,
          storeStatus: STORE_STATUS.ACTIVE,
        },
      });

      return created;
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: product,
      message: 'Produto criado com sucesso!',
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * PUT /api/v1/marketplace/creator/products/:productId
 * Protegida (criadora). Edita um produto.
 */
export async function updateProduct(req, res) {
  try {
    const creatorId    = req.creator.id;
    const { productId } = req.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.creatorId !== creatorId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Produto não encontrado.',
      });
    }

    const allowedFields = [
      'name', 'description', 'price', 'floorPrice', 'images',
      'videoProofUrl', 'stock', 'isUnlimited', 'isActive',
      'nftRoyaltyPercent', 'acceptsCustomInstructions', 'customDeadlineDays',
      'isChatOnly', 'nftEnabled', 'nftEditionMax', 'nftTransferable', 'nftExpiresInDays',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data:  updateData,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * DELETE /api/v1/marketplace/creator/products/:productId
 * Soft delete — desactiva o produto.
 */
export async function deleteProduct(req, res) {
  try {
    const creatorId    = req.creator.id;
    const { productId } = req.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.creatorId !== creatorId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Produto não encontrado.',
      });
    }

    await prisma.product.update({
      where: { id: productId },
      data:  { isActive: false },
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Produto removido da loja.',
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// STORE PROFILE
// ─────────────────────────────────────────────

/**
 * GET /api/v1/marketplace/creator/store-profile
 */
export async function getMyStoreProfile(req, res) {
  try {
    const creatorId = req.creator.id;

    const profile = await prisma.storeProfile.upsert({
      where:  { creatorId },
      update: {},
      create: { creatorId },
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data: profile });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * PUT /api/v1/marketplace/creator/store-profile
 */
export async function updateMyStoreProfile(req, res) {
  try {
    const creatorId = req.creator.id;

    const allowedFields = [
      'storeDisplayName', 'storeBio', 'storeBanner',
      'acceptsCustom', 'acceptsPhysical', 'acceptsDigital', 'acceptsServices',
      'shipsFrom', 'shipsInternationally', 'defaultDeliveryDays',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const profile = await prisma.storeProfile.upsert({
      where:  { creatorId },
      update: updateData,
      create: { creatorId, ...updateData },
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data: profile });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

/**
 * POST /api/v1/marketplace/products/:productId/reviews
 * Cria avaliação de um produto (comprador autenticado).
 */
export async function createReview(req, res) {
  try {
    const userId      = req.user.id;
    const { productId } = req.params;
    const { rating, comment, images, orderItemId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rating inválido (1–5).',
      });
    }

    // Verificar se comprou o produto
    if (orderItemId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          id:      orderItemId,
          productId,
          order:   { userId, status: 'COMPLETED' },
        },
      });

      if (!orderItem) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Só podes avaliar produtos que compraste e recebeste.',
        });
      }
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false });

    const isNegative = rating <= MARKETPLACE.NEGATIVE_REVIEW_MAX_RATING;

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.storeReview.create({
        data: {
          productId,
          buyerId:    userId,
          creatorId:  product.creatorId,
          rating,
          comment,
          images:     images || [],
          isNegative,
          orderItemId,
        },
      });

      // Actualizar contadores do store profile
      if (isNegative) {
        const updatedProfile = await tx.storeProfile.update({
          where: { creatorId: product.creatorId },
          data:  { negativeReviewCount: { increment: 1 } },
        });

        // Verificar thresholds de moderação
        const count = updatedProfile.negativeReviewCount;

        if (count === MARKETPLACE.ALERT_THRESHOLD) {
          // Emitir alerta
          await tx.storeProfile.update({
            where: { creatorId: product.creatorId },
            data:  { storeStatus: STORE_STATUS.WARNING, alertSentAt5: new Date() },
          });

          const creator = await tx.creator.findUnique({
            where: { id: product.creatorId },
            select: { userId: true },
          });

          await tx.notification.create({
            data: {
              userId:    creator.userId,
              type:      NOTIFICATION_TYPES.STORE_WARNING,
              title:     '⚠️ Aviso: avaliações negativas',
              message:   `A tua loja recebeu ${count} avaliações negativas. Ao atingir 10, será automaticamente suspensa.`,
              actionUrl: '/creator/store',
            },
          });
        } else if (count >= MARKETPLACE.SUSPENSION_THRESHOLD) {
          // Suspender loja
          await tx.storeProfile.update({
            where: { creatorId: product.creatorId },
            data: {
              storeStatus: STORE_STATUS.SUSPENDED,
              suspendedAt: new Date(),
            },
          });

          const creator = await tx.creator.findUnique({
            where: { id: product.creatorId },
            select: { userId: true },
          });

          await tx.notification.create({
            data: {
              userId:    creator.userId,
              type:      NOTIFICATION_TYPES.STORE_SUSPENDED,
              title:     '🚫 Loja suspensa',
              message:   'A tua loja foi suspensa por excesso de avaliações negativas. Podes contestar em até 7 dias.',
              actionUrl: '/creator/store',
            },
          });
        }
      }

      // Recalcular rating médio do produto
      const allRatings = await tx.storeReview.aggregate({
        where:  { productId, moderationStatus: 'APPROVED' },
        _avg:   { rating: true },
        _count: { rating: true },
      });

      // Notificar criadora de nova avaliação
      const creator = await tx.creator.findUnique({
        where:  { id: product.creatorId },
        select: { userId: true },
      });

      await tx.notification.create({
        data: {
          userId:    creator.userId,
          type:      NOTIFICATION_TYPES.REVIEW_RECEIVED,
          title:     `Nova avaliação: ${'⭐'.repeat(rating)}`,
          message:   comment ? `"${comment.substring(0, 100)}..."` : 'Nova avaliação sem comentário.',
          metadata:  { productId, rating, isNegative },
          actionUrl: `/creator/store/reviews`,
        },
      });

      return created;
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: review,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Já avaliaste este produto.',
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * GET /api/v1/marketplace/creator/reviews
 * Criadora vê todas as suas avaliações.
 */
export async function getMyReviews(req, res) {
  try {
    const creatorId = req.creator.id;
    const { page = 1, limit = 20, isNegative } = req.query;

    const where = {
      creatorId,
      ...(isNegative !== undefined && { isNegative: isNegative === 'true' }),
    };

    const [reviews, total] = await Promise.all([
      prisma.storeReview.findMany({
        where,
        include: {
          product: { select: { name: true, images: true } },
          buyer:   { select: { username: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.storeReview.count({ where }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reviews,
      meta: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}