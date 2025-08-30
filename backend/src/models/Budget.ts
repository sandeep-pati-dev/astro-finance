import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  amount: number;
  categories?: Map<string, number>; // category-specific budget amounts
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    categories: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one budget per user per month/year
BudgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IBudget>('Budget', BudgetSchema);
