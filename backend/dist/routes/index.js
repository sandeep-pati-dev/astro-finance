"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const expenseRoutes_1 = __importDefault(require("./expenseRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const budgetRoutes_1 = __importDefault(require("./budgetRoutes"));
const goalRoutes_1 = __importDefault(require("./goalRoutes"));
const predictionRoutes_1 = __importDefault(require("./predictionRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/expenses', expenseRoutes_1.default);
router.use('/users', userRoutes_1.default);
router.use('/budgets', budgetRoutes_1.default);
router.use('/goals', goalRoutes_1.default);
router.use('/predictions', predictionRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map