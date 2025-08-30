import mongoose, { Document } from 'mongoose';
export interface IBudget extends Document {
    userId: mongoose.Types.ObjectId;
    month: number;
    year: number;
    amount: number;
    categories?: Map<string, number>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBudget, {}, {}, {}, mongoose.Document<unknown, {}, IBudget, {}, {}> & IBudget & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Budget.d.ts.map