import { Router } from 'express';
import { UserService } from '@/services/userService';
import { authenticate } from '@/middlewares/authMiddleware';
import { userProfileSchema, passwordChangeSchema } from '@/utils/validators';

const router = Router();

router.use(authenticate);

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).user._id.toString();
    const user = await UserService.getUserProfile(userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).user._id.toString();
    const validatedData = userProfileSchema.parse(req.body);

    const user = await UserService.updateUserProfile(userId, validatedData);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/', async (req, res, next) => {
  try {
    const userId = (req as any).user._id.toString();
    const user = await UserService.deleteUser(userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', async (req, res, next) => {
  try {
    const userId = (req as any).user._id.toString();
    const validatedData = passwordChangeSchema.parse(req.body);

    const success = await UserService.changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword
    );

    if (!success) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Export user data for a given month
router.get('/export-data/:year/:month', async (req, res, next) => {
  try {
    const userId = (req as any).user._id.toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, error: 'Invalid year or month' });
      return;
    }

    const csvData = await UserService.exportUserData(userId, year, month);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export-${year}-${month}.csv"`);

    res.send(csvData);
  } catch (error) {
    next(error);
  }
});


export default router;
