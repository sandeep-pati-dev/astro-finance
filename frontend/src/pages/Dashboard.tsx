import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, Calendar, IndianRupee, BarChart3, Settings, LogOut, Info, Target, Edit, Trash2, ChevronRight, Activity, Wallet, PieChart, ArrowUp, ArrowDown, Zap, TrendingDown, Receipt } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedExpense, setSelectedExpense] = useState<RecentExpense | null>(null);

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 150
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
      gradient: "from-cyan-500 via-blue-500 to-purple-600",
      glowColor: "cyan",
      change: summaryWithChanges?.today ? summaryWithChanges.today.change : 0
    },
    {
      title: "This Week",
      amount: counts.week,
      icon: Calendar,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      glowColor: "purple",
      change: summaryWithChanges?.week ? summaryWithChanges.week.change : 0
    },
    {
      title: "This Month",
      amount: counts.month,
      icon: TrendingUp,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      glowColor: "emerald",
      change: summaryWithChanges?.month ? summaryWithChanges.month.change : 0
    }
  ];

  const quickActions = [
    { title: "Add Expense", icon: Plus, path: "/add-expense", gradient: "from-blue-600 via-blue-500 to-cyan-500", description: "Quick entry", glow: "blue" },
    { title: "All Expenses", icon: Receipt, path: "/all-expenses", gradient: "from-indigo-600 via-indigo-500 to-purple-500", description: "View past expenses", glow: "indigo" },
    { title: "Analytics", icon: BarChart3, path: "/analytics", gradient: "from-purple-600 via-purple-500 to-pink-500", description: "View insights", glow: "purple" },
    { title: "Goals", icon: Target, path: "/goals", gradient: "from-green-600 via-emerald-500 to-teal-500", description: "Track progress", glow: "green" },
    { title: "Predictions", icon: Activity, path: "/predictions", gradient: "from-orange-600 via-amber-500 to-yellow-500", description: "AI forecasts", glow: "orange" },
  ];

  const displayedExpenses = showAllExpenses ? recentExpenses : recentExpenses.slice(0, 5);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>

      {/* Dynamic Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)',
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
        />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse-slow" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse-slower" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-5 animate-spin-slow" />
      </div>

      {/* Scan Lines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan" />
      </div>
      
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        {/* Futuristic Header */}
        <motion.header
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-4 sm:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Command Center
                  </span>
                </h1>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </div>
              <p className="text-slate-400 text-sm sm:text-base font-light tracking-wide ml-4">
                Financial Intelligence Dashboard • Real-time Analytics
              </p>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-2 items-center">
            <NotificationCenter />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowDeveloperDialog(true)}
                variant="outline"
                size="sm"
                className="relative overflow-hidden bg-slate-900/50 border-cyan-500/30 hover:border-cyan-400/50 backdrop-blur-xl transition-all duration-300 p-2.5 group"
                title="About Developer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Info className="h-4 w-4 text-cyan-400 relative z-10" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                size="sm"
                className="relative overflow-hidden bg-slate-900/50 border-purple-500/30 hover:border-purple-400/50 backdrop-blur-xl transition-all duration-300 p-2.5 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Settings className="h-4 w-4 text-purple-400 relative z-10" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="relative overflow-hidden bg-slate-900/50 border-rose-500/30 hover:border-rose-400/50 backdrop-blur-xl transition-all duration-300 p-2.5 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/10 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <LogOut className="h-4 w-4 text-rose-400 relative z-10" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.header>

        <motion.div
          className="space-y-6 sm:space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Enhanced Summary Cards */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {summaryCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className="group relative"
                  whileHover={{ y: -5, scale: 1.02 }}
                  initial={{ opacity: 0, y: 30, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl rounded-3xl transition-opacity duration-500`} />
                  
                  {/* Card Container */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/90 backdrop-blur-2xl border border-slate-700/50 p-6 sm:p-7">
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-20 blur-sm`} />
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-3xl" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-3xl" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-5">
                        <motion.div
                          className={`relative p-3.5 rounded-2xl bg-gradient-to-br ${card.gradient}`}
                          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                          <card.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white relative z-10" />
                          
                          {/* Icon Pulse Effect */}
                          <motion.div
                            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-50`}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </motion.div>

                        {card.change !== 0 && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl ${
                              card.change > 0 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                            }`}
                          >
                            <motion.div
                              animate={{ y: card.change > 0 ? [-1, 1, -1] : [1, -1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {card.change > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                            </motion.div>
                            {Math.abs(Math.round(card.change))}%
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
                          {card.title}
                        </h3>
                        <motion.div
                          key={card.amount}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}
                        >
                          {formatCurrency(card.amount)}
                        </motion.div>
                      </div>

                      {/* Bottom Accent Line */}
                      <motion.div
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-50`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/90 backdrop-blur-2xl border border-slate-700/50 p-6 sm:p-8">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <motion.div
                    className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full"
                    animate={{ scaleY: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Quick <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Actions</span>
                  </h2>
                  <PieChart className="h-5 w-5 text-blue-400" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={() => navigate(action.path)}
                      className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl text-white font-medium transition-all duration-500"
                      whileHover={{ y: -5, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-90 transition-opacity duration-500 group-hover:opacity-100`} />
                      
                      {/* Hover Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500`} />
                      
                      {/* Shine Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />

                      {/* Content */}
                      <div className="relative z-10 text-left space-y-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <action.icon className="h-6 w-6 sm:h-7 sm:w-7 mb-2" />
                        </motion.div>
                        <div>
                          <div className="text-sm sm:text-base font-bold mb-1">{action.title}</div>
                          <div className="text-xs text-white/80">{action.description}</div>
                        </div>
                      </div>

                      {/* Corner Accent */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Recent Expenses */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/90 backdrop-blur-2xl border border-slate-700/50 p-6 sm:p-8">
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-cyan-600 rounded-full"
                      animate={{ scaleY: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Recent <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">Activity</span>
                    </h2>
                    <Activity className="h-5 w-5 text-emerald-400" />
                  </div>
                  {recentExpenses.length > 5 && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setShowAllExpenses(!showAllExpenses)}
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 font-semibold"
                      >
                        {showAllExpenses ? 'Show Less' : 'View All'}
                        <motion.div
                          animate={{ rotate: showAllExpenses ? 90 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    className="space-y-3 max-h-[32rem] overflow-y-auto custom-scrollbar pr-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {displayedExpenses.length > 0 ? (
                      displayedExpenses.map((expense, index) => (
                        <motion.div
                          key={expense.id}
                          className="group relative overflow-hidden"
                          initial={{ opacity: 0, x: -30, rotateY: -15 }}
                          animate={{ opacity: 1, x: 0, rotateY: 0 }}
                          exit={{ opacity: 0, x: 30, rotateY: 15 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          {/* Glow Effect on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm" />
                          
                          {/* Card */}
                          <div className="relative flex items-center justify-between p-4 px-6 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-slate-700/50 backdrop-blur-sm border border-slate-700/40 group-hover:border-cyan-500/40 transition-all duration-500 cursor-pointer"
                            onClick={() => setSelectedExpense(expense)}
                          >
                            {/* Left Side Accent */}
                            <motion.div
                              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 rounded-l-2xl"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: index * 0.05 + 0.2 }}
                            />

                            <div className="flex items-center gap-4 flex-1 min-w-0 ml-2">
                              {/* Category Emoji with Animation */}
                              <motion.div
                                className="relative flex-shrink-0"
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                transition={{ duration: 0.5 }}
                              >
                                <div className="text-2xl sm:text-3xl p-2 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                                  {getCategoryEmoji(expense.category)}
                                </div>
                                {/* Pulse Ring */}
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-cyan-400/50"
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                />
                              </motion.div>

                              {/* Expense Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm sm:text-base truncate mb-1">
                                  {expense.name}
                                </p>
                                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                                    {expense.category}
                                     <span className="flex items-center gap-1 min-w-[80px] overflow-hidden">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{expense.time}</span>
                                  </span>
                                  </span>
                                   {/* Amount and Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <motion.span
                                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-base sm:text-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.3, type: "spring" }}
                              >
                                {formatCurrency(expense.amount)}
                              </motion.span>

                              {/* Action Buttons */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                                    className="h-9 w-9 p-0 hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-500/30 transition-all duration-300"
                                    title="Edit expense"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpenseToDelete(expense)}
                                    className="h-9 w-9 p-0 hover:bg-rose-500/20 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all duration-300"
                                    title="Delete expense"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                                </div>
                              </div>
                            </div>
                            
                          

                            {/* Top Right Corner Accent */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 sm:py-16"
                      >
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center gap-4">
                            <motion.div
                              className="relative w-16 h-16"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                              <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full" />
                            </motion.div>
                            <div className="space-y-2">
                              <p className="text-white font-semibold">Loading Activity...</p>
                              <p className="text-slate-400 text-sm">Fetching your financial data</p>
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            className="space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <motion.div
                              className="text-6xl"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              📊
                            </motion.div>
                            <div className="space-y-2">
                              <p className="text-xl font-bold text-white">No Expenses Yet</p>
                              <p className="text-slate-400">Begin your financial journey by adding your first expense</p>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => navigate("/add-expense")}
                                className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-6 py-2 rounded-full shadow-lg shadow-cyan-500/25"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Expense
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Floating Add Button */}
        <motion.div
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 200, damping: 15 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            {/* Pulsing Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Button */}
            <Button
              onClick={() => navigate("/add-expense")}
              size="lg"
              className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white rounded-full p-4 sm:p-5 shadow-2xl shadow-cyan-500/30 border-2 border-white/20 transition-all duration-300"
            >
              <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
              
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </Button>

            {/* Orbiting Particles */}
            {[0, 120, 240].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos((angle * Math.PI) / 180) * 40],
                  y: [0, Math.sin((angle * Math.PI) / 180) * 40],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Developer Info Dialog */}
        <DeveloperInfoDialog
          isOpen={showDeveloperDialog}
          onClose={() => setShowDeveloperDialog(false)}
        />

        {/* Enhanced Delete Confirmation Dialog */}
        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
          <AlertDialogContent className="bg-slate-900/95 backdrop-blur-2xl border-slate-700/50 rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  ⚠️
                </motion.div>
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300 text-base">
                This action cannot be undone. This will permanently delete the expense{" "}
                <span className="font-semibold text-white">"{expenseToDelete?.name}"</span> of{" "}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-600">
                  {formatCurrency(expenseToDelete?.amount || 0)}
                </span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <AlertDialogCancel className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300">
                  Cancel
                </AlertDialogCancel>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <AlertDialogAction
                  onClick={handleDeleteExpense}
                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-500/30 shadow-lg shadow-rose-500/25 transition-all duration-300"
                >
                  Delete Expense
                </AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Expense Details Dialog */}
        <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-slate-700/50 rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
                <motion.div
                  className="text-3xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getCategoryEmoji(selectedExpense?.category || '')}
                </motion.div>
                Expense Details
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-base">
                Detailed information about this expense
              </DialogDescription>
            </DialogHeader>
            {selectedExpense && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Name</label>
                    <p className="text-white font-semibold text-lg">{selectedExpense.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Amount</label>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-2xl">
                      {formatCurrency(selectedExpense.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Category</label>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/30 text-white text-sm">
                      {getCategoryEmoji(selectedExpense.category)} {selectedExpense.category}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Date & Time</label>
                    <p className="text-slate-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedExpense.time}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => navigate(`/expenses/${selectedExpense.id}/edit`)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setExpenseToDelete(selectedExpense);
                      setSelectedExpense(null);
                    }}
                    variant="outline"
                    className="flex-1 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-scan {
          animation: scan 8s linear infinite;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) rgba(15, 23, 42, 0.2);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
          margin: 4px 0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.5), rgba(59, 130, 246, 0.5));
          border-radius: 4px;
          border: 2px solid rgba(15, 23, 42, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.7), rgba(59, 130, 246, 0.7));
        }

        /* Glass morphism effects */
        .glass-morph {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;