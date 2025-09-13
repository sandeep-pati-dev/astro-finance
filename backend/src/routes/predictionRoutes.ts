import { Router, Response, NextFunction } from 'express';
import { PredictionService } from '../services/predictionService';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get expense predictions for user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const predictions = await PredictionService.getExpensePredictions(userId);

    res.json({
      success: true,
      data: { predictions }
    });
  } catch (error) {
    next(error);
  }
});

// Get category-wise predictions
router.get('/categories', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const categoryPredictions = await PredictionService.getCategoryPredictions(userId);

    res.json({
      success: true,
      data: { categoryPredictions }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
