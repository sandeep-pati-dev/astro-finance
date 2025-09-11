"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenseService_1 = require("../services/expenseService");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const { category, startDate, endDate, limit = '10', page = '1' } = req.query;
        const filters = {};
        if (category)
            filters.category = category;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (limit)
            filters.limit = parseInt(limit);
        if (page)
            filters.page = parseInt(page);
        const { expenses, total } = await expenseService_1.ExpenseService.getExpenses(userId, filters);
        res.json({
            success: true,
            data: { expenses, total, page: parseInt(page), limit: parseInt(limit) }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/summary-all', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const summary = await expenseService_1.ExpenseService.getExpenseSummaryAllPeriods(userId);
        res.json({
            success: true,
            data: { summary }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/summary-with-changes', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const summary = await expenseService_1.ExpenseService.getExpenseSummaryWithChanges(userId);
        res.json({
            success: true,
            data: { summary }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const expense = await expenseService_1.ExpenseService.getExpenseById(userId, req.params.id);
        if (!expense) {
            res.status(404).json({ success: false, error: 'Expense not found' });
            return;
        }
        res.json({
            success: true,
            data: { expense }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.expenseSchema.parse(req.body);
        const expense = await expenseService_1.ExpenseService.createExpense(userId, validatedData);
        res.status(201).json({
            success: true,
            data: { expense }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.expenseUpdateSchema.parse(req.body);
        const expense = await expenseService_1.ExpenseService.updateExpense(userId, req.params.id, validatedData);
        if (!expense) {
            res.status(404).json({ success: false, error: 'Expense not found' });
            return;
        }
        res.json({
            success: true,
            data: { expense }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const expense = await expenseService_1.ExpenseService.deleteExpense(userId, req.params.id);
        if (!expense) {
            res.status(404).json({ success: false, error: 'Expense not found' });
            return;
        }
        res.json({
            success: true,
            data: { message: 'Expense deleted successfully' }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/summary/:period?', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const period = req.params.period || 'month';
        const summary = await expenseService_1.ExpenseService.getExpenseSummary(userId, period);
        res.json({
            success: true,
            data: { summary }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/daily-summary/:period?', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const period = req.params.period || 'week';
        const dailySpending = await expenseService_1.ExpenseService.getDailySpending(userId, period);
        res.json({
            success: true,
            data: { dailySpending }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/summary/month/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const summary = await expenseService_1.ExpenseService.getExpenseSummaryForMonth(userId, year, month);
        res.json({
            success: true,
            data: { summary }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/daily-summary/month/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const dailySpending = await expenseService_1.ExpenseService.getDailySpendingForMonth(userId, year, month);
        res.json({
            success: true,
            data: { dailySpending }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/monthly-trends/:months?', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const months = req.params.months ? parseInt(req.params.months) : 6;
        const trends = await expenseService_1.ExpenseService.getMonthlySpendingTrends(userId, months);
        res.json({
            success: true,
            data: { trends }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=expenseRoutes.js.map