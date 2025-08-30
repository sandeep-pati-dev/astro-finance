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
exports.default = router;
//# sourceMappingURL=userRoutes.js.map