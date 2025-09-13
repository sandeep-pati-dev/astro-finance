"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalService = void 0;
const FinancialGoal_1 = __importDefault(require("../models/FinancialGoal"));
const mongoose_1 = require("mongoose");
class GoalService {
    static async createGoal(userId, goalData) {
        const goal = new FinancialGoal_1.default({
            userId: new mongoose_1.Types.ObjectId(userId),
            ...goalData,
            targetDate: new Date(goalData.targetDate),
            currentSaved: goalData.currentSaved || 0
        });
        return goal.save();
    }
    static async getGoals(userId) {
        return FinancialGoal_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId)
        }).sort({ targetDate: 1, createdAt: -1 });
    }
    static async getGoalById(userId, goalId) {
        return FinancialGoal_1.default.findOne({
            _id: goalId,
            userId: new mongoose_1.Types.ObjectId(userId)
        });
    }
    static async updateGoal(userId, goalId, updateData) {
        if (updateData.targetDate) {
            updateData.targetDate = new Date(updateData.targetDate).toISOString();
        }
        return FinancialGoal_1.default.findOneAndUpdate({ _id: goalId, userId: new mongoose_1.Types.ObjectId(userId) }, updateData, { new: true, runValidators: true });
    }
    static async deleteGoal(userId, goalId) {
        return FinancialGoal_1.default.findOneAndDelete({
            _id: goalId,
            userId: new mongoose_1.Types.ObjectId(userId)
        });
    }
    static async getGoalProgress(userId, goalId) {
        const goal = await this.getGoalById(userId, goalId);
        if (!goal)
            return null;
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
                isOnTrack: goal.currentSaved >= (goal.targetAmount * (1 - (daysLeft / (daysLeft + 30))))
            }
        };
    }
    static async getAllGoalsProgress(userId) {
        const goals = await this.getGoals(userId);
        const progressPromises = goals.map(goal => this.getGoalProgress(userId, goal._id.toString()));
        const progressResults = await Promise.all(progressPromises);
        return progressResults.filter(result => result !== null);
    }
}
exports.GoalService = GoalService;
//# sourceMappingURL=goalService.js.map