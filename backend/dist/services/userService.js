"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = __importDefault(require("@/models/User"));
const expenseService_1 = require("./expenseService");
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
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await User_1.default.findById(userId);
        if (!user) {
            return false;
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return false;
        }
        user.password = newPassword;
        await user.save();
        return true;
    }
    static async exportUserData(userId, year, month) {
        const expenses = await expenseService_1.ExpenseService.getExpenses(userId, {
            startDate: new Date(Date.UTC(year, month - 1, 1)),
            endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        });
        const header = ['Date', 'Category', 'Amount', 'Notes'];
        const rows = expenses.expenses.map(expense => [
            `"${expense.date.toISOString().split('T')[0]}"`,
            expense.category,
            expense.amount.toFixed(2),
            expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : ''
        ]);
        const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
        return csvContent;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map