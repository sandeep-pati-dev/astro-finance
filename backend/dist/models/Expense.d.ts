import mongoose, { Document, Types } from 'mongoose';
export interface IExpense extends Document {
    userId: Types.ObjectId;
    amount: number;
    category: string;
    date: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IExpense, {}, {}, {}, mongoose.Document<unknown, {}, IExpense, {}, {}> & IExpense & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Expense.d.ts.map