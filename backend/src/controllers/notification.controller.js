import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class NotificationController {
    /**
     * GET /api/v1/notifications
     * Lista notificações do usuário com filtros
     */
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const { type, unread, page = 1, limit = 20 } = req.query;

            const where = { userId };

            // Filtro por tipo
            if (type && type !== 'all') {
                where.type = type.toUpperCase();
            }

            // Filtro por não lidas
            if (unread === 'true') {
                where.unread = true;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [notifications, total, unreadCount] = await Promise.all([
                prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.notification.count({ where }),
                prisma.notification.count({ where: { userId, unread: true } }),
            ]);

            return res.status(200).json({
                status: 'success',
                data: {
                    notifications,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit)),
                    },
                    unreadCount,
                },
            });
        } catch (error) {
            logger.error('Error fetching notifications:', error);
            next(error);
        }
    }

    /**
     * GET /api/v1/notifications/unread-count
     * Retorna apenas a contagem de não lidas
     */
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;

            const unreadCount = await prisma.notification.count({
                where: { userId, unread: true },
            });

            return res.status(200).json({
                status: 'success',
                data: { unreadCount },
            });
        } catch (error) {
            logger.error('Error fetching unread count:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/notifications/: id/read
     * Marca uma notificação como lida
     */
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await prisma.notification.updateMany({
                where: { id, userId },
                data: { unread: false },
            });

            if (notification.count === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Notification not found',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Notification marked as read',
            });
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/notifications/:id/unread
     * Marca uma notificação como não lida
     */
    async markAsUnread(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await prisma.notification.updateMany({
                where: { id, userId },
                data: { unread: true },
            });

            if (notification.count === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Notification not found',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Notification marked as unread',
            });
        } catch (error) {
            logger.error('Error marking notification as unread:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/notifications/mark-all-read
     * Marca todas as notificações como lidas
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;

            await prisma.notification.updateMany({
                where: { userId, unread: true },
                data: { unread: false },
            });

            return res.status(200).json({
                status: 'success',
                message: 'All notifications marked as read',
            });
        } catch (error) {
            logger.error('Error marking all notifications as read:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/notifications/:id
     * Deleta uma notificação
     */
    async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await prisma.notification.deleteMany({
                where: { id, userId },
            });

            if (notification.count === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Notification not found',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Notification deleted',
            });
        } catch (error) {
            logger.error('Error deleting notification:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/notifications/bulk-delete
     * Deleta múltiplas notificações
     */
    async bulkDelete(req, res, next) {
        try {
            const { ids } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid notification IDs',
                });
            }

            await prisma.notification.deleteMany({
                where: {
                    id: { in: ids },
                    userId,
                },
            });

            return res.status(200).json({
                status: 'success',
                message: `${ids.length} notifications deleted`,
            });
        } catch (error) {
            logger.error('Error bulk deleting notifications:', error);
            next(error);
        }
    }
}

export default new NotificationController();