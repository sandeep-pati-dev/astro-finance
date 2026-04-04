import Expense, { IExpense } from '../models/Expense';
import { ExpenseInput, ExpenseUpdateInput } from '../utils/validators';
import { Types } from 'mongoose';

export type ExpensePaymentMethodFilter = 'all' | 'cash' | 'credit_card' | 'upi';

export class ExpenseService {
  private static normalizePaymentFilter(paymentMethod?: string): ExpensePaymentMethodFilter {
    const allowed: ExpensePaymentMethodFilter[] = ['all', 'cash', 'credit_card', 'upi'];
    if (paymentMethod && allowed.includes(paymentMethod as ExpensePaymentMethodFilter)) {
      return paymentMethod as ExpensePaymentMethodFilter;
    }
    return 'all';
  }

  /** Merges payment-method constraint into a Mongo query or $match object (mutates `query`). */
  static applyPaymentToQuery(query: Record<string, unknown>, paymentMethod?: string): void {
    const f = ExpenseService.normalizePaymentFilter(paymentMethod);
    if (f === 'all') return;
    if (f === 'credit_card') {
      query.$or = [
        { paymentMethod: 'credit_card' },
        { paymentMethod: { $exists: false } },
        { paymentMethod: null }
      ];
    } else {
      (query as { paymentMethod: string }).paymentMethod = f;
    }
  }

  static async createExpense(userId: string, expenseData: ExpenseInput): Promise<IExpense> {
    let expenseDate: Date;
    
    if (expenseData.date) {
      if (typeof expenseData.date === 'string') {
        // Parse the date string and create UTC date that represents the local date
        const [year, month, day] = expenseData.date.split('-').map(Number);
        // Create date in UTC that represents the intended local date
        // This ensures the date stored in MongoDB matches the local date
        expenseDate = new Date(Date.UTC(year, month - 1, day));
      } else if (expenseData.date instanceof Date) {
        expenseDate = expenseData.date;
      } else {
        expenseDate = new Date();
      }
    } else {
      expenseDate = new Date();
    }
    
    const expense = new Expense({
      userId: new Types.ObjectId(userId),
      ...expenseData,
      date: expenseDate
    });
    
    return expense.save();
  }

