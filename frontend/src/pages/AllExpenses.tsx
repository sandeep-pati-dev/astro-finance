import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, IndianRupee, Search, Filter, Download, Clock, TrendingUp, TrendingDown, Receipt, Sparkles, ChevronLeft, ChevronRight, X, Zap, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, userApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Expense {
  _id: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

function resolveExpensePayment(expense: { paymentMethod?: string }): "cash" | "credit_card" | "upi" {
  if (expense.paymentMethod === "cash" || expense.paymentMethod === "upi" || expense.paymentMethod === "credit_card") {
    return expense.paymentMethod;
  }
  return "credit_card";
}

function paymentMethodLabel(pm: "cash" | "credit_card" | "upi"): string {
  if (pm === "cash") return "Cash";
  if (pm === "upi") return "UPI";
  return "Credit card";
}

const AllExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedPayment, setSelectedPayment] = useState<"all" | "cash" | "credit_card" | "upi">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const [groupByMonth, setGroupByMonth] = useState(false);
  const [showPastExpenses, setShowPastExpenses] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const monthLabels = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const yearOptions = userCreatedAt
    ? Array.from({ length: currentYear - userCreatedAt.getFullYear() + 1 }, (_, i) => userCreatedAt.getFullYear() + i).reverse()
    : [currentYear];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.data.success && response.data.data.user) {
          setUserCreatedAt(new Date(response.data.data.user.createdAt));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, selectedYear, selectedMonth, selectedCategory, selectedPayment, searchQuery, showPastExpenses]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseApi.getExpenses({ limit: 10000 });
      if (response.data.success) {
        const fetchedExpenses = response.data.data.expenses;
        setExpenses(fetchedExpenses);
      }
    } catch (error: any) {
      toast({
        title: "Error loading expenses",
        description: error.userFriendlyMessage || "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((expense) => expense.category === selectedCategory);
    }

    if (selectedPayment !== "all") {
      filtered = filtered.filter((expense) => resolveExpensePayment(expense) === selectedPayment);
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        return expenseDate.getFullYear() === selectedYear;
      });
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        return expenseDate.getMonth() + 1 === selectedMonth;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.category.toLowerCase().includes(query) ||
          expense.notes?.toLowerCase().includes(query) ||
          expense.amount.toString().includes(query) ||
          paymentMethodLabel(resolveExpensePayment(expense)).toLowerCase().includes(query)
      );
    }

    if (showPastExpenses) {
      const now = new Date();
      const currentYearMonth = now.getFullYear() * 12 + now.getMonth();
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        const expenseYearMonth = expenseDate.getFullYear() * 12 + expenseDate.getMonth();
        return expenseYearMonth < currentYearMonth;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || "").getTime();
      const dateB = new Date(b.date || b.createdAt || "").getTime();
      return dateB - dateA;
    });

    setFilteredExpenses(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      food: "🍔",
      groceries: "🛒",
      vegetables: "🥦",
      transport: "🚗",
      travel: "✈️",
      shopping: "🛍️",
      personal_care: "💄",
      entertainment: "🎬",
      subscriptions: "📺",
      bills: "💡",
      healthcare: "🏥",
      insurance: "🛡️",
      education: "📚",
      gifts: "🎁",
      savings: "💰",
      investments: "📈",
      other: "📦",
    };
    return emojiMap[category.toLowerCase()] || "💰";
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByMonth = () => {
    const grouped: { [key: string]: Expense[] } = {};
    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date || expense.createdAt || "");
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(expense);
    });
    return grouped;
  };

  const groupedExpenses = groupByMonth ? getExpensesByMonth() : null;

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
    setSelectedCategory("all");
    setSelectedPayment("all");
    setSearchQuery("");
    setShowPastExpenses(false);
  };

  const navigateToMonth = (direction: "prev" | "next") => {
    if (selectedYear === "all" || selectedMonth === "all") {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
      return;
    }

    let newYear = selectedYear as number;
    let newMonth = selectedMonth as number;

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    if (userCreatedAt) {
      const userYear = userCreatedAt.getFullYear();
      const userMonth = userCreatedAt.getMonth() + 1;
      const newYearMonth = newYear * 12 + newMonth;
      const userYearMonth = userYear * 12 + userMonth;
      const currentYearMonth = currentYear * 12 + currentMonth;

      if (newYearMonth < userYearMonth || newYearMonth > currentYearMonth) {
        toast({
          title: "Invalid Date Range",
          description: "Selected month is outside your expense history",
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  const hasActiveFilters =
    selectedYear !== "all" ||
    selectedMonth !== "all" ||
    selectedCategory !== "all" ||
    selectedPayment !== "all" ||
    showPastExpenses;

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await expenseApi.deleteExpense(expenseToDelete._id);
      if (response.data.success) {
        toast({
          title: "Expense Deleted",
          description: "The expense has been successfully deleted.",
        });
        setExpenses(prev => prev.filter(exp => exp._id !== expenseToDelete._id));
        setExpenseToDelete(null);
        setSelectedExpense(null);
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error: any) {
      toast({
        title: "Error deleting expense",
        description: error.userFriendlyMessage || "Failed to delete expense",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative">

      <div className="relative z-10 pb-20 sm:pb-6">
        {/* Sticky Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800/50 px-4 sm:px-6 py-4 sm:py-5"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate text-white">
                    All Expenses
                  </h1>
                </div>
              </div>
              
              {/* Mobile Filter Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-full ${
                    hasActiveFilters
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-slate-800/50 border-slate-700 text-slate-300"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-slate-950"
                    />
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between gap-4 mt-4 p-3 rounded-2xl bg-slate-800 border border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Transactions</p>
                  <p className="text-sm font-bold text-white">{filteredExpenses.length}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(getTotalAmount())}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters - Desktop Always Visible, Mobile Collapsible */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 640) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sticky top-[140px] sm:top-[130px] z-40 px-4 sm:px-6 pt-4"
            >
              <div className="max-w-7xl mx-auto">
                <GlassCard className="p-4 bg-slate-900 border-slate-700/50">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search by category, notes, or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGroupByMonth(!groupByMonth)}
                        className={`rounded-full ${
                          groupByMonth
                            ? "bg-slate-800 border-slate-700 text-white"
                            : "bg-slate-800/50 border-slate-700 text-slate-300"
                        }`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {groupByMonth ? "Ungroup" : "Group"}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPastExpenses(!showPastExpenses)}
                        className={`rounded-full ${
                          showPastExpenses
                            ? "bg-slate-800 border-slate-700 text-white"
                            : "bg-slate-800/50 border-slate-700 text-slate-300"
                        }`}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Past Only
                      </Button>
                    </motion.div>
                    {hasActiveFilters && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="rounded-full bg-slate-800/50 border-slate-700 text-slate-300"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* Filter Selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value)}
                      >
                        <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-xl">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 rounded-xl">
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="food">🍔 Food</SelectItem>
                          <SelectItem value="groceries">🛒 Groceries</SelectItem>
                          <SelectItem value="vegetables">🥦 Vegetables</SelectItem>
                          <SelectItem value="transport">🚗 Transport</SelectItem>
                          <SelectItem value="travel">✈️ Travel</SelectItem>
                          <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                          <SelectItem value="personal_care">💄 Personal Care</SelectItem>
                          <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                          <SelectItem value="subscriptions">📺 Subscriptions</SelectItem>
                          <SelectItem value="bills">💡 Bills</SelectItem>
                          <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                          <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                          <SelectItem value="education">📚 Education</SelectItem>
                          <SelectItem value="gifts">🎁 Gifts</SelectItem>
                          <SelectItem value="savings">💰 Savings</SelectItem>
                          <SelectItem value="investments">📈 Investments</SelectItem>
                          <SelectItem value="other">📦 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={selectedPayment}
                        onValueChange={(value) =>
                          setSelectedPayment(value as "all" | "cash" | "credit_card" | "upi")
                        }
                      >
                        <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-xl">
                          <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 rounded-xl">
                          <SelectItem value="all">All payments</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="credit_card">Credit card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(value === "all" ? "all" : parseInt(value))}
                      >
                        <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-xl">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 rounded-xl">
                          <SelectItem value="all">All Years</SelectItem>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={selectedMonth.toString()}
                        onValueChange={(value) => setSelectedMonth(value === "all" ? "all" : parseInt(value))}
                      >
                        <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-xl">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 rounded-xl">
                          <SelectItem value="all">All Months</SelectItem>
                          {monthLabels.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Month Navigation */}
                  {(selectedYear !== "all" && selectedMonth !== "all") && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-700/50"
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToMonth("prev")}
                          className="rounded-full bg-slate-800/50 border-slate-700 text-slate-300"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </motion.div>
                      <span className="text-sm font-medium text-white px-4">
                        {monthLabels[selectedMonth - 1]?.label} {selectedYear}
                      </span>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToMonth("next")}
                          className="rounded-full bg-slate-800/50 border-slate-700 text-slate-300"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expenses List */}
        <div className="px-4 sm:px-6 mt-6 max-w-7xl mx-auto">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                className="relative w-20 h-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-400 border-r-purple-400 rounded-full" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white font-semibold mt-6"
              >
                Loading expenses...
              </motion.p>
            </motion.div>
          ) : filteredExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-6"
              >
                📊
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">No Expenses Found</h3>
              <p className="text-slate-400 mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Start adding expenses to see them here"}
              </p>
              {hasActiveFilters && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={clearFilters}
                    className="rounded-full bg-slate-800 hover:bg-slate-700"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : groupByMonth && groupedExpenses ? (
            // Grouped View
            <div className="space-y-4 pb-6">
              {Object.entries(groupedExpenses)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, monthExpenses], groupIndex) => {
                  const [year, month] = monthKey.split("-");
                  const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                  return (
                    <motion.div
                      key={monthKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                    >
                      <GlassCard className="p-4 sm:p-5 bg-slate-900 border-slate-700/50 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {monthLabels[parseInt(month) - 1]?.label} {year}
                              </h3>
                              <p className="text-xs text-slate-400">
                                {monthExpenses.length} transaction{monthExpenses.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-400">
                              {formatCurrency(monthTotal)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {monthExpenses.map((expense, index) => (
                            <motion.div
                              key={expense._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ scale: 1.01, x: 4 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedExpense(expense)}
                              className="relative group cursor-pointer"
                            >
                              <div className="absolute inset-0 bg-slate-800/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 group-hover:border-slate-600 transition-all">
                                <motion.div
                                  className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl flex-shrink-0"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  {getCategoryEmoji(expense.category)}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate">
                                    {expense.notes || expense.category}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                                      {expense.category}
                                    </span>
                                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                                      {paymentMethodLabel(resolveExpensePayment(expense))}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(expense.date || expense.createdAt || "")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-base sm:text-lg font-bold text-indigo-400 whitespace-nowrap">
                                    {formatCurrency(expense.amount)}
                                  </p>
                                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            // List View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 pb-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((expense, index) => (
                  <motion.div
                    key={expense._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedExpense(expense)}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-slate-800/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 group-hover:border-slate-600 transition-all">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0 border border-slate-600/30"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        {getCategoryEmoji(expense.category)}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-sm sm:text-base">
                          {expense.notes || expense.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                            {expense.category}
                          </span>
                          <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                            {paymentMethodLabel(resolveExpensePayment(expense))}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.date || expense.createdAt || "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-base sm:text-lg font-bold text-indigo-400 whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </p>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <ChevronRight className="h-5 w-5 text-indigo-400" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Mobile Navigation Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 sm:hidden z-50 p-4 bg-slate-900 pointer-events-none"
      >
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3 w-3" />
          <span>Tap any expense to view details</span>
        </div>
      </motion.div>

      {/* Expense Details Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="bg-slate-900 border-slate-700/50 rounded-3xl max-w-md">
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
                  <p className="text-white font-semibold text-lg">{selectedExpense.notes || selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Amount</label>
                  <p className="text-indigo-400 font-bold text-2xl">
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
                  <label className="text-sm font-medium text-slate-400">Paid with</label>
                  <p className="text-slate-200 text-sm font-medium">
                    {paymentMethodLabel(resolveExpensePayment(selectedExpense))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Date</label>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedExpense.date || selectedExpense.createdAt || "")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    navigate(`/expenses/${selectedExpense._id}/edit`);
                    setSelectedExpense(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700/50 rounded-3xl">
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
              <span className="font-semibold text-white">"{expenseToDelete?.notes || expenseToDelete?.category}"</span> of{" "}
              <span className="font-bold text-rose-400">
                {formatCurrency(expenseToDelete?.amount || 0)}
              </span>
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
                className="bg-rose-600 hover:bg-rose-500 text-white border-rose-500/30 shadow-lg shadow-rose-500/25 transition-all duration-300"
              >
                Delete Expense
              </AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.4) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.6));
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
        }

        /* Smooth scrolling for mobile */
        @media (max-width: 640px) {
          * {
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Optimize animations for mobile */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AllExpenses;