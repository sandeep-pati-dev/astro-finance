import { IFinancialGoal } from '../models/FinancialGoal';
export interface GoalInput {
    title: string;
    targetAmount: number;
    targetDate: string;
    currentSaved?: number;
}
export interface GoalUpdateInput {
    title?: string;
    targetAmount?: number;
    targetDate?: string;
    currentSaved?: number;
}
export declare class GoalService {
    static createGoal(userId: string, goalData: GoalInput): Promise<IFinancialGoal>;
    static getGoals(userId: string): Promise<IFinancialGoal[]>;
    static getGoalById(userId: string, goalId: string): Promise<IFinancialGoal | null>;
    static updateGoal(userId: string, goalId: string, updateData: GoalUpdateInput): Promise<IFinancialGoal | null>;
    static deleteGoal(userId: string, goalId: string): Promise<IFinancialGoal | null>;
    static getGoalProgress(userId: string, goalId: string): Promise<any>;
    static getAllGoalsProgress(userId: string): Promise<any[]>;
}
//# sourceMappingURL=goalService.d.ts.map