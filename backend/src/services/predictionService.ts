import Expense from '../models/Expense';
import { Types } from 'mongoose';

export class PredictionService {
  static async getExpensePredictions(userId: string): Promise<any> {
    const now = new Date();

    // Get last 3 months of expense data
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const expenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: threeMonthsAgo }
    }).sort({ date: -1 });

    if (expenses.length === 0) {
      return {
        nextMonthPrediction: 0,
        averageMonthlySpending: 0,
        trend: 'stable',
        confidence: 'low',
        basedOnMonths: 0
      };
    }

    // Group expenses by month
    const monthlySpending: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + expense.amount;
    });

    const monthlyAmounts = Object.values(monthlySpending);
    const averageMonthlySpending = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;

    // Calculate trend (simple linear regression slope)
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (monthlyAmounts.length >= 2) {
      const n = monthlyAmounts.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
      const sumXY = monthlyAmounts.reduce((sum, amount, index) => sum + (amount * index), 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      if (slope > averageMonthlySpending * 0.1) {
        trend = 'increasing';
      } else if (slope < -averageMonthlySpending * 0.1) {
        trend = 'decreasing';
      }
    }

    // Predict next month based on trend and average
    let nextMonthPrediction = averageMonthlySpending;
    if (trend === 'increasing') {
      nextMonthPrediction *= 1.1; // 10% increase
    } else if (trend === 'decreasing') {
      nextMonthPrediction *= 0.9; // 10% decrease
    }

    // Calculate confidence based on data availability
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (monthlyAmounts.length >= 3) {
      confidence = 'high';
    } else if (monthlyAmounts.length >= 2) {
      confidence = 'medium';
    }

    return {
      nextMonthPrediction: Math.round(nextMonthPrediction),
      averageMonthlySpending: Math.round(averageMonthlySpending),
      trend,
      confidence,
      basedOnMonths: monthlyAmounts.length,
      monthlyBreakdown: monthlySpending
    };
  }

  static async getCategoryPredictions(userId: string): Promise<any> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const expenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: threeMonthsAgo }
    });

    // Group by category and calculate averages
    const categorySpending: { [category: string]: number[] } = {};

    expenses.forEach(expense => {
      if (!categorySpending[expense.category]) {
        categorySpending[expense.category] = [];
      }
      // Simple approach: add to monthly totals
      categorySpending[expense.category].push(expense.amount);
    });

    const categoryPredictions: { [category: string]: any } = {};

    Object.keys(categorySpending).forEach(category => {
      const amounts = categorySpending[category];
      const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

      categoryPredictions[category] = {
        predictedAmount: Math.round(average),
        averageAmount: Math.round(average),
        transactionCount: amounts.length
      };
    });

    return categoryPredictions;
  }
}
