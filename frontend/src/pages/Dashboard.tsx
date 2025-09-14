import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, Calendar, IndianRupee, BarChart3, Settings, LogOut, Info, Target, Edit, Trash2, ChevronRight, Activity, Wallet, PieChart, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, userApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import DeveloperInfoDialog from "@/components/ui/DeveloperInfoDialog";
import NotificationCenter from "@/components/ui/NotificationCenter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecentExpense {
  id: string;
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
  const [expenseToDelete, setExpenseToDelete] = useState<RecentExpense | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user && user.createdAt && user.hasSeenDeveloperDialog === false) {
      setShowDeveloperDialog(true);
    }
  }, [user]);

  useEffect(() => {
    if (showDeveloperDialog) {
      userApi.markDeveloperDialogSeen()
        .then(() => {
          localStorage.setItem('developerDialogShown', 'true');
        })
        .catch((error) => {
          console.error('Failed to mark developer dialog as seen:', error);
        });
    }
  }, [showDeveloperDialog]);

  useEffect(() => {
    if (recentExpenses.length === 0) return;

    const interval = setInterval(() => {
      setRecentExpenses(prev => prev.map(expense => ({
        ...expense,
        time: expense.originalDate.getUTCHours() === 0 && expense.originalDate.getUTCMinutes() === 0 && expense.originalDate.getUTCSeconds() === 0
          ? expense.originalDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : formatTimeAgo(expense.originalDate)
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, [recentExpenses]);

  const fetchSummaryData = async () => {
    try {
      const summaryResponse = await expenseApi.getExpenseSummaryWithChanges();
      if (summaryResponse.data.success) {
        const summary = summaryResponse.data.data.summary;
        setSummaryWithChanges(summary);
        setSummaryData({
          today: summary.today.current || 0,
          week: summary.week.current || 0,
          month: summary.month.current || 0
        });

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
    } catch (error: any) {
      console.error("Error fetching summary data:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      await fetchSummaryData();

      const expensesResponse = await expenseApi.getExpenses();
      if (expensesResponse.data.success) {
        const expenses = expensesResponse.data.data.expenses;
        const recent = expenses.map((expense: any) => {
          let dateStr = expense.date || expense.createdAt || "";
          if (dateStr && !dateStr.match(/([zZ]|[+\-]\d{2}:\d{2})$/)) {
            dateStr += "Z";
          }
          const originalDate = new Date(dateStr);
          return {
            id: expense._id,
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

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await expenseApi.deleteExpense(expenseToDelete.id);
      if (response.data.success) {
        toast({
          title: "Expense Deleted",
          description: "The expense has been successfully deleted.",
        });
        setRecentExpenses(prev => prev.filter(exp => exp.id !== expenseToDelete.id));
        fetchSummaryData();
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error: any) {
      toast({
        title: "Error deleting expense",
        description: error.userFriendlyMessage || "Failed to delete expense",
        variant: "destructive"
      });
    } finally {
      setExpenseToDelete(null);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Food': '🍽️',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛒',
      'Health': '🏥',
      'Bills': '📄',
      'Education': '📚',
      'Travel': '✈️',
      'Other': '📦'
    };
    return emojiMap[category] || '💰';
  };

  const summaryCards = [
    {
      title: "Today's Spend",
      amount: counts.today,
      icon: Wallet,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30",
      change: summaryWithChanges?.today ? summaryWithChanges.today.change : 0
    },
    {
      title: "This Week",
      amount: counts.week,
      icon: Calendar,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      change: summaryWithChanges?.week ? summaryWithChanges.week.change : 0
    },
    {
      title: "This Month",
      amount: counts.month,
      icon: TrendingUp,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      change: summaryWithChanges?.month ? summaryWithChanges.month.change : 0
    }
  ];

  const quickActions = [
    { title: "Add Expense", icon: Plus, path: "/add-expense", gradient: "from-blue-600 to-blue-700", description: "Quick entry" },
    { title: "Analytics", icon: BarChart3, path: "/analytics", gradient: "from-purple-600 to-purple-700", description: "View insights" },
    { title: "Goals", icon: Target, path: "/goals", gradient: "from-green-600 to-green-700", description: "Track progress" },
    { title: "Predictions", icon: Activity, path: "/predictions", gradient: "from-orange-600 to-orange-700", description: "AI forecasts" },
  ];

  const displayedExpenses = showAllExpenses ? recentExpenses : recentExpenses.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
      
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        {/* Header */}
        <motion.header
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              Welcome back 👋
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Track your expenses like a pro</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-2 sm:gap-3 items-center">
            <NotificationCenter />
            <Button
              onClick={() => setShowDeveloperDialog(true)}
              variant="outline"
              size="sm"
              className="glass glass-hover border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 p-2 sm:p-2.5"
              title="About Developer"
            >
              <Info className="h-4 w-4 text-blue-400" />
            </Button>
            <Button
              onClick={() => navigate("/settings")}
              variant="outline"
              size="sm"
              className="glass glass-hover border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 p-2 sm:p-2.5"
            >
              <Settings className="h-4 w-4 text-purple-400" />
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="glass glass-hover border-slate-700/50 hover:border-red-500/50 transition-all duration-300 p-2 sm:p-2.5"
            >
              <LogOut className="h-4 w-4 text-red-400" />
            </Button>
          </motion.div>
        </motion.header>

        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Summary Cards */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {summaryCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} backdrop-blur-xl border ${card.borderColor} p-4 sm:p-6 group hover:scale-[1.02] transition-all duration-300`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10`}>
                        <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                      </div>
                      {card.change !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          card.change > 0 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {card.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(Math.round(card.change))}%
                        </div>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm text-slate-400 mb-2 font-medium">{card.title}</h3>
                    <motion.div
                      key={card.amount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                    >
                      {formatCurrency(card.amount)}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-4 sm:p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-400" />
                  Quick Actions
                </h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={() => navigate(action.path)}
                      className={`relative overflow-hidden group bg-gradient-to-r ${action.gradient} p-4 sm:p-5 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25`}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 text-left">
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6 mb-2 sm:mb-3" />
                        <div className="text-sm sm:text-base font-semibold mb-1">{action.title}</div>
                        <div className="text-xs text-white/80 hidden sm:block">{action.description}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Expenses */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-4 sm:p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    Recent Activity
                  </h2>
                  {recentExpenses.length > 5 && (
                    <Button
                      onClick={() => setShowAllExpenses(!showAllExpenses)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200"
                    >
                      {showAllExpenses ? 'Show Less' : 'Show All'}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform duration-200 ${showAllExpenses ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {displayedExpenses.length > 0 ? (
                      displayedExpenses.map((expense, index) => (
                        <motion.div
                          key={expense.id}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-slate-800/30 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-xl flex-shrink-0">
                              {getCategoryEmoji(expense.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm sm:text-base truncate">{expense.name}</p>
                              <p className="text-xs sm:text-sm text-slate-400 truncate">{expense.category} • {expense.time}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-blue-400 text-sm sm:text-base">
                              {formatCurrency(expense.amount)}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                                className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-300"
                                title="Edit expense"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpenseToDelete(expense)}
                                className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-300"
                                title="Delete expense"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 sm:py-12 text-slate-400"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                            />
                            <span className="text-sm sm:text-base">Loading expenses...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-4xl">📊</div>
                            <div>
                              <p className="text-base sm:text-lg font-medium text-slate-300">No expenses yet</p>
                              <p className="text-sm text-slate-500 mt-1">Start tracking by adding your first expense</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Add Button */}
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 12 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={() => navigate("/add-expense")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full p-3 sm:p-4 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 border border-blue-400/30"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </motion.div>

        {/* Developer Info Dialog */}
        <DeveloperInfoDialog
          isOpen={showDeveloperDialog}
          onClose={() => setShowDeveloperDialog(false)}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
          <AlertDialogContent className="glass border-slate-700/50 bg-slate-900/90 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action cannot be undone. This will permanently delete the expense "{expenseToDelete?.name}" of {formatCurrency(expenseToDelete?.amount || 0)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="glass-hover border-slate-700/50 text-slate-300 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-500/30"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;