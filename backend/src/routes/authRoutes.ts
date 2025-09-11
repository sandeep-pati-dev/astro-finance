import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { user, token } = await AuthService.register(validatedData);

    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, token } = await AuthService.login(validatedData);

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = typeof req.user === 'object' && req.user !== null && '_id' in req.user ? (req.user as any)._id : null;
    if (!userId) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const user = await AuthService.getUserById(userId.toString());

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

// Logout user
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In a real application, you might want to:
    // 1. Add the token to a blacklist
    // 2. Invalidate refresh tokens
    // 3. Log the logout event

    // For now, we'll just return success since JWT tokens are stateless
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
