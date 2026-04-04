import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { balanceAddSchema, balanceSetSchema } from '../utils/validators';
import { BalanceService } from '../services/balanceService';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const balance = await BalanceService.getOrCreate(userId);
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const body = balanceSetSchema.parse(req.body);
    const balance = await BalanceService.setBalances(userId, {
      ...(body.bank !== undefined ? { bank: body.bank } : {}),
      ...(body.creditCard !== undefined ? { creditCard: body.creditCard } : {}),
      ...(body.cash !== undefined ? { cash: body.cash } : {})
    });
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
});

router.post('/add', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user!._id as any).toString();
    const { bucket, amount } = balanceAddSchema.parse(req.body);
    const balance = await BalanceService.addMoney(userId, bucket, amount);
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
});

export default router;
