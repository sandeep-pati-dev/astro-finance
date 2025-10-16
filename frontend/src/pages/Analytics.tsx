import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Download, TrendingDown, DollarSign, Calendar, Target, Zap } from "lucide-react";
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
  const currentDay = currentDate.getDate();
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [userCreatedAt, setUserCreatedAt] = useState(null);
  const [insightsData, setInsightsData] = useState({
    spendingTrend: { percentageChange: 0, trend: 'stable' },
    budgetStatus: { percentageUsed: 0, budgetAmount: 0, totalSpent: 0 },
    topCategory: { category: 'Food & Dining', amount: 0 }
  });

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
      } catch (error) {
        // Ignore error
      }
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
              "food": "Food & Dining",
              "transport": "Transport",
              "shopping": "Shopping",
              "entertainment": "Entertainment",
              "bills": "Bills & Utilities",
              "healthcare": "Healthcare",
              "education": "Education",
              "other": "Other"
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
      } catch (error) {
        // Ignore errors
      }
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
            "food": "#ff6b6b",
            "groceries": "#ff4757",
            "transport": "#4ecdc4",
            "travel": "#26de81",
            "shopping": "#45b7d1",
            "personal_care": "#a55eea",
            "entertainment": "#f9ca24",
            "subscriptions": "#fd79a8",
            "bills": "#6c5ce7",
            "healthcare": "#ff9ff3",
            "insurance": "#00b894",
            "education": "#1dd1a1",
            "gifts": "#e17055",
            "savings": "#74b9ff",
            "investments": "#00cec9",
            "other": "#a0a0a0"
          };
          const categoryLabels = {
            "food": "Food & Dining",
            "groceries": "Groceries",
            "transport": "Transport",
            "travel": "Travel",
            "shopping": "Shopping",
            "personal_care": "Personal Care",
            "entertainment": "Entertainment",
            "subscriptions": "Subscriptions",
            "bills": "Bills & Utilities",
            "healthcare": "Healthcare",
            "insurance": "Insurance",
            "education": "Education",
            "gifts": "Gifts",
            "savings": "Savings",
            "investments": "Investments",
            "other": "Other"
          };
          const processedData = data.byCategory?.map((cat) => ({
            category: categoryLabels[cat._id] || cat._id,
            amount: cat.totalAmount || 0,
            percentage: data.total > 0 ? Math.round((cat.totalAmount / data.total) * 100) : 0,
            color: categoryColors[cat._id] || "#a0a0a0"
          })) || [];
          setAnalyticsData(prev => ({
            ...prev,
            history: {
              ...prev.history,
              byCategory: processedData
            }
          }));
        }
        const dailyResponse = await expenseApi.getDailySpendingForMonth(selectedYear, selectedMonth);
        if (dailyResponse.data.success) {
          const dailyData = dailyResponse.data.data.dailySpending.dailySpending;
          setAnalyticsData(prev => ({
            ...prev,
            history: {
              ...prev.history,
              dailySpending: dailyData
            }
          }));
        }
      } else {
        const summaryResponse = await expenseApi.getExpenseSummary(activeTab === "week" ? "week" : "month");
        if (summaryResponse.data.success) {
          const data = summaryResponse.data.data.summary;
          const categoryColors = {
            "food": "#ff6b6b",
            "groceries": "#ff4757",
            "transport": "#4ecdc4",
            "travel": "#26de81",
            "shopping": "#45b7d1",
            "personal_care": "#a55eea",
            "entertainment": "#f9ca24",
            "subscriptions": "#fd79a8",
            "bills": "#6c5ce7",
            "healthcare": "#ff9ff3",
            "insurance": "#00b894",
            "education": "#1dd1a1",
            "gifts": "#e17055",
            "savings": "#74b9ff",
            "investments": "#00cec9",
            "other": "#a0a0a0"
          };
          const categoryLabels = {
            "food": "Food & Dining",
            "groceries": "Groceries",
            "transport": "Transport",
            "travel": "Travel",
            "shopping": "Shopping",
            "personal_care": "Personal Care",
            "entertainment": "Entertainment",
            "subscriptions": "Subscriptions",
            "bills": "Bills & Utilities",
            "healthcare": "Healthcare",
            "insurance": "Insurance",
            "education": "Education",
            "gifts": "Gifts",
            "savings": "Savings",
            "investments": "Investments",
            "other": "Other"
          };
          const processedData = data.byCategory?.map((cat) => ({
            category: categoryLabels[cat._id] || cat._id,
            amount: cat.totalAmount || 0,
            percentage: data.total > 0 ? Math.round((cat.totalAmount / data.total) * 100) : 0,
            color: categoryColors[cat._id] || "#a0a0a0"
          })) || [];
          setAnalyticsData(prev => ({
            ...prev,
            [activeTab === "week" ? "weekly" : "monthly"]: processedData
          }));
        }
        const dailyResponse = await expenseApi.getDailySpending(activeTab === "week" ? "week" : "month");
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
  const maxAmount = Math.max(...dailyData.map(item => item.amount), 1000);
  const totalAmount = currentData.reduce((sum, item) => sum + item.amount, 0);

  const dailyTotal = dailyData.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = dailyData.length > 0 ? Math.round(dailyTotal / dailyData.length) : 0;
  const highestDay = dailyData.length > 0 
    ? dailyData.reduce((max, item) => item.amount > max.amount ? item : max, dailyData[0])
    : { day: "None", amount: 0 };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const EnhancedPieChart = () => {
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const radius = 100;
    const centerX = 120;
    const centerY = 120;
    const svgSize = 240;
    let cumulativePercentage = 0;

    const createArc = (percentage, color, index) => {
      const startAngle = cumulativePercentage * 3.6 - 90;
      const endAngle = (cumulativePercentage + percentage) * 3.6 - 90;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      const midAngle = (startAngle + endAngle) / 2;
      const midAngleRad = (midAngle * Math.PI) / 180;
      const offsetDistance = hoveredSegment === index ? 10 : 0;
      const offsetX = offsetDistance * Math.cos(midAngleRad);
      const offsetY = offsetDistance * Math.sin(midAngleRad);
      
      cumulativePercentage += percentage;
      
      return (
        <g key={index}>
          <motion.path
            d={`M ${centerX + offsetX} ${centerY + offsetY} L ${x1 + offsetX} ${y1 + offsetY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + offsetX} ${y2 + offsetY} Z`}
            fill={color}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: hoveredSegment === index ? 0.9 : 1, 
              scale: 1,
              x: offsetX,
              y: offsetY
            }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: "backOut" }}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer drop-shadow-lg"
            style={{ filter: hoveredSegment === index ? 'brightness(1.2)' : 'brightness(1)' }}
          />
          {percentage > 5 && (
            <motion.text
              x={centerX + (radius * 0.65) * Math.cos(midAngleRad) + offsetX}
              y={centerY + (radius * 0.65) * Math.sin(midAngleRad) + offsetY}
              textAnchor="middle"
              className="fill-white text-xs font-bold pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredSegment === index ? 1 : 0.8 }}
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
            >
              {percentage}%
            </motion.text>
          )}
        </g>
      );
    };

    return (
      <div className="relative flex flex-col items-center">
        <svg width={svgSize} height={svgSize} className="drop-shadow-2xl">
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
            createArc(item.percentage, item.color, index)
          )}
          
          <circle
            cx={centerX}
            cy={centerY}
            r={50}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            className="drop-shadow-xl"
            filter="url(#glow)"
          />
          
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="fill-primary text-sm font-semibold"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            className="fill-foreground text-base font-bold"
          >
            {formatCurrency(totalAmount)}
          </text>
        </svg>
        
        {hoveredSegment !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <p className="text-sm font-semibold">{currentData[hoveredSegment]?.category}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(currentData[hoveredSegment]?.amount)}</p>
          </motion.div>
        )}
      </div>
    );
  };

  const EnhancedBarChart = () => {
    const [hoveredBar, setHoveredBar] = useState(null);
    const isMonthly = activeTab === "month" || activeTab === "history";
    const maxBarHeight = 160;

    return (
      <div className={`flex items-end ${isMonthly ? 'gap-2 overflow-x-auto' : 'justify-between'} h-56 px-4 pb-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent hover:scrollbar-thumb-primary`}>
        {dailyData.map((item, index) => {
          let barHeight = Math.min((item.amount / maxAmount) * maxBarHeight, maxBarHeight);
          const minBarHeight = 20;
          if (barHeight < minBarHeight && item.amount > 0) {
            barHeight = minBarHeight;
          }
          
          return (
            <div key={item.day + index} className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <AnimatePresence>
                {(hoveredBar === index) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.8 }}
                    className="absolute -top-16 bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-2 rounded-lg text-xs font-bold shadow-2xl z-50 whitespace-nowrap"
                  >
                    <div className="text-center">
                      <div>{formatCurrency(item.amount)}</div>
                      <div className="text-[10px] opacity-80">{item.date}</div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"></div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative">
                <motion.div
                  className="relative rounded-t-lg cursor-pointer overflow-hidden"
                  style={{
                    height: `${barHeight}px`,
                    width: isMonthly ? '24px' : '32px',
                    background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))`,
                  }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${barHeight}px`, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.15, filter: 'brightness(1.2)' }}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onTouchStart={() => setHoveredBar(index)}
                  onTouchEnd={() => setTimeout(() => setHoveredBar(null), 2000)}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"
                    animate={{ y: hoveredBar === index ? [0, -10, 0] : 0 }}
                    transition={{ duration: 1, repeat: hoveredBar === index ? Infinity : 0 }}
                  />
                </motion.div>
                
                {item.amount > 0 && (
                  <motion.div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-accent rounded-full"
                    animate={{
                      scale: hoveredBar === index ? [1, 1.5, 1] : 1,
                      opacity: hoveredBar === index ? [1, 0.5, 1] : 0.7,
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
              
              <div className="flex flex-col items-center select-none">
                <span className={`text-xs font-semibold ${hoveredBar === index ? 'text-primary' : 'text-secondary-foreground'} transition-colors`}>
                  {item.day}
                </span>
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
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

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.header 
        className="flex items-center gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="icon"
          className="glass glass-hover border-glass-border shrink-0 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </Button>
        <div className="min-w-0 flex-1">
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-neon bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Financial Analytics
          </motion.h1>
          <p className="text-secondary-foreground text-sm sm:text-base mt-1">Deep dive into your spending patterns</p>
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
              <TabsList className="glass border-glass-border flex items-center gap-2 p-1.5 flex-1 sm:flex-none">
                <TabsTrigger 
                  value="week" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground text-sm px-4 py-2 rounded-md transition-all"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground text-sm px-4 py-2 rounded-md transition-all"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground text-sm px-4 py-2 rounded-md transition-all"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 justify-center glass border-glass-border hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </Button>
            </div>

            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
              >
                <div>
                  <label className="block text-sm font-medium text-secondary-foreground mb-2">Year</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="glass border-glass-border">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-foreground mb-2">Month</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="glass border-glass-border">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      {monthLabels.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <GlassCard delay={0.4} className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PieChart className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Category Breakdown</h2>
                </div>
                
                <EnhancedPieChart />
                
                <div className="space-y-2 mt-6 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
                  {currentData.map((item, index) => (
                    <motion.div
                      key={item.category}
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-background-secondary/40 to-background-secondary/20 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <motion.div 
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg"
                          style={{ backgroundColor: item.color }}
                          whileHover={{ scale: 1.3, rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.category}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-sm">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-primary font-semibold">{item.percentage}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard delay={0.5} className="lg:col-span-1 xl:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-accent to-neon bg-clip-text text-transparent">
                      Daily Spending Trends
                    </h2>
                    <p className="text-xs text-secondary-foreground mt-1">
                      {activeTab === "week" ? "Last 7 Days" : activeTab === "month" ? "This Month" : `${monthLabels.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  </div>
                </div>
                
                <EnhancedBarChart />
                
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm border border-primary/20"
                    whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary))' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div className="text-xs text-secondary-foreground">Total</div>
                    </div>
                    <div className="font-bold text-primary text-lg">{formatCurrency(dailyTotal)}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent backdrop-blur-sm border border-accent/20"
                    whileHover={{ scale: 1.05, borderColor: 'hsl(var(--accent))' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <div className="text-xs text-secondary-foreground">Average</div>
                    </div>
                    <div className="font-bold text-accent text-lg">{formatCurrency(averageDaily)}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-neon/20 via-neon/10 to-transparent backdrop-blur-sm border border-neon/20"
                    whileHover={{ scale: 1.05, borderColor: 'hsl(var(--neon))' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-neon" />
                      <div className="text-xs text-secondary-foreground">Peak Day</div>
                    </div>
                    <div className="font-bold text-neon text-lg">{highestDay.day}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-neon-purple/20 via-neon-purple/10 to-transparent backdrop-blur-sm border border-neon-purple/20"
                    whileHover={{ scale: 1.05, borderColor: 'hsl(var(--neon-purple))' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-neon-purple" />
                      <div className="text-xs text-secondary-foreground">Peak Amount</div>
                    </div>
                    <div className="font-bold text-neon-purple text-base">{formatCurrency(highestDay.amount)}</div>
                  </motion.div>
                </div>
              </GlassCard>

              <GlassCard delay={0.6} className="lg:col-span-2 xl:col-span-3">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neon/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-neon" />
                  </div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-neon to-neon-purple bg-clip-text text-transparent">
                    Monthly Insights & Budget
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <motion.div 
                    className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm border border-primary/30 hover:border-primary transition-all"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-secondary-foreground mb-1">Budget Status</div>
                        <div className="text-3xl font-bold text-primary mb-2">
                          {insightsData.budgetStatus.percentageUsed}%
                        </div>
                      </div>
                      <Target className="h-8 w-8 text-primary/50" />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-secondary-foreground mb-2">
                        <span>Spent</span>
                        <span>Budget</span>
                      </div>
                      <div className="relative h-3 bg-background-secondary/50 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-neon rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(insightsData.budgetStatus.percentageUsed, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-semibold mt-2">
                        <span className="text-primary">{formatCurrency(insightsData.budgetStatus.totalSpent)}</span>
                        <span className="text-secondary-foreground">{formatCurrency(insightsData.budgetStatus.budgetAmount)}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setIsEditBudgetOpen(true)}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all"
                      size="sm"
                    >
                      Adjust Budget
                    </Button>
                  </motion.div>

                  <motion.div 
                    className="p-5 rounded-xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent backdrop-blur-sm border border-accent/30 hover:border-accent transition-all"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-secondary-foreground mb-1">Spending Trend</div>
                        <div className={`text-3xl font-bold mb-2 ${
                          insightsData.spendingTrend.trend === 'increase' ? 'text-red-400' :
                          insightsData.spendingTrend.trend === 'decrease' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {insightsData.spendingTrend.percentageChange > 0 ? '+' : ''}{insightsData.spendingTrend.percentageChange}%
                        </div>
                      </div>
                      {insightsData.spendingTrend.trend === 'increase' ? (
                        <TrendingUp className="h-8 w-8 text-red-400/50" />
                      ) : insightsData.spendingTrend.trend === 'decrease' ? (
                        <TrendingDown className="h-8 w-8 text-green-400/50" />
                      ) : (
                        <BarChart3 className="h-8 w-8 text-yellow-400/50" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          insightsData.spendingTrend.trend === 'increase' ? 'bg-red-400/20 text-red-400' :
                          insightsData.spendingTrend.trend === 'decrease' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {insightsData.spendingTrend.trend === 'increase' ? '↑ Increasing' :
                           insightsData.spendingTrend.trend === 'decrease' ? '↓ Decreasing' : '→ Stable'}
                        </div>
                      </div>
                      <p className="text-xs text-secondary-foreground leading-relaxed">
                        {insightsData.spendingTrend.trend === 'increase' 
                          ? 'Your spending has increased compared to last month. Consider reviewing your expenses.'
                          : insightsData.spendingTrend.trend === 'decrease'
                          ? 'Great job! Your spending is down compared to last month.'
                          : 'Your spending is relatively stable compared to last month.'}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-5 rounded-xl bg-gradient-to-br from-neon/10 via-neon/5 to-transparent backdrop-blur-sm border border-neon/30 hover:border-neon transition-all"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-secondary-foreground mb-1">Top Category</div>
                        <div className="text-lg font-bold text-neon mb-1 truncate">
                          {insightsData.topCategory.category}
                        </div>
                      </div>
                      <PieChart className="h-8 w-8 text-neon/50" />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(insightsData.topCategory.amount)}
                      </div>
                      <div className="text-xs text-secondary-foreground mt-1">
                        Highest spending this month
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-xs text-secondary-foreground leading-relaxed">
                        This category accounts for the largest portion of your monthly expenses.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </GlassCard>
            </div>
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
        <DialogContent className="glass border-glass-border max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Edit Monthly Budget
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground">
              Set your spending limit for the current month
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <label className="block text-sm font-medium mb-3 text-foreground">Budget Amount</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₹</div>
              <input
                type="number"
                value={editBudgetAmount}
                onChange={(e) => setEditBudgetAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border-2 border-glass-border focus:border-primary transition-all text-lg font-semibold outline-none"
                min={0}
                placeholder="Enter amount"
              />
            </div>
            <p className="text-xs text-secondary-foreground mt-2">
              Your current spending: {formatCurrency(insightsData.budgetStatus.totalSpent)}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditBudgetOpen(false)}
              className="border-glass-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              disabled={isSavingBudget || editBudgetAmount < 0}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all"
            >
              {isSavingBudget ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;