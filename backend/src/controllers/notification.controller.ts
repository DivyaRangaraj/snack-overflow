import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly, limit = '20', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: { id: true, snackName: true, status: true, category: true },
          },
        },
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (notification.userId !== userId) {
      throw new AuthorizationError('You can only update your own notifications');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      notification: updated,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      message: 'All notifications marked as read',
      count: result.count,
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
};