  static async getExpenses(userId: string, filters: {
    category?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    page?: number;
  } = {}): Promise<{ expenses: IExpense[]; total: number }> {
    const { category, paymentMethod, startDate, endDate, limit = 10, page = 1 } = filters;
    
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    
    if (category) {
      query.category = category;
    }

    ExpenseService.applyPaymentToQuery(query, paymentMethod);
    
    if (startDate || endDate) {
      (query as { date: { $gte?: Date; $lte?: Date } }).date = {};
      const d = (query as { date: { $gte?: Date; $lte?: Date } }).date;
      if (startDate) d.$gte = startDate;
      if (endDate) d.$lte = endDate;
    }

    const skip = (page - 1) * limit;
    
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(query)
    ]);

    return { expenses, total };
  }

  static async getExpenseById(userId: string, expenseId: string): Promise<IExpense | null> {
    return Expense.findOne({
      _id: expenseId,
      userId: new Types.ObjectId(userId)
    });
  }

  static async updateExpense(
    userId: string,
    expenseId: string,
    updateData: ExpenseUpdateInput
  ): Promise<IExpense | null> {
    if (updateData.date) {
      if (typeof updateData.date === 'string') {
        // Parse the date string and create UTC date that represents the local date
        const [year, month, day] = updateData.date.split('-').map(Number);
        updateData.date = new Date(Date.UTC(year, month - 1, day));
      } else if (updateData.date instanceof Date) {
        // Already a Date object, keep as is
        updateData.date = updateData.date;
      }
    }
    
    return Expense.findOneAndUpdate(
      { _id: expenseId, userId: new Types.ObjectId(userId) },
      updateData,
      { new: true, runValidators: true }
    );
  }

  static async deleteExpense(userId: string, expenseId: string): Promise<IExpense | null> {
    return Expense.findOneAndDelete({
      _id: expenseId,
      userId: new Types.ObjectId(userId)
    });
  }

  static async getExpenseSummary(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    paymentMethod?: string
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        // Start of today in local time, converted to UTC
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        break;
      case 'week':
        // Start of current week (Monday) in local time, converted to UTC
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        startDate = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
        break;
      case 'month':
        // Start of current month in local time, converted to UTC
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'year':
        // Start of current year in local time, converted to UTC
        startDate = new Date(Date.UTC(now.getFullYear(), 0, 1));
        break;
      default:
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    }

    // End date should be end of today in UTC
    const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endOfToday }
    };
    ExpenseService.applyPaymentToQuery(match, paymentMethod);

    const expenses = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    const total = expenses.reduce((sum: number, item: any) => sum + item.totalAmount, 0);

    return {
      period,
      total,
      byCategory: expenses,
      startDate,
      endDate: endOfToday,
      paymentMethod: ExpenseService.normalizePaymentFilter(paymentMethod)
    };
  }

  static async getDailySpending(userId: string, period: 'week' | 'month', paymentMethod?: string): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        // Get start of current week (Monday) in local time, converted to UTC
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        startDate = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
        break;
      case 'month':
        // Start of current month in local time, converted to UTC
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      default:
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    }

    // End date should be end of today in UTC
    const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    const matchDaily: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endOfToday }
    };
    ExpenseService.applyPaymentToQuery(matchDaily, paymentMethod);

    const dailySpending = await Expense.aggregate([
      { $match: matchDaily },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const formattedData = dailySpending.map(item => {
      // Create UTC date from the UTC date parts
      const utcDate = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Convert UTC date to local date for display
      const localDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000); // Add 5:30 hours for India timezone
      
      return {
        day: dayNames[localDate.getDay()],
        date: localDate.getDate(), // Add the date number
        fullDate: localDate.toISOString().split('T')[0],
        amount: item.totalAmount || 0,
        count: item.count || 0
      };
    });

    // Fill in missing days with zero amounts
    const allDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endOfToday) {
      // Convert UTC date to local date for display
      const localDate = new Date(currentDate.getTime() + (5 * 60 + 30) * 60 * 1000); // Add 5:30 hours for India timezone
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDate.getDay()];
      const dateNumber = localDate.getDate();
      const dateStr = localDate.toISOString().split('T')[0];
      
      const existingData = formattedData.find(item => item.fullDate === dateStr);
      
      allDays.push({
        day: dayName,
        date: dateNumber, // Add the date number
        fullDate: dateStr,
        amount: existingData ? existingData.amount : 0,
        count: existingData ? existingData.count : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period,
      dailySpending: allDays,
      startDate,
      endDate: endOfToday,
      paymentMethod: ExpenseService.normalizePaymentFilter(paymentMethod)
    };
  }

  static async getExpenseSummaryForMonth(
    userId: string,
    year: number,
    month: number,
    paymentMethod?: string
  ): Promise<any> {
    // Use UTC dates for start and end of month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const matchMonth: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    };
    ExpenseService.applyPaymentToQuery(matchMonth, paymentMethod);

    const expenses = await Expense.aggregate([
      { $match: matchMonth },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    const total = expenses.reduce((sum: number, item: any) => sum + item.totalAmount, 0);

    return {
      period: 'month',
      year,
      month,
      total,
      byCategory: expenses,
      startDate,
      endDate,
      paymentMethod: ExpenseService.normalizePaymentFilter(paymentMethod)
    };
  }

  static async getDailySpendingForMonth(
    userId: string,
    year: number,
    month: number,
    paymentMethod?: string
  ): Promise<any> {
    // Use UTC dates for start and end of month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const matchMonthDaily: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    };
    ExpenseService.applyPaymentToQuery(matchMonthDaily, paymentMethod);

    const dailySpending = await Expense.aggregate([
      { $match: matchMonthDaily },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const formattedData = dailySpending.map(item => {
      // Create UTC date from the UTC date parts
      const utcDate = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Convert UTC date to local date for display
      const localDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000); // Add 5:30 hours for India timezone
      
      return {
        day: dayNames[localDate.getDay()],
        date: localDate.getDate(), // Add the date number
        fullDate: localDate.toISOString().split('T')[0],
        amount: item.totalAmount || 0,
        count: item.count || 0
      };
    });

    const allDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Convert UTC date to local date for display
      const localDate = new Date(currentDate.getTime() + (5 * 60 + 30) * 60 * 1000); // Add 5:30 hours for India timezone
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDate.getDay()];
      const dateNumber = localDate.getDate();
      const dateStr = localDate.toISOString().split('T')[0];
      
      const existingData = formattedData.find(item => item.fullDate === dateStr);
      
      allDays.push({
        day: dayName,
        date: dateNumber, // Add the date number
        fullDate: dateStr,
        amount: existingData ? existingData.amount : 0,
        count: existingData ? existingData.count : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period: 'month',
      year,
      month,
      dailySpending: allDays,
      startDate,
      endDate,
      paymentMethod: ExpenseService.normalizePaymentFilter(paymentMethod)
    };
  }

  static async getExpenseSummaryAllPeriods(userId: string): Promise<{ today: number; week: number; month: number }> {
    // Get summaries for all three periods
    const [todaySummary, weekSummary, monthSummary] = await Promise.all([
      this.getExpenseSummary(userId, 'day'),
      this.getExpenseSummary(userId, 'week'),
      this.getExpenseSummary(userId, 'month')
    ]);

    return {
      today: todaySummary.total || 0,
      week: weekSummary.total || 0,
      month: monthSummary.total || 0
    };
  }

  static async getExpenseSummaryWithChanges(userId: string): Promise<{
    today: { current: number; previous: number; change: number };
    week: { current: number; previous: number; change: number };
    month: { current: number; previous: number; change: number };
  }> {
    const now = new Date();
    
    // Get current period totals
    const [currentToday, currentWeek, currentMonth] = await Promise.all([
      this.getExpenseSummary(userId, 'day'),
      this.getExpenseSummary(userId, 'week'),
      this.getExpenseSummary(userId, 'month')
    ]);

    // Get previous period totals
    // For today: get yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()));
    const yesterdayEnd = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1));
    
    // For week: get previous week
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const dayOfWeek = lastWeekStart.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    lastWeekStart.setDate(lastWeekStart.getDate() - diffToMonday);
    const lastWeekStartUTC = new Date(Date.UTC(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate()));
    const lastWeekEndUTC = new Date(lastWeekStartUTC);
    lastWeekEndUTC.setDate(lastWeekEndUTC.getDate() + 7);

    // For month: get previous month
    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    const lastMonthStartUTC = new Date(Date.UTC(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), 1));
    const lastMonthEndUTC = new Date(Date.UTC(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0, 23, 59, 59, 999));

    const [yesterdayExpenses, lastWeekExpenses, lastMonthExpenses] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: yesterdayStart, $lt: yesterdayEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: lastWeekStartUTC, $lt: lastWeekEndUTC }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: lastMonthStartUTC, $lte: lastMonthEndUTC }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const yesterdayTotal = yesterdayExpenses.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
    const lastWeekTotal = lastWeekExpenses.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      today: {
        current: currentToday.total || 0,
        previous: yesterdayTotal,
        change: calculateChange(currentToday.total || 0, yesterdayTotal)
      },
      week: {
        current: currentWeek.total || 0,
        previous: lastWeekTotal,
        change: calculateChange(currentWeek.total || 0, lastWeekTotal)
      },
      month: {
        current: currentMonth.total || 0,
        previous: lastMonthTotal,
        change: calculateChange(currentMonth.total || 0, lastMonthTotal)
      }
    };
  }

  static async getMonthlySpendingTrends(userId: string, months: number = 6): Promise<any> {
    const now = new Date();
    const trends = [];

    // Get data for the last 'months' months
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const monthlyExpenses = await Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalAmount = monthlyExpenses[0]?.totalAmount || 0;
      const count = monthlyExpenses[0]?.count || 0;

      // Get month name
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      trends.push({
        month: monthNames[month - 1],
        year: year,
        fullMonth: `${monthNames[month - 1]} ${year}`,
        amount: totalAmount,
        count: count
      });
    }

    return {
      trends,
      period: `${months} months`
    };
  }
}
