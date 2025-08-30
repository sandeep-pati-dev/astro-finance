"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const Expense_1 = __importDefault(require("@/models/Expense"));
const mongoose_1 = require("mongoose");
class ExpenseService {
    static async createExpense(userId, expenseData) {
        const expense = new Expense_1.default({
            userId: new mongoose_1.Types.ObjectId(userId),
            ...expenseData,
            date: expenseData.date ? new Date(expenseData.date) : new Date()
        });
        return expense.save();
    }
    static async getExpenses(userId, filters = {}) {
        const { category, startDate, endDate, limit = 10, page = 1 } = filters;
        const query = { userId: new mongoose_1.Types.ObjectId(userId) };
        if (category) {
            query.category = category;
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        const skip = (page - 1) * limit;
        const [expenses, total] = await Promise.all([
            Expense_1.default.find(query)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Expense_1.default.countDocuments(query)
        ]);
        return { expenses, total };
    }
    static async getExpenseById(userId, expenseId) {
        return Expense_1.default.findOne({
            _id: expenseId,
            userId: new mongoose_1.Types.ObjectId(userId)
        });
    }
    static async updateExpense(userId, expenseId, updateData) {
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
        return Expense_1.default.findOneAndUpdate({ _id: expenseId, userId: new mongoose_1.Types.ObjectId(userId) }, updateData, { new: true, runValidators: true });
    }
    static async deleteExpense(userId, expenseId) {
        return Expense_1.default.findOneAndDelete({
            _id: expenseId,
            userId: new mongoose_1.Types.ObjectId(userId)
        });
    }
    static async getExpenseSummary(userId, period = 'month') {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const expenses = await Expense_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);
        const total = expenses.reduce((sum, item) => sum + item.totalAmount, 0);
        return {
            period,
            total,
            byCategory: expenses,
            startDate,
            endDate: new Date()
        };
    }
}
exports.ExpenseService = ExpenseService;
//# sourceMappingURL=expenseService.js.map