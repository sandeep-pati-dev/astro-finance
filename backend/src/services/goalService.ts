import FinancialGoal, { IFinancialGoal } from '../models/FinancialGoal';
import { Types } from 'mongoose';

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

export class GoalService {
  static async createGoal(userId: string, goalData: GoalInput): Promise<IFinancialGoal> {
    const goal = new FinancialGoal({
      userId: new Types.ObjectId(userId),
      ...goalData,
      targetDate: new Date(goalData.targetDate),
      currentSaved: goalData.currentSaved || 0
    });

    return goal.save();
  }

  static async getGoals(userId: string): Promise<IFinancialGoal[]> {
    return FinancialGoal.find({
      userId: new Types.ObjectId(userId)
    }).sort({ targetDate: 1, createdAt: -1 });
  }

  static async getGoalById(userId: string, goalId: string): Promise<IFinancialGoal | null> {
    return FinancialGoal.findOne({
      _id: goalId,
      userId: new Types.ObjectId(userId)
    });
  }

  static async updateGoal(
    userId: string,
    goalId: string,
    updateData: GoalUpdateInput
  ): Promise<IFinancialGoal | null> {
    if (updateData.targetDate) {
      updateData.targetDate = new Date(updateData.targetDate).toISOString();
    }

    return FinancialGoal.findOneAndUpdate(
      { _id: goalId, userId: new Types.ObjectId(userId) },
      updateData,
      { new: true, runValidators: true }
    );
  }

  static async deleteGoal(userId: string, goalId: string): Promise<IFinancialGoal | null> {
    return FinancialGoal.findOneAndDelete({
      _id: goalId,
      userId: new Types.ObjectId(userId)
    });
  }

  static async getGoalProgress(userId: string, goalId: string): Promise<any> {
    const goal = await this.getGoalById(userId, goalId);
    if (!goal) return null;

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));

    const progressPercentage = (goal.currentSaved / goal.targetAmount) * 100;
    const remainingAmount = goal.targetAmount - goal.currentSaved;
    const monthlySavingsNeeded = remainingAmount / monthsLeft;

    return {
      goal,
      progress: {
        percentage: Math.min(100, progressPercentage),
        remainingAmount: Math.max(0, remainingAmount),
        daysLeft: Math.max(0, daysLeft),
        monthsLeft,
        monthlySavingsNeeded: Math.max(0, monthlySavingsNeeded),
        isOnTrack: goal.currentSaved >= (goal.targetAmount * (1 - (daysLeft / (daysLeft + 30)))) // Rough estimate
      }
    };
  }

  static async getAllGoalsProgress(userId: string): Promise<any[]> {
    const goals = await this.getGoals(userId);
    const progressPromises = goals.map(goal => this.getGoalProgress(userId, (goal._id as any).toString()));
    const progressResults = await Promise.all(progressPromises);

    return progressResults.filter(result => result !== null);
  }
}
