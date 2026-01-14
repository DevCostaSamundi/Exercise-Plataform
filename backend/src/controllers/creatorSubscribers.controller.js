// backend/src/controllers/creatorSubscribers.controller.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get creator's subscribers
 * GET /api/v1/creator/subscribers
 */
export const getSubscribers = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 10,
            search,
            status,
            sortBy = 'recent'
        } = req.query;

        // Buscar criador
        const creator = await prisma.creator.findUnique({
            where: { userId },
        });

        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator profile not found',
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const where = {
            creatorId: creator.id,
        };

        // Filtro de status - usar valores do enum
        if (status && status !== 'all') {
            // Mapear valores do frontend para o enum
            const statusMap = {
                'active': 'ACTIVE',
                'expired': 'EXPIRED',
                'cancelled': 'CANCELLED',
                'canceled': 'CANCELLED', // aceitar ambas as grafias
            };
            const mappedStatus = statusMap[status.toLowerCase()];
            if (mappedStatus) {
                where.status = mappedStatus;
            }
        }

        // Filtro de busca (nome ou username)
        if (search) {
            where.user = {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { displayName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Ordenação
        let orderBy = { createdAt: 'desc' }; // default: recent
        if (sortBy === 'name') {
            orderBy = { user: { displayName: 'asc' } };
        } else if (sortBy === 'amount') {
            orderBy = { amount: 'desc' };
        }

        // Buscar assinaturas
        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                            email: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: parseInt(limit),
            }),
            prisma.subscription.count({ where }),
        ]);

        // Calcular estatísticas - usar valores corretos do enum
        const [activeCount, expiredCount, cancelledCount] = await Promise.all([
            prisma.subscription.count({
                where: { creatorId: creator.id, status: 'ACTIVE' },
            }),
            prisma.subscription.count({
                where: { creatorId: creator.id, status: 'EXPIRED' },
            }),
            prisma.subscription.count({
                where: { creatorId: creator.id, status: 'CANCELLED' },
            }),
        ]);

        // Calcular MRR (Monthly Recurring Revenue) - apenas assinaturas ativas
        const activeSubscriptions = await prisma.subscription.findMany({
            where: { creatorId: creator.id, status: 'ACTIVE' },
            select: { amount: true },
        });

        const mrr = activeSubscriptions.reduce((sum, sub) => {
            return sum + (parseFloat(sub.amount) || 0);
        }, 0);

        // Formatar dados
        const formatted = subscriptions.map(sub => ({
            id: sub.id,
            user: {
                id: sub.user.id,
                name: sub.user.displayName || sub.user.username,
                displayName: sub.user.displayName,
                username: sub.user.username,
                avatar: sub.user.avatar,
            },
            status: sub.status?.toLowerCase() || 'active',
            startedAt: sub.startDate,
            endDate: sub.endDate,
            autoRenew: sub.autoRenew,
            amount: parseFloat(sub.amount) || 0,
            paymentMethod: sub.paymentMethod,
            createdAt: sub.createdAt,
        }));

        logger.info(`✅ Fetched ${formatted.length} subscribers for creator ${creator.id}`);

        res.json({
            success: true,
            data: formatted,
            stats: {
                total,
                active: activeCount,
                expired: expiredCount,
                cancelled: cancelledCount,
                // Manter 'canceled' para compatibilidade com frontend
                canceled: cancelledCount,
                mrr: Math.round(mrr * 100) / 100,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        logger.error('Error fetching subscribers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscribers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Get single subscriber details
 * GET /api/v1/creator/subscribers/:id
 */
export const getSubscriberDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const creator = await prisma.creator.findUnique({
            where: { userId },
        });

        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator profile not found',
            });
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                id,
                creatorId: creator.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found',
            });
        }

        res.json({
            success: true,
            data: {
                id: subscription.id,
                user: subscription.user,
                status: subscription.status?.toLowerCase(),
                startedAt: subscription.startDate,
                endDate: subscription.endDate,
                autoRenew: subscription.autoRenew,
                amount: parseFloat(subscription.amount) || 0,
                paymentMethod: subscription.paymentMethod,
            },
        });
    } catch (error) {
        logger.error('Error fetching subscriber details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriber details',
        });
    }
};

export default {
    getSubscribers,
    getSubscriberDetails,
};