import mongoose, { Document, Schema, Types } from 'mongoose';

export type WalletBucketKey = 'bank' | 'creditCard' | 'cash';

export interface IUserWalletBalance extends Document {
  userId: Types.ObjectId;
  bank: number;
  creditCard: number;
  cash: number;
  updatedAt: Date;
}

const userWalletBalanceSchema = new Schema<IUserWalletBalance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bank: { type: Number, default: 0 },
    creditCard: { type: Number, default: 0 },
    cash: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userWalletBalanceSchema.index({ userId: 1 });

export default mongoose.model<IUserWalletBalance>('UserWalletBalance', userWalletBalanceSchema);
