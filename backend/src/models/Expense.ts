import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExpense extends Document {
  userId: Types.ObjectId;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      enum: ['food', 'groceries', 'transport', 'travel', 'shopping', 'personal_care', 'entertainment', 'subscriptions', 'bills', 'healthcare', 'insurance', 'education', 'gifts', 'savings', 'investments', 'other']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
