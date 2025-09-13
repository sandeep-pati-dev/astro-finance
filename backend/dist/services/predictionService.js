"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const mongoose_1 = require("mongoose");
class PredictionService {
    static async getExpensePredictions(userId) {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const expenses = await Expense_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId),
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
        const monthlySpending = {};
        expenses.forEach(expense => {
            const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
            monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + expense.amount;
        });
        const monthlyAmounts = Object.values(monthlySpending);
        const averageMonthlySpending = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
        let trend = 'stable';
        if (monthlyAmounts.length >= 2) {
            const n = monthlyAmounts.length;
            const sumX = (n * (n - 1)) / 2;
            const sumY = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
            const sumXY = monthlyAmounts.reduce((sum, amount, index) => sum + (amount * index), 0);
            const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            if (slope > averageMonthlySpending * 0.1) {
                trend = 'increasing';
            }
            else if (slope < -averageMonthlySpending * 0.1) {
                trend = 'decreasing';
            }
        }
        let nextMonthPrediction = averageMonthlySpending;
        if (trend === 'increasing') {
            nextMonthPrediction *= 1.1;
        }
        else if (trend === 'decreasing') {
            nextMonthPrediction *= 0.9;
        }
        let confidence = 'low';
        if (monthlyAmounts.length >= 3) {
            confidence = 'high';
        }
        else if (monthlyAmounts.length >= 2) {
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
    static async getCategoryPredictions(userId) {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const expenses = await Expense_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            date: { $gte: threeMonthsAgo }
        });
        const categorySpending = {};
        expenses.forEach(expense => {
            if (!categorySpending[expense.category]) {
                categorySpending[expense.category] = [];
            }
            categorySpending[expense.category].push(expense.amount);
        });
        const categoryPredictions = {};
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
exports.PredictionService = PredictionService;
//# sourceMappingURL=predictionService.js.map