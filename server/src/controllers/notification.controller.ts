import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export class NotificationController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const notification = await prisma.notification.findFirst({
        where: { id, userId }
      });

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
