"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("@/models/User"));
const config_1 = __importDefault(require("@/config"));
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        const user = await User_1.default.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({ message: 'Token is not valid.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};
exports.authenticate = authenticate;
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, config_1.default.jwtSecret, { expiresIn: config_1.default.jwtExpiresIn });
};
exports.generateToken = generateToken;
//# sourceMappingURL=authMiddleware.js.map