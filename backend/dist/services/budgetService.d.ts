import { IBudget } from '../models/Budget';
export declare class BudgetService {
    static getOrCreateBudget(userId: string, month: number, year: number, defaultAmount?: number): Promise<IBudget>;
    static updateBudget(userId: string, month: number, year: number, amount: number, categories?: {
        [category: string]: number;
    }): Promise<IBudget | null>;
    static getBudget(userId: string, month: number, year: number): Promise<IBudget | null>;
    static getBudgetUsage(userId: string, month: number, year: number): Promise<{
        budget: IBudget | null;
        totalSpent: number;
        percentageUsed: number;
        categorySpending: {
            [category: string]: number;
        };
        categoryUsage: {
            [category: string]: number;
        };
    }>;
    static getBudgetTrend(userId: string, currentMonth: number, currentYear: number): Promise<{
        currentSpending: number;
        previousSpending: number;
        percentageChange: number;
        trend: 'increase' | 'decrease' | 'stable';
    }>;
    static getUserBudgets(userId: string, limit?: number): Promise<IBudget[]>;
    static deleteBudget(userId: string, month: number, year: number): Promise<boolean>;
}
//# sourceMappingURL=budgetService.d.ts.map