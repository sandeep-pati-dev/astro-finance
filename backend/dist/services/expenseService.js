"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const mongoose_1 = require("mongoose");
class ExpenseService {
    static async createExpense(userId, expenseData) {
        let expenseDate;
        if (expenseData.date) {
            if (typeof expenseData.date === 'string') {
                const [year, month, day] = expenseData.date.split('-').map(Number);
                expenseDate = new Date(Date.UTC(year, month - 1, day));
            }
            else if (expenseData.date instanceof Date) {
                expenseDate = expenseData.date;
            }
            else {
                expenseDate = new Date();
            }
        }
        else {
            expenseDate = new Date();
        }
        const expense = new Expense_1.default({
            userId: new mongoose_1.Types.ObjectId(userId),
            ...expenseData,
            date: expenseDate
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
            if (typeof updateData.date === 'string') {
                const [year, month, day] = updateData.date.split('-').map(Number);
                updateData.date = new Date(Date.UTC(year, month - 1, day));
            }
            else if (updateData.date instanceof Date) {
                updateData.date = updateData.date;
            }
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
                startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - diffToMonday);
                startDate = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
                break;
            case 'month':
                startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                break;
            case 'year':
                startDate = new Date(Date.UTC(now.getFullYear(), 0, 1));
                break;
            default:
                startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        }
        const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const expenses = await Expense_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endOfToday }
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
            endDate: endOfToday
        };
    }
    static async getDailySpending(userId, period) {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'week':
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - diffToMonday);
                startDate = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
                break;
            case 'month':
                startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                break;
            default:
                startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        }
        const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const dailySpending = await Expense_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endOfToday }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);
        const formattedData = dailySpending.map(item => {
            const utcDate = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const localDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000);
            return {
                day: dayNames[localDate.getDay()],
                date: localDate.getDate(),
                fullDate: localDate.toISOString().split('T')[0],
                amount: item.totalAmount || 0,
                count: item.count || 0
            };
        });
        const allDays = [];
        const currentDate = new Date(startDate);
        while (currentDate < endOfToday) {
            const localDate = new Date(currentDate.getTime() + (5 * 60 + 30) * 60 * 1000);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDate.getDay()];
            const dateNumber = localDate.getDate();
            const dateStr = localDate.toISOString().split('T')[0];
            const existingData = formattedData.find(item => item.fullDate === dateStr);
            allDays.push({
                day: dayName,
                date: dateNumber,
                fullDate: dateStr,
                amount: existingData ? existingData.amount : 0,
                count: existingData ? existingData.count : 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return {
            period,
            dailySpending: allDays,
            startDate,
            endDate: endOfToday
        };
    }
    static async getExpenseSummaryForMonth(userId, year, month) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        const expenses = await Expense_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endDate }
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
            period: 'month',
            year,
            month,
            total,
            byCategory: expenses,
            startDate,
            endDate
        };
    }
    static async getDailySpendingForMonth(userId, year, month) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        const dailySpending = await Expense_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);
        const formattedData = dailySpending.map(item => {
            const utcDate = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const localDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000);
            return {
                day: dayNames[localDate.getDay()],
                date: localDate.getDate(),
                fullDate: localDate.toISOString().split('T')[0],
                amount: item.totalAmount || 0,
                count: item.count || 0
            };
        });
        const allDays = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const localDate = new Date(currentDate.getTime() + (5 * 60 + 30) * 60 * 1000);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDate.getDay()];
            const dateNumber = localDate.getDate();
            const dateStr = localDate.toISOString().split('T')[0];
            const existingData = formattedData.find(item => item.fullDate === dateStr);
            allDays.push({
                day: dayName,
                date: dateNumber,
                fullDate: dateStr,
                amount: existingData ? existingData.amount : 0,
                count: existingData ? existingData.count : 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return {
            period: 'month',
            year,
            month,
            dailySpending: allDays,
            startDate,
            endDate
        };
    }
    static async getExpenseSummaryAllPeriods(userId) {
        const [todaySummary, weekSummary, monthSummary] = await Promise.all([
            this.getExpenseSummary(userId, 'day'),
            this.getExpenseSummary(userId, 'week'),
            this.getExpenseSummary(userId, 'month')
        ]);
        return {
            today: todaySummary.total || 0,
            week: weekSummary.total || 0,
            month: monthSummary.total || 0
        };
    }
    static async getExpenseSummaryWithChanges(userId) {
        const now = new Date();
        const [currentToday, currentWeek, currentMonth] = await Promise.all([
            this.getExpenseSummary(userId, 'day'),
            this.getExpenseSummary(userId, 'week'),
            this.getExpenseSummary(userId, 'month')
        ]);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()));
        const yesterdayEnd = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1));
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const dayOfWeek = lastWeekStart.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        lastWeekStart.setDate(lastWeekStart.getDate() - diffToMonday);
        const lastWeekStartUTC = new Date(Date.UTC(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate()));
        const lastWeekEndUTC = new Date(lastWeekStartUTC);
        lastWeekEndUTC.setDate(lastWeekEndUTC.getDate() + 7);
        const lastMonthStart = new Date(now);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthStartUTC = new Date(Date.UTC(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), 1));
        const lastMonthEndUTC = new Date(Date.UTC(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0, 23, 59, 59, 999));
        const [yesterdayExpenses, lastWeekExpenses, lastMonthExpenses] = await Promise.all([
            Expense_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        date: { $gte: yesterdayStart, $lt: yesterdayEnd }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]),
            Expense_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        date: { $gte: lastWeekStartUTC, $lt: lastWeekEndUTC }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]),
            Expense_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        date: { $gte: lastMonthStartUTC, $lte: lastMonthEndUTC }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])
        ]);
        const yesterdayTotal = yesterdayExpenses.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const lastWeekTotal = lastWeekExpenses.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const lastMonthTotal = lastMonthExpenses.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const calculateChange = (current, previous) => {
            if (previous === 0)
                return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        return {
            today: {
                current: currentToday.total || 0,
                previous: yesterdayTotal,
                change: calculateChange(currentToday.total || 0, yesterdayTotal)
            },
            week: {
                current: currentWeek.total || 0,
                previous: lastWeekTotal,
                change: calculateChange(currentWeek.total || 0, lastWeekTotal)
            },
            month: {
                current: currentMonth.total || 0,
                previous: lastMonthTotal,
                change: calculateChange(currentMonth.total || 0, lastMonthTotal)
            }
        };
    }
    static async getMonthlySpendingTrends(userId, months = 6) {
        const now = new Date();
        const trends = [];
        for (let i = months - 1; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const startDate = new Date(Date.UTC(year, month - 1, 1));
            const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
            const monthlyExpenses = await Expense_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);
            const totalAmount = monthlyExpenses[0]?.totalAmount || 0;
            const count = monthlyExpenses[0]?.count || 0;
            const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            trends.push({
                month: monthNames[month - 1],
                year: year,
                fullMonth: `${monthNames[month - 1]} ${year}`,
                amount: totalAmount,
                count: count
            });
        }
        return {
            trends,
            period: `${months} months`
        };
    }
}
exports.ExpenseService = ExpenseService;
//# sourceMappingURL=expenseService.js.map