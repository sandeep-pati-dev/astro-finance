"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordChangeSchema = exports.userProfileSchema = exports.expenseUpdateSchema = exports.expenseSchema = exports.loginSchema = exports.registerSchema = void 0;
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
    amount: zod_1.z.number().positive('Amount must be positive'),
    category: zod_1.z.enum(['food', 'transport', 'shopping', 'entertainment', 'bills', 'healthcare', 'education', 'other']),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional().or(zod_1.z.date().optional()),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').optional()
});
exports.expenseUpdateSchema = exports.expenseSchema.partial();
exports.userProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
    email: zod_1.z.string().email('Invalid email address').optional()
});
exports.passwordChangeSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: zod_1.z.string().min(6, 'Confirm new password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm password must match",
    path: ["confirmNewPassword"],
});
//# sourceMappingURL=validators.js.map