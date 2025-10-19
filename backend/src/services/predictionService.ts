import Expense from '../models/Expense';
import { Types } from 'mongoose';

export class PredictionService {
  static async getExpensePredictions(userId: string, months: number = 3): Promise<any> {
    const now = new Date();

    // Get last N months of expense data
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const expenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: monthsAgo }
    }).sort({ date: -1 });

    if (expenses.length === 0) {
      return {
        nextMonthPrediction: 0,
        averageMonthlySpending: 0,
        trend: 'stable',
        confidence: 'low',
        basedOnMonths: 0,
        predictionRange: { min: 0, max: 0 },
        historicalData: []
      };
    }

    // Group expenses by month
    const monthlySpending: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + expense.amount;
    });

    const monthlyAmounts = Object.values(monthlySpending);
    const sortedMonths = Object.keys(monthlySpending).sort();

    // Weighted average (recent months have higher weight)
    const weights = monthlyAmounts.map((_, index) => Math.pow(1.2, index)); // Exponential weighting
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedAverage = monthlyAmounts.reduce((sum, amount, index) => sum + (amount * weights[index]), 0) / totalWeight;

    // Proper linear regression for trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let slope = 0;
    if (monthlyAmounts.length >= 2) {
      const n = monthlyAmounts.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = monthlyAmounts;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
      const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);

      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      // Use standard deviation for threshold
      const meanY = sumY / n;
      const variance = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      if (slope > stdDev * 0.5) {
        trend = 'increasing';
      } else if (slope < -stdDev * 0.5) {
        trend = 'decreasing';
      }
    }

    // Predict next month using weighted average and trend
    let nextMonthPrediction = weightedAverage;
    const trendMultiplier = 1 + (slope / weightedAverage) * 0.3; // Dampened trend effect
    nextMonthPrediction *= Math.max(0.8, Math.min(1.2, trendMultiplier)); // Limit to ±20%

    // Calculate prediction range (confidence interval)
    const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - weightedAverage, 2), 0) / monthlyAmounts.length;
    const stdDev = Math.sqrt(variance);
    const confidenceMultiplier = monthlyAmounts.length >= 3 ? 1.96 : 2.58; // 95% or 99% CI
    const marginOfError = confidenceMultiplier * (stdDev / Math.sqrt(monthlyAmounts.length));
    const predictionRange = {
      min: Math.max(0, Math.round(nextMonthPrediction - marginOfError)),
      max: Math.round(nextMonthPrediction + marginOfError)
    };

    // Calculate confidence based on data availability and consistency
    let confidence: 'high' | 'medium' | 'low' = 'low';
    const cv = stdDev / weightedAverage; // Coefficient of variation
    if (monthlyAmounts.length >= 6 && cv < 0.3) {
      confidence = 'high';
    } else if (monthlyAmounts.length >= 3 && cv < 0.5) {
      confidence = 'medium';
    }

    // Prepare historical data for frontend charts
    const historicalData = sortedMonths.map(month => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: monthlySpending[month]
    }));

    return {
      nextMonthPrediction: Math.round(nextMonthPrediction),
      averageMonthlySpending: Math.round(weightedAverage),
      trend,
      confidence,
      basedOnMonths: monthlyAmounts.length,
      predictionRange,
      historicalData,
      monthlyBreakdown: monthlySpending
    };
  }

  static async getCategoryPredictions(userId: string, months: number = 3): Promise<any> {
    const now = new Date();
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const expenses = await Expense.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: monthsAgo }
    });

    // Group by category and month for better analysis
    const categoryMonthlySpending: { [category: string]: { [month: string]: number[] } } = {};

    expenses.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
      if (!categoryMonthlySpending[expense.category]) {
        categoryMonthlySpending[expense.category] = {};
      }
      if (!categoryMonthlySpending[expense.category][monthKey]) {
        categoryMonthlySpending[expense.category][monthKey] = [];
      }
      categoryMonthlySpending[expense.category][monthKey].push(expense.amount);
    });

    const categoryPredictions: { [category: string]: any } = {};

    Object.keys(categoryMonthlySpending).forEach(category => {
      const monthlyData = categoryMonthlySpending[category];
      const monthlyTotals = Object.values(monthlyData).map(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
      const allAmounts = Object.values(monthlyData).flat();

      if (monthlyTotals.length === 0) return;

      // Weighted average for recent months
      const weights = monthlyTotals.map((_, index) => Math.pow(1.2, index));
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const weightedAverage = monthlyTotals.reduce((sum, amount, index) => sum + (amount * weights[index]), 0) / totalWeight;

      // Calculate trend for category
      let categoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (monthlyTotals.length >= 2) {
        const n = monthlyTotals.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = monthlyTotals;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
        const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const meanY = sumY / n;
        const variance = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        if (slope > stdDev * 0.5) {
          categoryTrend = 'increasing';
        } else if (slope < -stdDev * 0.5) {
          categoryTrend = 'decreasing';
        }
      }

      // Predict with trend adjustment (more aggressive for categories)
      let predictedAmount = weightedAverage;
      if (categoryTrend === 'increasing') {
        predictedAmount *= 1.15; // 15% increase for categories
      } else if (categoryTrend === 'decreasing') {
        predictedAmount *= 0.85; // 15% decrease for categories
      }

      categoryPredictions[category] = {
        predictedAmount: Math.round(predictedAmount),
        averageAmount: Math.round(weightedAverage),
        transactionCount: allAmounts.length,
        trend: categoryTrend,
        monthlyBreakdown: monthlyTotals
      };
    });

    return categoryPredictions;
  }
}
