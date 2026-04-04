import User, { IUser } from '../models/User';
import { UserProfileInput } from '../utils/validators';
import { ExpenseService } from './expenseService';

export class UserService {
  static async updateUserProfile(userId: string, updateData: UserProfileInput): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
  }

  static async getUserProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  static async deleteUser(userId: string): Promise<IUser | null> {
    return User.findByIdAndDelete(userId);
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return false;
    }

    user.password = newPassword;
    await user.save();
    return true;
  }

  static async exportUserData(userId: string, year: number, month: number): Promise<string> {
    // Fetch expenses for the given month
    const expenses = await ExpenseService.getExpenses(userId, {
      startDate: new Date(Date.UTC(year, month - 1, 1)),
      endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    });

    // Prepare CSV header
    const header = ['Date', 'Category', 'Amount', 'Payment', 'Notes'];
    const rows = expenses.expenses.map(expense => {
      const pm = (expense as { paymentMethod?: string }).paymentMethod ?? 'credit_card';
      const paymentLabel =
        pm === 'cash' ? 'Cash' : pm === 'upi' ? 'UPI' : 'Credit card';
      return [
        `"${expense.date.toISOString().split('T')[0]}"`,
        expense.category,
        expense.amount.toFixed(2),
        paymentLabel,
        expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : ''
      ];
    });

    // Combine header and rows
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');

    return csvContent;
  }
}
