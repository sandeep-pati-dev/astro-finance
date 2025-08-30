"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = config_1.default.port;
const server = app_1.default.listen(PORT, () => {
    logger_1.default.info(`Server running in ${config_1.default.nodeEnv} mode on port ${PORT}`);
    logger_1.default.info(`Health check available at http://localhost:${PORT}/health`);
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Process terminated');
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Process terminated');
    });
});
exports.default = server;
//# sourceMappingURL=server.js.map