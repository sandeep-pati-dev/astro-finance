import { Router } from 'express';
import { ExpenseService } from '@/services/expenseService';
import { authenticate, AuthRequest } from '@/middlewares/authMiddleware';
import { expenseSchema, expenseUpdateSchema } from '@/utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all expenses with optional filtering
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const { category, startDate, endDate, limit = '10', page = '1' } = req.query;

    const filters: any = {};

    if (category) filters.category = category;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (page) filters.page = parseInt(page as string);

    const { expenses, total } = await ExpenseService.getExpenses(userId, filters);

    res.json({
      success: true,
      data: { expenses, total, page: parseInt(page as string), limit: parseInt(limit as string) }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense summary for all periods (today, week, month)
router.get('/summary-all', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const summary = await ExpenseService.getExpenseSummaryAllPeriods(userId);
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense summary with percentage changes
router.get('/summary-with-changes', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const summary = await ExpenseService.getExpenseSummaryWithChanges(userId);
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const expense = await ExpenseService.getExpenseById(userId, req.params.id);

    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
});

// Create new expense
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const validatedData = expenseSchema.parse(req.body);

    const expense = await ExpenseService.createExpense(userId, validatedData);

    res.status(201).json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const validatedData = expenseUpdateSchema.parse(req.body);

    const expense = await ExpenseService.updateExpense(userId, req.params.id, validatedData);

    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const expense = await ExpenseService.deleteExpense(userId, req.params.id);

    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Expense deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense summary
router.get('/summary/:period?', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const period = (req.params.period as 'day' | 'week' | 'month' | 'year') || 'month';

    const summary = await ExpenseService.getExpenseSummary(userId, period);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
});

// Get daily spending data
router.get('/daily-summary/:period?', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const period = (req.params.period as 'week' | 'month') || 'week';

    const dailySpending = await ExpenseService.getDailySpending(userId, period);

    res.json({
      success: true,
      data: { dailySpending }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense summary for specific month
router.get('/summary/month/:year/:month', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    const summary = await ExpenseService.getExpenseSummaryForMonth(userId, year, month);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
});

// Get daily spending for specific month
router.get('/daily-summary/month/:year/:month', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    const dailySpending = await ExpenseService.getDailySpendingForMonth(userId, year, month);

    res.json({
      success: true,
      data: { dailySpending }
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly spending trends
router.get('/monthly-trends/:months?', async (req: AuthRequest, res, next) => {
  try {
    const userId = (req.user!._id as any).toString();
    const months = req.params.months ? parseInt(req.params.months) : 6;

    // Since ExpenseService does not have getMonthlySpendingTrends, implement logic here
    const trends = await ExpenseService.getMonthlySpendingTrends(userId, months);

    res.json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
