import { Router, Response, NextFunction } from 'express';
import { GoalService } from '../services/goalService';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { goalSchema, goalUpdateSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all goals for user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const goals = await GoalService.getGoals(userId);

    res.json({
      success: true,
      data: { goals }
    });
  } catch (error) {
    next(error);
  }
});

// Get goal progress for all goals
router.get('/progress', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const goalsProgress = await GoalService.getAllGoalsProgress(userId);

    res.json({
      success: true,
      data: { goalsProgress }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific goal by ID
router.get('/:goalId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const goal = await GoalService.getGoalById(userId, req.params.goalId);

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    res.json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
});

// Get goal progress by ID
router.get('/:goalId/progress', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const progress = await GoalService.getGoalProgress(userId, req.params.goalId);

    if (!progress) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    next(error);
  }
});

// Create new goal
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const validatedData = goalSchema.parse(req.body);

    const goal = await GoalService.createGoal(userId, {
      title: validatedData.title,
      targetAmount: validatedData.targetAmount,
      targetDate: validatedData.targetDate,
      currentSaved: validatedData.currentSaved || 0
    });

    res.status(201).json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
});

// Update goal
router.put('/:goalId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const validatedData = goalUpdateSchema.parse(req.body);

    // Filter out undefined values
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.targetAmount !== undefined) updateData.targetAmount = validatedData.targetAmount;
    if (validatedData.targetDate !== undefined) updateData.targetDate = validatedData.targetDate;
    if (validatedData.currentSaved !== undefined) updateData.currentSaved = validatedData.currentSaved;

    const goal = await GoalService.updateGoal(userId, req.params.goalId, updateData);

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    res.json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
});

// Delete goal
router.delete('/:goalId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const goal = await GoalService.deleteGoal(userId, req.params.goalId);

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Goal deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
