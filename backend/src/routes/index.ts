import { Router } from 'express';
import authRoutes from './authRoutes';
import expenseRoutes from './expenseRoutes';
import userRoutes from './userRoutes';
import budgetRoutes from './budgetRoutes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/users', userRoutes);
router.use('/budgets', budgetRoutes);

export default router;
