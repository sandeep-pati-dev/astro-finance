"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const Budget_1 = __importDefault(require("../models/Budget"));
const expenseService_1 = require("./expenseService");
const mongoose_1 = require("mongoose");
class BudgetService {
    static async getOrCreateBudget(userId, month, year, defaultAmount = 10000) {
        const existingBudget = await Budget_1.default.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            month,
            year
        });
        if (existingBudget) {
            return existingBudget;
        }
        const budget = new Budget_1.default({
            userId: new mongoose_1.Types.ObjectId(userId),
            month,
            year,
            amount: defaultAmount
        });
        return budget.save();
    }
    static async updateBudget(userId, month, year, amount, categories) {
        const budget = await Budget_1.default.findOneAndUpdate({
            userId: new mongoose_1.Types.ObjectId(userId),
            month,
            year
        }, {
            amount,
            ...(categories && { categories })
        }, { new: true, upsert: true, runValidators: true });
        return budget;
    }
    static async getBudget(userId, month, year) {
        return Budget_1.default.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            month,
            year
        });
    }
    static async getBudgetUsage(userId, month, year) {
        const budget = await this.getBudget(userId, month, year);
        const expenseSummary = await expenseService_1.ExpenseService.getExpenseSummaryForMonth(userId, year, month);
        const totalSpent = expenseSummary.total || 0;
        const percentageUsed = budget && budget.amount > 0
            ? Math.min(100, Math.round((totalSpent / budget.amount) * 100))
            : 0;
        const categorySpending = {};
        const categoryUsage = {};
        if (expenseSummary.byCategory) {
            expenseSummary.byCategory.forEach((cat) => {
                const categoryName = cat._id;
                const categoryAmount = cat.totalAmount || 0;
                categorySpending[categoryName] = categoryAmount;
                if (budget?.categories) {
                    const categoryBudget = budget.categories.get(categoryName) || 0;
                    if (categoryBudget > 0) {
                        const usagePercentage = (categoryAmount / categoryBudget) * 100;
                        categoryUsage[categoryName] = Math.min(100, Math.round(usagePercentage));
                    }
                    else {
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
    static async getBudgetTrend(userId, currentMonth, currentYear) {
        const currentSummary = await expenseService_1.ExpenseService.getExpenseSummaryForMonth(userId, currentYear, currentMonth);
        const currentSpending = currentSummary.total || 0;
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth === 0) {
            previousMonth = 12;
            previousYear = currentYear - 1;
        }
        const previousSummary = await expenseService_1.ExpenseService.getExpenseSummaryForMonth(userId, previousYear, previousMonth);
        const previousSpending = previousSummary.total || 0;
        let percentageChange = 0;
        let trend = 'stable';
        if (previousSpending > 0) {
            percentageChange = Math.round(((currentSpending - previousSpending) / previousSpending) * 100);
            if (percentageChange > 5) {
                trend = 'increase';
            }
            else if (percentageChange < -5) {
                trend = 'decrease';
            }
            else {
                trend = 'stable';
            }
        }
        else if (currentSpending > 0) {
            percentageChange = 100;
            trend = 'increase';
        }
        return {
            currentSpending,
            previousSpending,
            percentageChange,
            trend
        };
    }
    static async getUserBudgets(userId, limit = 12) {
        return Budget_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId)
        })
            .sort({ year: -1, month: -1 })
            .limit(limit);
    }
    static async deleteBudget(userId, month, year) {
        const result = await Budget_1.default.deleteOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            month,
            year
        });
        return result.deletedCount > 0;
    }
}
exports.BudgetService = BudgetService;
//# sourceMappingURL=budgetService.js.map