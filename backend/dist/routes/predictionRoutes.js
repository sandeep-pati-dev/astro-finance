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
        const predictions = await predictionService_1.PredictionService.getExpensePredictions(userId);
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
        const categoryPredictions = await predictionService_1.PredictionService.getCategoryPredictions(userId);
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