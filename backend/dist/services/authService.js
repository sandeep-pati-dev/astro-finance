"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
class AuthService {
    static async register(userData) {
        const existingUser = await User_1.default.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const user = new User_1.default(userData);
        await user.save();
        const token = (0, authMiddleware_1.generateToken)(user._id.toString());
        return { user, token };
    }
    static async login(credentials) {
        const { email, password } = credentials;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const token = (0, authMiddleware_1.generateToken)(user._id.toString());
        return { user, token };
    }
    static async getUserById(userId) {
        return User_1.default.findById(userId).select('-password');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map