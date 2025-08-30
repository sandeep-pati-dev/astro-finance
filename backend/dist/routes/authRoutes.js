"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("@/services/authService");
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const validators_1 = require("@/utils/validators");
const router = (0, express_1.Router)();
router.post('/register', async (req, res, next) => {
    try {
        const validatedData = validators_1.registerSchema.parse(req.body);
        const { user, token } = await authService_1.AuthService.register(validatedData);
        res.status(201).json({
            success: true,
            data: { user, token }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const validatedData = validators_1.loginSchema.parse(req.body);
        const { user, token } = await authService_1.AuthService.login(validatedData);
        res.json({
            success: true,
            data: { user, token }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        const user = await authService_1.AuthService.getUserById(req.user._id.toString());
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
exports.default = router;
//# sourceMappingURL=authRoutes.js.map