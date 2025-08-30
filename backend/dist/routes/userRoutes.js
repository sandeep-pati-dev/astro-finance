"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("@/services/userService");
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const validators_1 = require("@/utils/validators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/profile', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const user = await userService_1.UserService.getUserProfile(userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/profile', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.userProfileSchema.parse(req.body);
        const user = await userService_1.UserService.updateUserProfile(userId, validatedData);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const user = await userService_1.UserService.deleteUser(userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: { message: 'User deleted successfully' }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/change-password', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const validatedData = validators_1.passwordChangeSchema.parse(req.body);
        const success = await userService_1.UserService.changePassword(userId, validatedData.currentPassword, validatedData.newPassword);
        if (!success) {
            res.status(400).json({ success: false, error: 'Current password is incorrect' });
            return;
        }
        res.json({
            success: true,
            data: { message: 'Password changed successfully' }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/export-data/:year/:month', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, error: 'Invalid year or month' });
            return;
        }
        const csvData = await userService_1.UserService.exportUserData(userId, year, month);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export-${year}-${month}.csv"`);
        res.send(csvData);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map