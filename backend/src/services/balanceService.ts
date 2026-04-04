import UserWalletBalance, { WalletBucketKey } from '../models/UserWalletBalance';
import { Types } from 'mongoose';
import type { ExpensePaymentMethod } from '../models/Expense';

/** UPI is treated as bank account; cash and card map directly. */
export function paymentMethodToBucket(
  paymentMethod?: ExpensePaymentMethod | string | null
): WalletBucketKey {
  if (paymentMethod === 'cash') return 'cash';
  if (paymentMethod === 'upi') return 'bank';
  return 'creditCard';
}

export class BalanceService {
  static async getOrCreate(userId: string): Promise<{
    bank: number;
    creditCard: number;
    cash: number;
    total: number;
    updatedAt: Date;
  }> {
    let doc = await UserWalletBalance.findOne({ userId: new Types.ObjectId(userId) });
    if (!doc) {
      doc = await UserWalletBalance.create({
        userId: new Types.ObjectId(userId),
        bank: 0,
        creditCard: 0,
        cash: 0
      });
    }
    const bank = doc.bank ?? 0;
    const creditCard = doc.creditCard ?? 0;
    const cash = doc.cash ?? 0;
    return {
      bank,
      creditCard,
      cash,
      total: bank + creditCard + cash,
      updatedAt: doc.updatedAt
    };
  }

  static async incrementBucket(
    userId: string,
    bucket: WalletBucketKey,
    delta: number
  ): Promise<void> {
    const key = bucket === 'creditCard' ? 'creditCard' : bucket;
    await UserWalletBalance.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { [key]: delta } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  static async debitForExpense(
    userId: string,
    paymentMethod: ExpensePaymentMethod | string | undefined,
    amount: number
  ): Promise<void> {
    if (amount <= 0) return;
    const bucket = paymentMethodToBucket(paymentMethod);
    await this.incrementBucket(userId, bucket, -amount);
  }

  static async creditForExpenseRemoved(
    userId: string,
    paymentMethod: ExpensePaymentMethod | string | undefined,
    amount: number
  ): Promise<void> {
    if (amount <= 0) return;
    const bucket = paymentMethodToBucket(paymentMethod);
    await this.incrementBucket(userId, bucket, amount);
  }

  static async reconcileExpenseChange(
    userId: string,
    oldPm: ExpensePaymentMethod | string | undefined,
    oldAmount: number,
    newPm: ExpensePaymentMethod | string | undefined,
    newAmount: number
  ): Promise<void> {
    const samePm = paymentMethodToBucket(oldPm) === paymentMethodToBucket(newPm);
    if (samePm && oldAmount === newAmount) return;
    await this.creditForExpenseRemoved(userId, oldPm, oldAmount);
    await this.debitForExpense(userId, newPm, newAmount);
  }

  static async setBalances(
    userId: string,
    patch: Partial<Record<WalletBucketKey, number>>
  ): Promise<ReturnType<typeof BalanceService.getOrCreate>> {
    const update: Record<string, number> = {};
    if (patch.bank !== undefined) update.bank = patch.bank;
    if (patch.creditCard !== undefined) update.creditCard = patch.creditCard;
    if (patch.cash !== undefined) update.cash = patch.cash;

    if (Object.keys(update).length === 0) {
      return this.getOrCreate(userId);
    }

    await UserWalletBalance.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return this.getOrCreate(userId);
  }

  static async addMoney(
    userId: string,
    bucket: WalletBucketKey,
    amount: number
  ): Promise<ReturnType<typeof BalanceService.getOrCreate>> {
    if (amount <= 0) return this.getOrCreate(userId);
    await this.incrementBucket(userId, bucket, amount);
    return this.getOrCreate(userId);
  }
}
