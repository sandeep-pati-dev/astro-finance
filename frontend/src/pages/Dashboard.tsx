import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Calendar, IndianRupee, BarChart3, Settings, LogOut, Info, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, userApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import DeveloperInfoDialog from "@/components/ui/DeveloperInfoDialog";

interface ExpenseSummary {
  title: string;
  amount: number;
  icon: React.ElementType;
  color: string;
  change?: string;
}

interface RecentExpense {
  name: string;
  amount: number;
  category: string;
  time: string;
  originalDate: Date;
}

interface ExpenseSummaryData {
  today: number;
  week: number;
  month: number;
}

interface ExpenseSummaryWithChanges {
  today: { current: number; previous: number; change: number };
  week: { current: number; previous: number; change: number };
  month: { current: number; previous: number; change: number };
}

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ today: 0, week: 0, month: 0 });
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ExpenseSummaryData>({ today: 0, week: 0, month: 0 });
  const [summaryWithChanges, setSummaryWithChanges] = useState<ExpenseSummaryWithChanges | null>(null);
  const [showDeveloperDialog, setShowDeveloperDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Show developer dialog for new users (created within 1 day) who haven't seen it before
    if (user && user.createdAt && user.hasSeenDeveloperDialog === false) {
      setShowDeveloperDialog(true);
    }
  }, [user]);

  useEffect(() => {
    if (showDeveloperDialog) {
      // After showing the dialog, mark it as seen in backend and localStorage
      userApi.markDeveloperDialogSeen()
        .then(() => {
          localStorage.setItem('developerDialogShown', 'true');
        })
        .catch((error) => {
          console.error('Failed to mark developer dialog as seen:', error);
        });
    }
  }, [showDeveloperDialog]);

  // Real-time updates for time display
  useEffect(() => {
    if (recentExpenses.length === 0) return;

    const interval = setInterval(() => {
      setRecentExpenses(prev => prev.map(expense => ({
        ...expense,
        time: expense.originalDate.getUTCHours() === 0 && expense.originalDate.getUTCMinutes() === 0 && expense.originalDate.getUTCSeconds() === 0
          ? expense.originalDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : formatTimeAgo(expense.originalDate)
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [recentExpenses]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch expense summary with percentage changes
      const summaryResponse = await expenseApi.getExpenseSummaryWithChanges();
      if (summaryResponse.data.success) {
        const summary = summaryResponse.data.data.summary;
        setSummaryWithChanges(summary);
        setSummaryData({
          today: summary.today.current || 0,
          week: summary.week.current || 0,
          month: summary.month.current || 0
        });
        
        // Start count up animation
        const intervals = [
          { key: 'today', target: summary.today.current || 0 },
          { key: 'week', target: summary.week.current || 0 },
          { key: 'month', target: summary.month.current || 0 }
        ].map((item, index) => {
          let currentAmount = 0;
          const increment = item.target / 50;
          
          return setInterval(() => {
            currentAmount += increment;
            if (currentAmount >= item.target) {
              currentAmount = item.target;
              clearInterval(intervals[index]);
            }
            setCounts(prev => ({
              ...prev,
              [item.key]: Math.floor(currentAmount)
            }));
          }, 30);
        });
      }

      // Fetch all expenses
      const expensesResponse = await expenseApi.getExpenses();
      if (expensesResponse.data.success) {
        const expenses = expensesResponse.data.data.expenses;
      console.log("Raw expense dates:", expenses.map((e: any) => e.date || e.createdAt));
      const recent = expenses.map((expense: any) => {
        let dateStr = expense.date || expense.createdAt || "";
        // Append 'Z' if no timezone info to treat as UTC
        if (dateStr && !dateStr.match(/([zZ]|[+\-]\d{2}:\d{2})$/)) {
          dateStr += "Z";
        }
        const originalDate = new Date(dateStr);
        console.log("Parsed originalDate:", originalDate.toISOString());
        return {
          name: expense.notes || expense.category,
          amount: expense.amount,
          category: expense.category,
          time: originalDate.getUTCHours() === 0 && originalDate.getUTCMinutes() === 0 && originalDate.getUTCSeconds() === 0
            ? originalDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : formatTimeAgo(originalDate),
          originalDate: originalDate
        };
      });
        setRecentExpenses(recent);
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.userFriendlyMessage || "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    // Use UTC timestamps to avoid timezone offset issues
    const diffMs = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    ) - Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffSecs < 60) {
      return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <motion.header 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neon mb-2">Welcome back 👋</h1>
          <p className="text-secondary-foreground">Track your expenses like a pro</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setShowDeveloperDialog(true)}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
            title="About Developer"
          >
            <Info className="h-5 w-5 text-primary" />
          </Button>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
          >
            <Settings className="h-5 w-5 text-primary" />
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
          >
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "Today's Spend",
                amount: counts.today,
                icon: IndianRupee,
                color: "text-primary",
                change: summaryWithChanges?.today ? `${summaryWithChanges.today.change > 0 ? '+' : ''}${Math.round(summaryWithChanges.today.change)}%` : undefined
              },
              {
                title: "This Week",
                amount: counts.week,
                icon: Calendar,
                color: "text-neon-blue",
                change: summaryWithChanges?.week ? `${summaryWithChanges.week.change > 0 ? '+' : ''}${Math.round(summaryWithChanges.week.change)}%` : undefined
              },
              {
                title: "This Month",
                amount: counts.month,
                icon: TrendingUp,
                color: "text-accent",
                change: summaryWithChanges?.month ? `${summaryWithChanges.month.change > 0 ? '+' : ''}${Math.round(summaryWithChanges.month.change)}%` : undefined
              }
            ].map((item, index) => (
              <GlassCard
                key={item.title}
                delay={index * 0.2}
                direction={index === 0 ? "left" : index === 2 ? "right" : "up"}
                className="text-center p-4 sm:p-6"
              >
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-glow">
                    <item.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${item.color}`} />
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm text-secondary-foreground mb-2">{item.title}</h3>
                <motion.div
                  key={item.amount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
                >
                  {formatCurrency(item.amount)}
                </motion.div>

                {item.change && (
                  <span className={`text-xs sm:text-sm ${item.change.includes('-') ? 'text-destructive' : 'text-success'}`}>
                    {item.change}
                  </span>
                )}
              </GlassCard>
            ))}
          </div>

          {/* Quick Actions */}
          <GlassCard delay={0.6}>
            <h2 className="text-lg sm:text-xl font-semibold text-neon mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
          { title: "Add Expense", icon: Plus, path: "/add-expense", color: "bg-gradient-primary" },
          { title: "Analytics", icon: BarChart3, path: "/analytics", color: "bg-gradient-to-r from-accent to-neon-purple" },
          { title: "Goals", icon: Target, path: "/goals", color: "bg-gradient-to-r from-green-500 to-green-700" },
          { title: "Predictions", icon: TrendingUp, path: "/predictions", color: "bg-gradient-to-r from-purple-600 to-purple-800" },
        ].map((action, index) => (
          <motion.button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`${action.color} p-3 sm:p-4 rounded-xl text-white font-medium hover:glow-intense transition-all duration-300 hover:scale-105 text-sm sm:text-base`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <action.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
            <span className="block text-xs sm:text-sm">{action.title}</span>
          </motion.button>
        ))}
            </div>
          </GlassCard>

          {/* Recent Expenses Preview */}
          <GlassCard delay={1}>
            <h2 className="text-lg sm:text-xl font-semibold text-neon mb-4">All Activity</h2>
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl bg-background-secondary/50 gap-2 sm:gap-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{expense.name}</p>
                      <p className="text-xs sm:text-sm text-secondary-foreground truncate">{expense.category} • {expense.time}</p>
                    </div>
                    <span className="font-bold text-primary text-sm sm:text-base self-start sm:self-center">
                      {formatCurrency(expense.amount)}
                    </span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center py-6 sm:py-8 text-secondary-foreground"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                      />
                      <span className="text-sm sm:text-base">Loading expenses...</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">No recent expenses found</span>
                  )}
                </motion.div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Floating Add Button */}
      <motion.div
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={() => navigate("/add-expense")}
          size="lg"
          className="bg-gradient-primary hover:glow-intense text-primary-foreground rounded-full p-3 sm:p-4 shadow-card hover:scale-110 transition-all duration-300"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </motion.div>

      {/* Developer Info Dialog */}
      <DeveloperInfoDialog
        isOpen={showDeveloperDialog}
        onClose={() => setShowDeveloperDialog(false)}
      />
    </div>
  );
};

export default Dashboard;
