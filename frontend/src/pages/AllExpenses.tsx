import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, IndianRupee, Search, Filter, Download, Clock, TrendingUp, TrendingDown, Receipt, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, userApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";

interface Expense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

const AllExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const [groupByMonth, setGroupByMonth] = useState(false);
  const [showPastExpenses, setShowPastExpenses] = useState(false);

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

  // Generate year options from user creation date to current year
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
  }, [expenses, selectedYear, selectedMonth, searchQuery, showPastExpenses]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseApi.getExpenses();
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

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        return expenseDate.getFullYear() === selectedYear;
      });
    }

    // Filter by month
    if (selectedMonth !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        return expenseDate.getMonth() + 1 === selectedMonth;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.category.toLowerCase().includes(query) ||
          expense.notes?.toLowerCase().includes(query) ||
          expense.amount.toString().includes(query)
      );
    }

    // Filter past expenses (show only expenses before current month)
    if (showPastExpenses) {
      const now = new Date();
      const currentYearMonth = now.getFullYear() * 12 + now.getMonth();
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt || "");
        const expenseYearMonth = expenseDate.getFullYear() * 12 + expenseDate.getMonth();
        return expenseYearMonth < currentYearMonth;
      });
    }

    // Sort by date (newest first)
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

    // Check if the new date is within valid range
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

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                  All Expenses
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                View and manage all your past expenses
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Search and Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search expenses by category, notes, or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupByMonth(!groupByMonth)}
                    className={`bg-slate-800/50 border-slate-700 ${
                      groupByMonth ? "border-indigo-500 text-indigo-400" : "text-slate-300"
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {groupByMonth ? "Ungroup" : "Group by Month"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="bg-slate-800/50 border-slate-700 text-slate-300"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Year and Month Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Year</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(value === "all" ? "all" : parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
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
                  <label className="text-sm text-slate-400 mb-2 block">Month</label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(value === "all" ? "all" : parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all">All Months</SelectItem>
                      {monthLabels.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Navigation */}
                {(selectedYear !== "all" && selectedMonth !== "all") && (
                  <div className="flex items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToMonth("prev")}
                      className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToMonth("next")}
                      className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Extraordinary Feature: Past Expenses Toggle */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPastExpenses(!showPastExpenses)}
                    className={`w-full bg-slate-800/50 border-slate-700 ${
                      showPastExpenses
                        ? "border-purple-500 text-purple-400 bg-purple-500/10"
                        : "text-slate-300"
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {showPastExpenses ? "Show All" : "Past Only"}
                  </Button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm text-slate-400">
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    Total: {formatCurrency(getTotalAmount())}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Expenses List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <GlassCard className="p-12 text-center">
              <motion.div
                className="relative w-16 h-16 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-400 rounded-full" />
              </motion.div>
              <p className="text-white font-semibold">Loading expenses...</p>
            </GlassCard>
          ) : filteredExpenses.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                📊
              </motion.div>
              <p className="text-xl font-bold text-white mb-2">No Expenses Found</p>
              <p className="text-slate-400">
                {searchQuery || selectedYear !== "all" || selectedMonth !== "all"
                  ? "Try adjusting your filters"
                  : "Start adding expenses to see them here"}
              </p>
            </GlassCard>
          ) : groupByMonth && groupedExpenses ? (
            // Grouped by Month View
            <div className="space-y-6">
              {Object.entries(groupedExpenses)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, monthExpenses]) => {
                  const [year, month] = monthKey.split("-");
                  const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                  return (
                    <motion.div
                      key={monthKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <GlassCard className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                          <h3 className="text-lg font-bold text-white">
                            {monthLabels[parseInt(month) - 1]?.label} {year}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {monthExpenses.length} {monthExpenses.length === 1 ? "expense" : "expenses"}
                            </span>
                            <span className="text-lg font-bold text-emerald-400">
                              {formatCurrency(monthTotal)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {monthExpenses.map((expense, index) => (
                            <motion.div
                              key={expense._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-slate-700/50"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="text-2xl">{getCategoryEmoji(expense.category)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate">
                                    {expense.notes || expense.category}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50">
                                      {expense.category}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(expense.date || expense.createdAt || "")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-lg font-bold text-indigo-400 ml-4">
                                {formatCurrency(expense.amount)}
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
            // Regular List View
            <GlassCard className="p-4 sm:p-6">
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300 border border-slate-700/50 hover:border-indigo-500/50 cursor-pointer group"
                      onClick={() => navigate(`/expenses/${expense._id}/edit`)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <motion.div
                          className="text-2xl"
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {getCategoryEmoji(expense.category)}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">
                            {expense.notes || expense.category}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50">
                              {expense.category}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(expense.date || expense.createdAt || "")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        className="text-lg font-bold text-indigo-400 ml-4"
                        whileHover={{ scale: 1.05 }}
                      >
                        {formatCurrency(expense.amount)}
                      </motion.div>
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 ml-4 transition-opacity"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) rgba(15, 23, 42, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(99, 102, 241, 0.7), rgba(139, 92, 246, 0.7));
        }
      `}</style>
    </div>
  );
};

export default AllExpenses;

