"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budgetService_1 = require("../services/budgetService");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/trend/current', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const trend = await budgetService_1.BudgetService.getBudgetTrend(userId, currentMonth, currentYear);
        res.json({
            success: true,
            data: trend
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
            return;
        }
        const budget = await budgetService_1.BudgetService.getBudget(userId, month, year);
        if (!budget) {
            res.status(404).json({ success: false, error: 'Budget not found' });
            return;
        }
        res.json({
            success: true,
            data: { budget }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/usage/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
            return;
        }
        const usage = await budgetService_1.BudgetService.getBudgetUsage(userId, month, year);
        res.json({
            success: true,
            data: usage
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const { amount, categories } = req.body;
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
            return;
        }
        if (typeof amount !== 'number' || amount < 0) {
            res.status(400).json({ success: false, error: 'Invalid budget amount' });
            return;
        }
        const updatedBudget = await budgetService_1.BudgetService.updateBudget(userId, month, year, amount, categories);
        res.json({
            success: true,
            data: { budget: updatedBudget }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=budgetRoutes.js.map