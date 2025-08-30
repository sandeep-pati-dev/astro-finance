import { Router } from 'express';
import { AuthService } from '@/services/authService';
import { authenticate } from '@/middlewares/authMiddleware';
import { registerSchema, loginSchema } from '@/utils/validators';

const router = Router();

// Register new user
router.post('/register', async (req, res, next) => {
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
router.post('/login', async (req, res, next) => {
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
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await AuthService.getUserById((req as any).user._id.toString());
    
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
router.post('/logout', authenticate, async (_req, res, next) => {
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
