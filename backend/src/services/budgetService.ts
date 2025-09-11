import Budget, { IBudget } from '../models/Budget';
import { ExpenseService } from './expenseService';
import { Types } from 'mongoose';

export class BudgetService {
  static async getOrCreateBudget(
    userId: string,
    month: number,
    year: number,
    defaultAmount: number = 10000
  ): Promise<IBudget> {
    const existingBudget = await Budget.findOne({
      userId: new Types.ObjectId(userId),
      month,
      year
    });

    if (existingBudget) {
      return existingBudget;
    }

    // Create a new budget with default amount if none exists
    const budget = new Budget({
      userId: new Types.ObjectId(userId),
      month,
      year,
      amount: defaultAmount
    });

    return budget.save();
  }

  static async updateBudget(
    userId: string,
    month: number,
    year: number,
    amount: number,
    categories?: { [category: string]: number }
  ): Promise<IBudget | null> {
    const budget = await Budget.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        month,
        year
      },
      {
        amount,
        ...(categories && { categories })
      },
      { new: true, upsert: true, runValidators: true }
    );

    return budget;
  }

  static async getBudget(
    userId: string,
    month: number,
    year: number
  ): Promise<IBudget | null> {
    return Budget.findOne({
      userId: new Types.ObjectId(userId),
      month,
      year
    });
  }

  static async getBudgetUsage(
    userId: string,
    month: number,
    year: number
  ): Promise<{
    budget: IBudget | null;
    totalSpent: number;
    percentageUsed: number;
    categorySpending: { [category: string]: number };
    categoryUsage: { [category: string]: number };
  }> {
    const budget = await this.getBudget(userId, month, year);
    
    // Get expense summary for the month
    const expenseSummary = await ExpenseService.getExpenseSummaryForMonth(userId, year, month);
    
    const totalSpent = expenseSummary.total || 0;
    const percentageUsed = budget && budget.amount > 0 
      ? Math.min(100, Math.round((totalSpent / budget.amount) * 100))
      : 0;

    // Calculate category spending and usage
    const categorySpending: { [category: string]: number } = {};
    const categoryUsage: { [category: string]: number } = {};

    if (expenseSummary.byCategory) {
      expenseSummary.byCategory.forEach((cat: any) => {
        const categoryName = cat._id;
        const categoryAmount = cat.totalAmount || 0;
        categorySpending[categoryName] = categoryAmount;
        
        if (budget?.categories) {
          // Access category budget directly from the Map
          const categoryBudget = budget.categories.get(categoryName) || 0;
          if (categoryBudget > 0) {
            const usagePercentage = (categoryAmount / categoryBudget) * 100;
            categoryUsage[categoryName] = Math.min(100, Math.round(usagePercentage));
          } else {
            categoryUsage[categoryName] = 0;
          }
        }
      });
    }

    return {
      budget,
      totalSpent,
      percentageUsed,
      categorySpending,
      categoryUsage
    };
  }

  static async getBudgetTrend(
    userId: string,
    currentMonth: number,
    currentYear: number
  ): Promise<{
    currentSpending: number;
    previousSpending: number;
    percentageChange: number;
    trend: 'increase' | 'decrease' | 'stable';
  }> {
    // Get current month spending
    const currentSummary = await ExpenseService.getExpenseSummaryForMonth(userId, currentYear, currentMonth);
    const currentSpending = currentSummary.total || 0;

    // Calculate previous month
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    // Get previous month spending
    const previousSummary = await ExpenseService.getExpenseSummaryForMonth(userId, previousYear, previousMonth);
    const previousSpending = previousSummary.total || 0;

    // Calculate percentage change
    let percentageChange = 0;
    let trend: 'increase' | 'decrease' | 'stable' = 'stable';

    if (previousSpending > 0) {
      percentageChange = Math.round(((currentSpending - previousSpending) / previousSpending) * 100);
      
      if (percentageChange > 5) {
        trend = 'increase';
      } else if (percentageChange < -5) {
        trend = 'decrease';
      } else {
        trend = 'stable';
      }
    } else if (currentSpending > 0) {
      percentageChange = 100; // Infinite increase from 0
      trend = 'increase';
    }

    return {
      currentSpending,
      previousSpending,
      percentageChange,
      trend
    };
  }

  static async getUserBudgets(
    userId: string,
    limit: number = 12
  ): Promise<IBudget[]> {
    return Budget.find({
      userId: new Types.ObjectId(userId)
    })
    .sort({ year: -1, month: -1 })
    .limit(limit);
  }

  static async deleteBudget(
    userId: string,
    month: number,
    year: number
  ): Promise<boolean> {
    const result = await Budget.deleteOne({
      userId: new Types.ObjectId(userId),
      month,
      year
    });

    return result.deletedCount > 0;
  }
}
