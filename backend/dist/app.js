"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = __importDefault(require("@/routes"));
const errorHandler_1 = require("@/middlewares/errorHandler");
const database_1 = __importDefault(require("@/utils/database"));
const config_1 = __importDefault(require("@/config"));
const app = (0, express_1.default)();
(0, database_1.default)();
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimitWindowMs,
    max: config_1.default.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use((0, cors_1.default)({
    origin: config_1.default.frontendUrl,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', routes_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map