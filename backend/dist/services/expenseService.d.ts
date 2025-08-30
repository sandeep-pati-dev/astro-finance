import { IExpense } from '@/models/Expense';
import { ExpenseInput, ExpenseUpdateInput } from '@/utils/validators';
export declare class ExpenseService {
    static createExpense(userId: string, expenseData: ExpenseInput): Promise<IExpense>;
    static getExpenses(userId: string, filters?: {
        category?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        page?: number;
    }): Promise<{
        expenses: IExpense[];
        total: number;
    }>;
    static getExpenseById(userId: string, expenseId: string): Promise<IExpense | null>;
    static updateExpense(userId: string, expenseId: string, updateData: ExpenseUpdateInput): Promise<IExpense | null>;
    static deleteExpense(userId: string, expenseId: string): Promise<IExpense | null>;
    static getExpenseSummary(userId: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<any>;
    static getDailySpending(userId: string, period: 'week' | 'month'): Promise<any>;
    static getExpenseSummaryForMonth(userId: string, year: number, month: number): Promise<any>;
    static getDailySpendingForMonth(userId: string, year: number, month: number): Promise<any>;
    static getExpenseSummaryAllPeriods(userId: string): Promise<{
        today: number;
        week: number;
        month: number;
    }>;
    static getExpenseSummaryWithChanges(userId: string): Promise<{
        today: {
            current: number;
            previous: number;
            change: number;
        };
        week: {
            current: number;
            previous: number;
            change: number;
        };
        month: {
            current: number;
            previous: number;
            change: number;
        };
    }>;
    static getMonthlySpendingTrends(userId: string, months?: number): Promise<any>;
}
//# sourceMappingURL=expenseService.d.ts.map