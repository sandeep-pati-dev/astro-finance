import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const expensePaymentMethodEnum = z.enum(['cash', 'credit_card', 'upi']);

// Expense validation schemas
export const expenseSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.enum(['food', 'groceries', 'vegetables', 'transport', 'travel', 'shopping', 'personal_care', 'entertainment', 'subscriptions', 'bills', 'healthcare', 'insurance', 'education', 'gifts', 'savings', 'investments', 'other']),
  paymentMethod: expensePaymentMethodEnum.optional(),
  date: z.union([z.string(), z.date()]).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const expenseUpdateSchema = expenseSchema.partial();

// User profile validation schemas
export const userProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  hasSeenDeveloperDialog: z.boolean().optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string().min(6)
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"]
});

// Financial Goal validators
export const goalSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.number().min(0),
  targetDate: z.string().refine(dateStr => !isNaN(Date.parse(dateStr)), {
    message: "Invalid date format"
  }),
  currentSaved: z.number().min(0).optional()
});

export const goalUpdateSchema = goalSchema.partial();

const walletBucketEnum = z.enum(['bank', 'creditCard', 'cash']);

export const balanceAddSchema = z.object({
  bucket: walletBucketEnum,
  amount: z.number().positive('Amount must be positive')
});

export const balanceSetSchema = z
  .object({
    bank: z.number().finite().optional(),
    creditCard: z.number().finite().optional(),
    cash: z.number().finite().optional()
  })
  .refine(
    (d) =>
      d.bank !== undefined || d.creditCard !== undefined || d.cash !== undefined,
    { message: 'Provide at least one balance field' }
  );

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type BalanceAddInput = z.infer<typeof balanceAddSchema>;
export type BalanceSetInput = z.infer<typeof balanceSetSchema>;
