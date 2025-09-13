"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalUpdateSchema = exports.goalSchema = exports.passwordChangeSchema = exports.userProfileSchema = exports.expenseUpdateSchema = exports.expenseSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.expenseSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0, 'Amount must be positive'),
    category: zod_1.z.enum(['food', 'groceries', 'transport', 'travel', 'shopping', 'personal_care', 'entertainment', 'subscriptions', 'bills', 'healthcare', 'insurance', 'education', 'gifts', 'savings', 'investments', 'other']),
    date: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').optional()
});
exports.expenseUpdateSchema = exports.expenseSchema.partial();
exports.userProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    email: zod_1.z.string().email().optional(),
    hasSeenDeveloperDialog: zod_1.z.boolean().optional()
});
exports.passwordChangeSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
    confirmNewPassword: zod_1.z.string().min(6)
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"]
});
exports.goalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    targetAmount: zod_1.z.number().min(0),
    targetDate: zod_1.z.string().refine(dateStr => !isNaN(Date.parse(dateStr)), {
        message: "Invalid date format"
    }),
    currentSaved: zod_1.z.number().min(0).optional()
});
exports.goalUpdateSchema = exports.goalSchema.partial();
//# sourceMappingURL=validators.js.map