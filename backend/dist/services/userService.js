"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = __importDefault(require("@/models/User"));
class UserService {
    static async updateUserProfile(userId, updateData) {
        return User_1.default.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    }
    static async getUserProfile(userId) {
        return User_1.default.findById(userId).select('-password');
    }
    static async deleteUser(userId) {
        return User_1.default.findByIdAndDelete(userId);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map