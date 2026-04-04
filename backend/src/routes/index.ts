import { Router } from 'express';
import authRoutes from './authRoutes';
import expenseRoutes from './expenseRoutes';
import userRoutes from './userRoutes';
import budgetRoutes from './budgetRoutes';
import goalRoutes from './goalRoutes';
import predictionRoutes from './predictionRoutes';
import notificationRoutes from './notificationRoutes';
import balanceRoutes from './balanceRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/balances', balanceRoutes);
router.use('/expenses', expenseRoutes);
router.use('/users', userRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/predictions', predictionRoutes);
router.use('/notifications', notificationRoutes);

export default router;
