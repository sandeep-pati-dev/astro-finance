import { Router, Response, NextFunction } from 'express';
import { BudgetService } from '@/services/budgetService';
import { authenticate, AuthRequest } from '@/middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get budget trend for current month
router.get('/trend/current', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const trend = await BudgetService.getBudgetTrend(userId, currentMonth, currentYear);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
});

// Get budget for a month/year
router.get('/:year/:month', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Validate year and month parameters
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
      return;
    }

    const budget = await BudgetService.getBudget(userId, month, year);

    if (!budget) {
      res.status(404).json({ success: false, error: 'Budget not found' });
      return;
    }

    res.json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    next(error);
  }
});

// Get budget usage for a month/year
router.get('/usage/:year/:month', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Validate year and month parameters
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
      return;
    }

    const usage = await BudgetService.getBudgetUsage(userId, month, year);

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

// Update or create budget for a month/year
router.put('/:year/:month', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const { amount, categories } = req.body;

    // Validate year and month parameters
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
      return;
    }

    if (typeof amount !== 'number' || amount < 0) {
      res.status(400).json({ success: false, error: 'Invalid budget amount' });
      return;
    }

    const updatedBudget = await BudgetService.updateBudget(userId, month, year, amount, categories);

    res.json({
      success: true,
      data: { budget: updatedBudget }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
