import mongoose, { Document } from 'mongoose';
export interface IFinancialGoal extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    targetAmount: number;
    targetDate: Date;
    currentSaved: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFinancialGoal, {}, {}, {}, mongoose.Document<unknown, {}, IFinancialGoal, {}, {}> & IFinancialGoal & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinancialGoal.d.ts.map