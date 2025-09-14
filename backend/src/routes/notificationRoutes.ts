import { Router, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get notifications for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = typeof req.user === 'object' && req.user !== null && '_id' in req.user ? (req.user as any)._id.toString() : null;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const notifications = await NotificationService.getNotifications(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark notification as dismissed
router.post('/dismiss/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = typeof req.user === 'object' && req.user !== null && '_id' in req.user ? (req.user as any)._id.toString() : null;
    const notificationId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    if (!notificationId) {
      res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
      return;
    }

    const result = await NotificationService.dismissNotification(userId, notificationId);

    if (result) {
      res.status(200).json({
        success: true,
        message: 'Notification dismissed'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found or already dismissed'
      });
    }
  } catch (error: any) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
