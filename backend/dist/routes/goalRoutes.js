"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goalService_1 = require("../services/goalService");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const goals = await goalService_1.GoalService.getGoals(userId);
        res.json({
            success: true,
            data: { goals }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/progress', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const goalsProgress = await goalService_1.GoalService.getAllGoalsProgress(userId);
        res.json({
            success: true,
            data: { goalsProgress }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:goalId', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const goal = await goalService_1.GoalService.getGoalById(userId, req.params.goalId);
        if (!goal) {
            res.status(404).json({ success: false, error: 'Goal not found' });
            return;
        }
        res.json({
            success: true,
            data: { goal }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:goalId/progress', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const progress = await goalService_1.GoalService.getGoalProgress(userId, req.params.goalId);
        if (!progress) {
            res.status(404).json({ success: false, error: 'Goal not found' });
            return;
        }
        res.json({
            success: true,
            data: { progress }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.goalSchema.parse(req.body);
        const goal = await goalService_1.GoalService.createGoal(userId, {
            title: validatedData.title,
            targetAmount: validatedData.targetAmount,
            targetDate: validatedData.targetDate,
            currentSaved: validatedData.currentSaved || 0
        });
        res.status(201).json({
            success: true,
            data: { goal }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:goalId', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.goalUpdateSchema.parse(req.body);
        const updateData = {};
        if (validatedData.title !== undefined)
            updateData.title = validatedData.title;
        if (validatedData.targetAmount !== undefined)
            updateData.targetAmount = validatedData.targetAmount;
        if (validatedData.targetDate !== undefined)
            updateData.targetDate = validatedData.targetDate;
        if (validatedData.currentSaved !== undefined)
            updateData.currentSaved = validatedData.currentSaved;
        const goal = await goalService_1.GoalService.updateGoal(userId, req.params.goalId, updateData);
        if (!goal) {
            res.status(404).json({ success: false, error: 'Goal not found' });
            return;
        }
        res.json({
            success: true,
            data: { goal }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:goalId', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const goal = await goalService_1.GoalService.deleteGoal(userId, req.params.goalId);
        if (!goal) {
            res.status(404).json({ success: false, error: 'Goal not found' });
            return;
        }
        res.json({
            success: true,
            data: { message: 'Goal deleted successfully' }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=goalRoutes.js.map