import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  targetDate: Date;
  currentSaved: number;
  createdAt: Date;
  updatedAt: Date;
}

const financialGoalSchema = new Schema<IFinancialGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    targetDate: {
      type: Date,
      required: true
    },
    currentSaved: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
financialGoalSchema.index({ userId: 1, targetDate: -1 });

export default mongoose.model<IFinancialGoal>('FinancialGoal', financialGoalSchema);
