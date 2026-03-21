import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get   ('/',                notificationController.getNotifications);
router.get   ('/unread-count',    notificationController.getUnreadCount);
router.patch ('/mark-all-read',   notificationController.markAllAsRead);
router.patch ('/:id/read',        notificationController.markAsRead);
router.patch ('/:id/unread',      notificationController.markAsUnread);
router.delete('/bulk-delete',     notificationController.bulkDelete);
router.delete('/:id',             notificationController.deleteNotification);

export default router;