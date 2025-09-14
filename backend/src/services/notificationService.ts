import Expense from '../models/Expense';
import Budget from '../models/Budget';
import User from '../models/User';
import { Types } from 'mongoose';

export interface Notification {
  id: string;
  type: 'budget_overspend' | 'unusual_spending';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  amount?: number;
  category?: string;
  createdAt: Date;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Get user to check dismissed notifications
    const user = await User.findById(userId);
    const dismissedIds = user?.dismissedNotifications || [];

    // Check budget overspending
    const budgetNotifications = await this.checkBudgetOverspending(userId);
    notifications.push(...budgetNotifications.filter(n => !dismissedIds.includes(n.id)));

    // Check unusual spending patterns
    const unusualNotifications = await this.checkUnusualSpending(userId);
    notifications.push(...unusualNotifications.filter(n => !dismissedIds.includes(n.id)));

    // Sort by severity and date
    return notifications.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private static async checkBudgetOverspending(userId: string): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get current month's budget
    const budget = await Budget.findOne({
      userId: new Types.ObjectId(userId),
      month: currentMonth,
      year: currentYear
    });

    if (!budget) return notifications;

    // Get total expenses for current month
    const monthlyExpenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });

    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const budgetAmount = budget.amount;

    if (totalSpent > budgetAmount) {
      const overspendAmount = totalSpent - budgetAmount;
      const percentageOver = Math.round((overspendAmount / budgetAmount) * 100);

      notifications.push({
        id: `budget-${currentMonth}-${currentYear}`,
        type: 'budget_overspend',
        title: 'Budget Overspending Alert',
        message: `You've exceeded your monthly budget by ₹${overspendAmount.toLocaleString()} (${percentageOver}%). Consider reviewing your expenses.`,
        severity: percentageOver > 50 ? 'high' : percentageOver > 20 ? 'medium' : 'low',
        amount: overspendAmount,
        createdAt: new Date()
      });
    }

    return notifications;
  }

  private static async checkUnusualSpending(userId: string): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get today's expenses
    const todayExpenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    if (todayTotal === 0) return notifications;

    // Get average daily spending for the last 30 days (excluding today)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pastExpenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: {
        $gte: thirtyDaysAgo,
        $lt: today
      }
    });

    if (pastExpenses.length < 7) return notifications; // Need at least a week of data

    const dailyTotals: { [key: string]: number } = {};
    pastExpenses.forEach(expense => {
      const dayKey = expense.date.toISOString().split('T')[0];
      dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + expense.amount;
    });

    const dailyAmounts = Object.values(dailyTotals);
    const averageDaily = dailyAmounts.reduce((sum, amount) => sum + amount, 0) / dailyAmounts.length;

    // Check if today is significantly higher than average
    const threshold = averageDaily * 2; // 2x average
    if (todayTotal > threshold) {
      const multiplier = Math.round((todayTotal / averageDaily) * 10) / 10;
      notifications.push({
        id: `unusual-${today.toISOString().split('T')[0]}`,
        type: 'unusual_spending',
        title: 'Unusual Spending Detected',
        message: `Today's spending (₹${todayTotal.toLocaleString()}) is ${multiplier}x your average daily spending. Review your expenses for any unexpected charges.`,
        severity: multiplier > 3 ? 'high' : 'medium',
        amount: todayTotal,
        createdAt: new Date()
      });
    }

    return notifications;
  }

  static async dismissNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      if (!user.dismissedNotifications.includes(notificationId)) {
        user.dismissedNotifications.push(notificationId);
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }
}
