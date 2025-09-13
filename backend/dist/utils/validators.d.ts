import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const expenseSchema: z.ZodObject<{
    amount: z.ZodNumber;
    category: z.ZodEnum<["food", "groceries", "transport", "travel", "shopping", "personal_care", "entertainment", "subscriptions", "bills", "healthcare", "insurance", "education", "gifts", "savings", "investments", "other"]>;
    date: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodDate>]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    category: "food" | "groceries" | "transport" | "travel" | "shopping" | "personal_care" | "entertainment" | "subscriptions" | "bills" | "healthcare" | "insurance" | "education" | "gifts" | "savings" | "investments" | "other";
    date?: string | Date | undefined;
    notes?: string | undefined;
}, {
    amount: number;
    category: "food" | "groceries" | "transport" | "travel" | "shopping" | "personal_care" | "entertainment" | "subscriptions" | "bills" | "healthcare" | "insurance" | "education" | "gifts" | "savings" | "investments" | "other";
    date?: string | Date | undefined;
    notes?: string | undefined;
}>;
export declare const expenseUpdateSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodEnum<["food", "groceries", "transport", "travel", "shopping", "personal_care", "entertainment", "subscriptions", "bills", "healthcare", "insurance", "education", "gifts", "savings", "investments", "other"]>>;
    date: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodDate>]>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date?: string | Date | undefined;
    amount?: number | undefined;
    category?: "food" | "groceries" | "transport" | "travel" | "shopping" | "personal_care" | "entertainment" | "subscriptions" | "bills" | "healthcare" | "insurance" | "education" | "gifts" | "savings" | "investments" | "other" | undefined;
    notes?: string | undefined;
}, {
    date?: string | Date | undefined;
    amount?: number | undefined;
    category?: "food" | "groceries" | "transport" | "travel" | "shopping" | "personal_care" | "entertainment" | "subscriptions" | "bills" | "healthcare" | "insurance" | "education" | "gifts" | "savings" | "investments" | "other" | undefined;
    notes?: string | undefined;
}>;
export declare const userProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    hasSeenDeveloperDialog: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    hasSeenDeveloperDialog?: boolean | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    hasSeenDeveloperDialog?: boolean | undefined;
}>;
export declare const passwordChangeSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
//# sourceMappingURL=validators.d.ts.map