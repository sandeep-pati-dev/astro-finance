"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictionService_1 = require("../services/predictionService");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const period = parseInt(req.query.period) || 3;
        const predictions = await predictionService_1.PredictionService.getExpensePredictions(userId, period);
        res.json({
            success: true,
            data: { predictions }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/categories', async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const period = parseInt(req.query.period) || 3;
        const categoryPredictions = await predictionService_1.PredictionService.getCategoryPredictions(userId, period);
        res.json({
            success: true,
            data: { categoryPredictions }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=predictionRoutes.js.map