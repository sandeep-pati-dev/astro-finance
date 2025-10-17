import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Download, Calendar, Wallet, Target, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, budgetApi, userApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Analytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const [analyticsData, setAnalyticsData] = useState({
    weekly: [],
    monthly: [],
    daily: [],
    history: {
      byCategory: [],
      dailySpending: []
    }
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [userCreatedAt, setUserCreatedAt] = useState(null);
  const [exportType, setExportType] = useState('monthly');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportDay, setExportDay] = useState(new Date().getDate());
  const [isExporting, setIsExporting] = useState(false);
  const [insightsData, setInsightsData] = useState({
    spendingTrend: { percentageChange: 0, trend: 'stable' },
    budgetStatus: { percentageUsed: 0, budgetAmount: 0, totalSpent: 0 },
    topCategory: { category: 'Food & Dining', amount: 0 }
  });

  const monthLabels = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
  ];

  const yearOptions = userCreatedAt
    ? Array.from({ length: currentYear - userCreatedAt.getFullYear() + 1 }, (_, i) => userCreatedAt.getFullYear() + i)
    : [currentYear];

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState(0);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.data.success && response.data.data.user) {
          setUserCreatedAt(new Date(response.data.data.user.createdAt));
          const createdDate = new Date(response.data.data.user.createdAt);
          setSelectedYear(createdDate.getFullYear());
          setSelectedMonth(createdDate.getMonth() + 1);
        }
      } catch (error) {}
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, selectedYear, selectedMonth]);

  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const trendResponse = await budgetApi.getBudgetTrend();
        if (trendResponse.data.success) {
          setInsightsData(prev => ({
            ...prev,
            spendingTrend: trendResponse.data.data
          }));
        }

        const budgetUsageResponse = await budgetApi.getBudgetUsage(currentYear, currentMonth);
        if (budgetUsageResponse.data.success) {
          const { percentageUsed, totalSpent, budget } = budgetUsageResponse.data.data;
          setInsightsData(prev => ({
            ...prev,
            budgetStatus: {
              percentageUsed,
              totalSpent,
              budgetAmount: budget?.amount || 0
            }
          }));
          setEditBudgetAmount(budget?.amount || 0);
        }

        const expenseSummaryResponse = await expenseApi.getExpenseSummary("month");
        if (expenseSummaryResponse.data.success) {
          const summary = expenseSummaryResponse.data.data.summary;
          const topCategory = summary.byCategory?.[0];
          if (topCategory) {
            const categoryLabels = {
              "food": "Food & Dining", "transport": "Transport", "shopping": "Shopping",
              "entertainment": "Entertainment", "bills": "Bills & Utilities", "healthcare": "Healthcare",
              "education": "Education", "other": "Other"
            };
            setInsightsData(prev => ({
              ...prev,
              topCategory: {
                category: categoryLabels[topCategory._id] || topCategory._id,
                amount: topCategory.totalAmount || 0
              }
            }));
          }
        }
      } catch (error) {}
    };
    fetchInsightsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === "history") {
        const historyResponse = await expenseApi.getExpenseSummaryForMonth(selectedYear, selectedMonth);
        if (historyResponse.data.success) {
          const data = historyResponse.data.data.summary;
          const categoryColors = {
            "food": "#ff6b6b", "groceries": "#ff4757", "transport": "#4ecdc4",
            "travel": "#26de81", "shopping": "#45b7d1", "personal_care": "#a55eea",
            "entertainment": "#f9ca24", "subscriptions": "#fd79a8", "bills": "#6c5ce7",
            "healthcare": "#ff9ff3", "insurance": "#00b894", "education": "#1dd1a1",
            "gifts": "#e17055", "savings": "#74b9ff", "investments": "#00cec9", "other": "#a0a0a0"
          };
          const categoryLabels = {
            "food": "Food & Dining", "groceries": "Groceries", "transport": "Transport",
            "travel": "Travel", "shopping": "Shopping", "personal_care": "Personal Care",
            "entertainment": "Entertainment", "subscriptions": "Subscriptions",
            "bills": "Bills & Utilities", "healthcare": "Healthcare", "insurance": "Insurance",
            "education": "Education", "gifts": "Gifts", "savings": "Savings",
            "investments": "Investments", "other": "Other"
          };
          const processedData = data.byCategory?.map((cat) => ({
            category: categoryLabels[cat._id] || cat._id,
            amount: cat.totalAmount || 0,
            percentage: data.total > 0 ? Math.round((cat.totalAmount / data.total) * 100) : 0,
            color: categoryColors[cat._id] || "#a0a0a0"
          })) || [];
          setAnalyticsData(prev => ({
            ...prev,
            history: { ...prev.history, byCategory: processedData }
          }));
        }
        const dailyResponse = await expenseApi.getDailySpendingForMonth(selectedYear, selectedMonth);
        if (dailyResponse.data.success) {
          const dailyData = dailyResponse.data.data.dailySpending.dailySpending;
          setAnalyticsData(prev => ({
            ...prev,
            history: { ...prev.history, dailySpending: dailyData }
          }));
        }
      } else if (activeTab === "week") {
        const summaryResponse = await expenseApi.getExpenseSummary("week");
        if (summaryResponse.data.success) {
          const data = summaryResponse.data.data.summary;
          const categoryColors = {
            "food": "#ff6b6b", "groceries": "#ff4757", "transport": "#4ecdc4",
            "travel": "#26de81", "shopping": "#45b7d1", "personal_care": "#a55eea",
            "entertainment": "#f9ca24", "subscriptions": "#fd79a8", "bills": "#6c5ce7",
            "healthcare": "#ff9ff3", "insurance": "#00b894", "education": "#1dd1a1",
            "gifts": "#e17055", "savings": "#74b9ff", "investments": "#00cec9", "other": "#a0a0a0"
          };
          const categoryLabels = {
            "food": "Food & Dining", "groceries": "Groceries", "transport": "Transport",
            "travel": "Travel", "shopping": "Shopping", "personal_care": "Personal Care",
            "entertainment": "Entertainment", "subscriptions": "Subscriptions",
            "bills": "Bills & Utilities", "healthcare": "Healthcare", "insurance": "Insurance",
            "education": "Education", "gifts": "Gifts", "savings": "Savings",
            "investments": "Investments", "other": "Other"
          };
          const processedData = data.byCategory?.map((cat) => ({
            category: categoryLabels[cat._id] || cat._id,
            amount: cat.totalAmount || 0,
            percentage: data.total > 0 ? Math.round((cat.totalAmount / data.total) * 100) : 0,
            color: categoryColors[cat._id] || "#a0a0a0"
          })) || [];
          setAnalyticsData(prev => ({
            ...prev,
            weekly: processedData
          }));
        }
        const dailyResponse = await expenseApi.getDailySpending("week");
        if (dailyResponse.data.success) {
          const dailyData = dailyResponse.data.data.dailySpending.dailySpending;
          setAnalyticsData(prev => ({
            ...prev,
            daily: dailyData
          }));
        }
      } else if (activeTab === "month") {
        const summaryResponse = await expenseApi.getExpenseSummaryForMonth(currentYear, currentMonth);
        if (summaryResponse.data.success) {
          const data = summaryResponse.data.data.summary;
          const categoryColors = {
            "food": "#ff6b6b", "groceries": "#ff4757", "transport": "#4ecdc4",
            "travel": "#26de81", "shopping": "#45b7d1", "personal_care": "#a55eea",
            "entertainment": "#f9ca24", "subscriptions": "#fd79a8", "bills": "#6c5ce7",
            "healthcare": "#ff9ff3", "insurance": "#00b894", "education": "#1dd1a1",
            "gifts": "#e17055", "savings": "#74b9ff", "investments": "#00cec9", "other": "#a0a0a0"
          };
          const categoryLabels = {
            "food": "Food & Dining", "groceries": "Groceries", "transport": "Transport",
            "travel": "Travel", "shopping": "Shopping", "personal_care": "Personal Care",
            "entertainment": "Entertainment", "subscriptions": "Subscriptions",
            "bills": "Bills & Utilities", "healthcare": "Healthcare", "insurance": "Insurance",
            "education": "Education", "gifts": "Gifts", "savings": "Savings",
            "investments": "Investments", "other": "Other"
          };
          const processedData = data.byCategory?.map((cat) => ({
            category: categoryLabels[cat._id] || cat._id,
            amount: cat.totalAmount || 0,
            percentage: data.total > 0 ? Math.round((cat.totalAmount / data.total) * 100) : 0,
            color: categoryColors[cat._id] || "#a0a0a0"
          })) || [];
          setAnalyticsData(prev => ({
            ...prev,
            monthly: processedData
          }));
        }
        const dailyResponse = await expenseApi.getDailySpendingForMonth(currentYear, currentMonth);
        if (dailyResponse.data.success) {
          const dailyData = dailyResponse.data.data.dailySpending.dailySpending;
          setAnalyticsData(prev => ({
            ...prev,
            daily: dailyData
          }));
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentData = activeTab === "history" ? analyticsData.history.byCategory : 
                      activeTab === "week" ? analyticsData.weekly : analyticsData.monthly;
  const dailyData = activeTab === "history" ? analyticsData.history.dailySpending : analyticsData.daily;
  const totalAmount = currentData.reduce((sum, item) => sum + item.amount, 0);
  const dailyTotal = dailyData.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = dailyData.length > 0 ? Math.round(dailyTotal / dailyData.length) : 0;
  const highestDay = dailyData.length > 0 
    ? dailyData.reduce((max, item) => item.amount > max.amount ? item : max, dailyData[0])
    : { day: "None", amount: 0 };
  const maxDailyAmount = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.amount)) : 1000;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const DonutChartComponent = () => {
    const radius = 90;
    const innerRadius = 60;
    const centerX = 120;
    const centerY = 120;
    const svgSize = 240;
    let cumulativePercentage = 0;

    const createDonutArc = (percentage, color, index) => {
      const startAngle = cumulativePercentage * 3.6 - 90;
      const endAngle = (cumulativePercentage + percentage) * 3.6 - 90;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      cumulativePercentage += percentage;
      
      return (
        <motion.path
          key={index}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
          fill={color}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.15, duration: 0.8, ease: "backOut" }}
          whileHover={{ scale: 1.05, opacity: 0.9 }}
          className="cursor-pointer drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' }}
        />
      );
    };

    return (
      <div className="relative flex items-center justify-center">
        <svg width={svgSize} height={svgSize} className="mx-auto">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {currentData.map((item, index) => 
            createDonutArc(item.percentage, item.color, index)
          )}
          
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - 5}
            fill="hsl(var(--background))"
            stroke="url(#gradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="fill-primary text-sm font-semibold"
          >
            Total Spent
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            className="fill-foreground text-lg font-bold"
          >
            {formatCurrency(totalAmount)}
          </text>
        </svg>
      </div>
    );
  };

  const EnhancedBarChart = () => {
    const [hoveredBar, setHoveredBar] = useState(null);
    const isMonthly = activeTab === "month" || activeTab === "history";
    const maxBarHeight = 120; // Fixed max height for bars

    return (
      <div className="relative h-80 p-4">
        <div className="absolute inset-0 flex items-end justify-start px-4 pb-20 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
          <div className="flex items-end gap-2 sm:gap-3 min-w-max relative">
            {dailyData.map((item, index) => {
              const barHeight = Math.max((item.amount / maxDailyAmount) * maxBarHeight, item.amount > 0 ? 20 : 0);
              const isHighest = item.amount === highestDay.amount && item.amount > 0;

              return (
                <div key={item.day + index} className="flex flex-col items-center gap-2 w-12 sm:w-14 md:w-16 relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg z-50 whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </div>
                  <AnimatePresence>
                    {hoveredBar === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg z-50 whitespace-nowrap"
                      >
                        {formatCurrency(item.amount)}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-0 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-purple-500"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative w-full group">
                    <motion.div
                      className={`w-full rounded-t-lg cursor-pointer relative overflow-hidden ${
                        isHighest ? 'bg-gradient-to-t from-yellow-500 via-yellow-400 to-yellow-300' :
                        'bg-gradient-to-t from-purple-600 via-purple-500 to-pink-500'
                      }`}
                      style={{ height: `${barHeight}px` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}px` }}
                      transition={{ delay: index * 0.08, duration: 0.6, ease: "easeOut" }}
                      whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onTouchStart={() => setHoveredBar(index)}
                      onTouchEnd={() => setHoveredBar(null)}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{
                          y: ['-100%', '100%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      {isHighest && (
                        <motion.div
                          className="absolute top-1 left-1/2 transform -translate-x-1/2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Zap className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  <div className="flex flex-col items-center select-none mt-1">
                    <span className="text-xs font-semibold text-foreground">{item.day}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const LineChart = () => {
    if (dailyData.length === 0) return null;
    
    const width = 100;
    const height = 60;
    const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);
    
    const points = dailyData.map((item, index) => {
      const x = (index / (dailyData.length - 1)) * width;
      const y = height - (item.amount / maxAmount) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <motion.polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        {dailyData.map((item, index) => {
          const x = (index / (dailyData.length - 1)) * width;
          const y = height - (item.amount / maxAmount) * height;
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#ec4899"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          );
        })}
      </svg>
    );
  };

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      await budgetApi.updateBudget(year, month, { amount: editBudgetAmount });
      toast({
        title: "Success",
        description: "Monthly budget updated successfully",
      });
      const budgetUsageResponse = await budgetApi.getBudgetUsage(year, month);
      if (budgetUsageResponse.data.success) {
        const { percentageUsed, totalSpent, budget } = budgetUsageResponse.data.data;
        setInsightsData(prev => ({
          ...prev,
          budgetStatus: {
            percentageUsed,
            totalSpent,
            budgetAmount: budget?.amount || 0
          }
        }));
      }
      setIsEditBudgetOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update monthly budget",
        variant: "destructive"
      });
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await userApi.exportData(exportYear, exportMonth);

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${exportYear}-${exportMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 p-3 sm:p-6 lg:p-8">
      <motion.header 
        className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="icon"
          className="glass glass-hover border-purple-500/30 shrink-0 hover:border-purple-500/60 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-purple-400" />
        </Button>
        <div className="min-w-0 flex-1">
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Analytics Hub
          </motion.h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Track, analyze, and optimize your spending</p>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <TabsList className="glass border-purple-500/30 flex items-center gap-2 justify-center sm:justify-start flex-1 sm:flex-none p-1">
                <TabsTrigger 
                  value="week" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-sm px-4 py-2 rounded-md transition-all"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-sm px-4 py-2 rounded-md transition-all"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-sm px-4 py-2 rounded-md transition-all"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="outline"
                size="sm"
                className="glass border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {activeTab === "history" && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="glass border-purple-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-purple-500/30">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="glass border-purple-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-purple-500/30">
                      {monthLabels.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {activeTab === "week" && (
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-lg font-semibold text-foreground">
                  Current Week: {monthLabels.find(m => m.value === currentMonth)?.label} {currentDate.getDate()}, {currentYear}
                </p>
              </motion.div>
            )}

            {activeTab === "month" && (
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-lg font-semibold text-foreground">
                  Current Month: {monthLabels.find(m => m.value === currentMonth)?.label} {currentYear}
                </p>
              </motion.div>
            )}

      

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 order-1 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <PieChart className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold">Category Distribution</h2>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                    />
                  </div>
                ) : currentData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <PieChart className="h-16 w-16 mb-4 opacity-30" />
                    <p>No data available for this period</p>
                  </div>
                ) : (
                  <>
                    <DonutChartComponent />
                    
                    <div className="space-y-2 mt-6 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                      {currentData.map((item, index) => (
                        <motion.div
                          key={item.category}
                          className="flex items-center justify-between p-3 rounded-lg bg-background-secondary/30 hover:bg-background-secondary/50 transition-all cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <motion.div 
                              className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg"
                              style={{ backgroundColor: item.color }}
                              whileHover={{ scale: 1.3 }}
                            />
                            <span className="text-sm font-medium truncate">{item.category}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-sm">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Daily Spending Pattern</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeTab === "week" ? "This Week" : activeTab === "month" ? "This Month" : 
                       `${monthLabels.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                    />
                  </div>
                ) : dailyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                    <p>No spending data for this period</p>
                  </div>
                ) : (
                  <>
                    <EnhancedBarChart />
                    
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <motion.div 
                        className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="text-xs text-muted-foreground mb-1">Total</div>
                        <div className="font-bold text-sm text-purple-400">{formatCurrency(dailyTotal)}</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="text-xs text-muted-foreground mb-1">Average</div>
                        <div className="font-bold text-sm text-pink-400">{formatCurrency(averageDaily)}</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="text-xs text-muted-foreground mb-1">Peak Day</div>
                        <div className="font-bold text-sm text-yellow-400">{highestDay.day}</div>
                      </motion.div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 order-2 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Wallet className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Budget Status</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Usage</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {insightsData.budgetStatus.percentageUsed}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-background-secondary rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          insightsData.budgetStatus.percentageUsed > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          insightsData.budgetStatus.percentageUsed > 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(insightsData.budgetStatus.percentageUsed, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">{formatCurrency(insightsData.budgetStatus.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">{formatCurrency(insightsData.budgetStatus.budgetAmount)}</span>
                  </div>
                  <Button
                    onClick={() => setIsEditBudgetOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    size="sm"
                  >
                    Edit Budget
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Spending Trend</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-3xl font-bold ${
                        insightsData.spendingTrend.trend === 'increase' ? 'text-red-400' :
                        insightsData.spendingTrend.trend === 'decrease' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {insightsData.spendingTrend.trend === 'increase' ? '+' : insightsData.spendingTrend.trend === 'decrease' ? '-' : ''}
                        {Math.abs(insightsData.spendingTrend.percentageChange)}%
                      </div>
                      <div className="text-sm text-muted-foreground capitalize mt-1">
                        {insightsData.spendingTrend.trend} vs last month
                      </div>
                    </div>
                    <motion.div
                      animate={{ 
                        y: insightsData.spendingTrend.trend === 'increase' ? [-5, 0] : 
                           insightsData.spendingTrend.trend === 'decrease' ? [0, 5] : [0, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <TrendingUp className={`h-12 w-12 ${
                        insightsData.spendingTrend.trend === 'increase' ? 'text-red-400 rotate-0' :
                        insightsData.spendingTrend.trend === 'decrease' ? 'text-green-400 rotate-180' : 'text-yellow-400 rotate-90'
                      }`} />
                    </motion.div>
                  </div>
                  <LineChart />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Top Category</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                      {insightsData.topCategory.category}
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {formatCurrency(insightsData.topCategory.amount)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Avg Daily</div>
                      <div className="text-sm font-bold">{formatCurrency(averageDaily)}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-pink-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Highest</div>
                      <div className="text-sm font-bold">{formatCurrency(highestDay.amount)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
        <DialogContent className="glass border-purple-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Edit Monthly Budget
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set your spending limit for the current month
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <label className="block text-sm font-medium mb-3">Budget Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                value={editBudgetAmount}
                onChange={(e) => setEditBudgetAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold rounded-lg glass border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                min={0}
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditBudgetOpen(false)}
              className="flex-1 border-purple-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              disabled={isSavingBudget || editBudgetAmount < 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isSavingBudget ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                  />
                  Saving...
                </>
              ) : (
                "Save Budget"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="glass border-purple-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Export Data
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose the type of data you want to export
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Export Type</label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger className="glass border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-purple-500/30">
                  <SelectItem value="monthly">Monthly Export</SelectItem>
                  <SelectItem value="weekly">Weekly Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                <Select value={exportYear.toString()} onValueChange={(value) => setExportYear(parseInt(value))}>
                  <SelectTrigger className="glass border-purple-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-purple-500/30">
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                <Select value={exportMonth.toString()} onValueChange={(value) => setExportMonth(parseInt(value))}>
                  <SelectTrigger className="glass border-purple-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-purple-500/30">
                    {monthLabels.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {exportType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Day</label>
                <Select value={exportDay.toString()} onValueChange={(value) => setExportDay(parseInt(value))}>
                  <SelectTrigger className="glass border-purple-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-purple-500/30">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              className="flex-1 border-purple-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isExporting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                  />
                  Exporting...
                </>
              ) : (
                "Export Data"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;