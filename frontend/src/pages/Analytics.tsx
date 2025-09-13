import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Calendar, History, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi, userApi, budgetApi } from "@/lib/api";
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
  const [analyticsData, setAnalyticsData] = useState({
    weekly: [],
    monthly: [],
    daily: [],
    history: {
      byCategory: [],
      dailySpending: []
    }
  });

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const [insightsData, setInsightsData] = useState({
    spendingTrend: { percentageChange: 0, trend: 'stable' as 'increase' | 'decrease' | 'stable' },
    budgetStatus: { percentageUsed: 0, budgetAmount: 0, totalSpent: 0 },
    topCategory: { category: 'Food & Dining', amount: 0 }
  });

  useEffect(() => {
    // Fetch user profile to get createdAt
    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.data.success && response.data.data.user) {
          setUserCreatedAt(new Date(response.data.data.user.createdAt));
          // Set initial selected year and month based on user createdAt
          const createdDate = new Date(response.data.data.user.createdAt);
          setSelectedYear(createdDate.getFullYear());
          setSelectedMonth(createdDate.getMonth() + 1);
        }
      } catch (error) {
        // Ignore error, fallback to current date
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, selectedYear, selectedMonth]);
  
  // Generate year options from userCreatedAt year to current year
  const currentYear = new Date().getFullYear();
  const startYear = userCreatedAt ? userCreatedAt.getFullYear() : currentYear;
  const yearOptions = [];
  for (let y = startYear; y <= currentYear; y++) {
    yearOptions.push(y);
  }

  // Generate month options based on selectedYear and userCreatedAt
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
    { value: 12, label: "December" }
  ];
  const startMonth = (userCreatedAt && selectedYear === startYear) ? userCreatedAt.getMonth() + 1 : 1;
  const monthOptions = monthLabels.filter(m => m.value >= startMonth);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === "history") {
        // Fetch historical data for selected year and month
        const historyResponse = await expenseApi.getExpenseSummaryForMonth(selectedYear, selectedMonth);
        if (historyResponse.data.success) {
          const data = historyResponse.data.data.summary;

          const categoryColors = {
            "food": "#ff6b6b",
            "transport": "#4ecdc4",
            "shopping": "#45b7d1",
            "entertainment": "#f9ca24",
            "bills": "#6c5ce7",
            "healthcare": "#ff9ff3",
            "education": "#1dd1a1",
            "other": "#a0a0a0"
          };

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

          const processedData = data.byCategory?.map((cat: any) => ({
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
        // Fetch category breakdown data using the summary endpoint
        const summaryResponse = await expenseApi.getExpenseSummary(activeTab === "week" ? "week" : "month");
        if (summaryResponse.data.success) {
          const data = summaryResponse.data.data.summary;

          const categoryColors = {
            "food": "#ff6b6b",
            "transport": "#4ecdc4",
            "shopping": "#45b7d1",
            "entertainment": "#f9ca24",
            "bills": "#6c5ce7",
            "healthcare": "#ff9ff3",
            "education": "#1dd1a1",
            "other": "#a0a0a0"
          };

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

          const processedData = data.byCategory?.map((cat: any) => ({
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

        // Fetch daily spending for current period
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
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch insights data for the three cards
  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Fetch spending trend
        const trendResponse = await budgetApi.getBudgetTrend();
        console.log('Budget Trend Response:', trendResponse);
        if (trendResponse.data.success) {
          setInsightsData(prev => ({
            ...prev,
            spendingTrend: trendResponse.data.data
          }));
        }

        // Fetch budget status for current month
        const budgetUsageResponse = await budgetApi.getBudgetUsage(currentYear, currentMonth);
        console.log('Budget Usage Response:', budgetUsageResponse);
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

        // Fetch top category for current period
        const period = activeTab === "week" ? "week" : "month";
        const expenseSummaryResponse = await expenseApi.getExpenseSummary(period);
        console.log('Expense Summary Response:', expenseSummaryResponse);
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
        console.error('Error fetching insights data:', error);
        // Keep default values if API calls fail
      }
    };

    fetchInsightsData();
  }, [activeTab]);

  // Export data handler
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const response = await userApi.exportData(exportYear, exportMonth);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense-data-${exportYear}-${exportMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setIsExportDialogOpen(false);
      toast({
        title: "Success",
        description: "Expense data exported successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: "Error",
        description: error.userFriendlyMessage || "Failed to export expense data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentData = activeTab === "history" ? analyticsData.history.byCategory : 
                    activeTab === "week" ? analyticsData.weekly : analyticsData.monthly;
  
  const dailyData = activeTab === "history" ? analyticsData.history.dailySpending : analyticsData.daily;
  // Set maxAmount to 1000 for scaling bars as per user request
  const maxAmount = 1000;
  const totalAmount = currentData.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate insights from daily data
  const dailyTotal = dailyData.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = dailyData.length > 0 ? Math.round(dailyTotal / dailyData.length) : 0;
  const highestDay = dailyData.length > 0 
    ? dailyData.reduce((max, item) => item.amount > max.amount ? item : max, dailyData[0])
    : { day: "None", amount: 0 };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const PieChartComponent = () => {
    // Responsive chart size
    const isSmallScreen = window.innerWidth < 640;
    const radius = isSmallScreen ? 60 : 80;
    const centerX = isSmallScreen ? 80 : 100;
    const centerY = isSmallScreen ? 80 : 100;
    const svgSize = isSmallScreen ? 160 : 200;
    let cumulativePercentage = 0;

    const createArc = (percentage: number, color: string, index: number) => {
      const startAngle = cumulativePercentage * 3.6 - 90;
      const endAngle = (cumulativePercentage + percentage) * 3.6 - 90;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      cumulativePercentage += percentage;
      
      return (
        <motion.path
          key={index}
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={color}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2, duration: 0.8, ease: "backOut" }}
          whileHover={{ scale: 1.1, opacity: 0.9 }}
          whileTap={{ scale: 1.05 }}
          className="cursor-pointer"
        />
      );
    };

    return (
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="mx-auto">
          {currentData.map((item, index) => 
            createArc(item.percentage, item.color, index)
          )}
          
          {/* Center circle for donut effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r={isSmallScreen ? 30 : 40}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          
          {/* Total amount in center */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className={`fill-primary ${isSmallScreen ? 'text-xs' : 'text-xs'} font-semibold`}
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            className={`fill-foreground ${isSmallScreen ? 'text-xs' : 'text-sm'} font-bold`}
          >
            {formatCurrency(totalAmount)}
          </text>
        </svg>
      </div>
    );
  };

  const BarChart = () => {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const isMonthly = activeTab === "month" || activeTab === "history";
    const isSmallScreen = window.innerWidth < 640;
    const barWidth = isSmallScreen ? (isMonthly ? 12 : 20) : (isMonthly ? 20 : 30);
    const containerClass = isMonthly 
      ? `flex items-end gap-${isSmallScreen ? '1' : '3'} h-${isSmallScreen ? '40' : '52'} p-${isSmallScreen ? '2' : '4'} overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent` 
      : `flex items-end justify-between h-${isSmallScreen ? '40' : '52'} p-${isSmallScreen ? '2' : '4'}`;
    
    // Responsive max bar height
    const maxBarHeight = isSmallScreen ? 80 : 120;
    
    return (
      <div className={containerClass}>
        {dailyData.map((item, index) => {
          let barHeight = Math.min((item.amount / maxAmount) * maxBarHeight, maxBarHeight);
          const minBarHeight = 25;
          if (barHeight < minBarHeight && item.amount > 0) {
            barHeight = minBarHeight;
          }
          return (
            <div key={item.day + index} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative group">
                <motion.div
                  className="bg-gradient-to-t from-primary to-accent rounded-t-lg cursor-pointer shadow-md"
                  style={{
                    height: `${barHeight}px`,
                    width: `${barWidth}px`,
                    minWidth: `${barWidth}px`
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}px` }}
                  transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 1.05 }}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onTouchStart={() => setHoveredBar(index)}
                  onTouchEnd={() => setHoveredBar(null)}
                />
                
                {/* Mobile-optimized tooltip */}
                <div className={`absolute ${isSmallScreen ? '-top-2' : '-top-4'} left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-0.5 py-0.5 rounded-sm text-xs font-semibold shadow-lg z-50 ${hoveredBar === index ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none max-w-[60px] truncate`}>
                  {formatCurrency(item.amount)}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-0.5 border-r-0.5 border-t-0.5 border-l-transparent border-r-transparent border-t-primary"></div>
                </div>
              </div>
              <div className="flex flex-col items-center select-none">
                <span className={`${isSmallScreen ? 'text-xs' : 'text-sm'} text-secondary-foreground font-medium`}>{item.day}</span>
                <span className={`${isSmallScreen ? 'text-xs' : 'text-xs'} text-muted-foreground`}>{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-8">
      {/* Mobile-optimized Header */}
      <motion.header 
        className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="icon"
          className="glass glass-hover border-glass-border shrink-0"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </Button>
        <div className="min-w-0 flex-1">
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-neon truncate"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Spending Insights
          </motion.h1>
          <p className="text-secondary-foreground text-sm sm:text-base">Analyze your financial patterns</p>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto">
        {/* Mobile-optimized Time Period Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile-first tabs layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
              <TabsList className="glass border-glass-border flex items-center gap-1 sm:gap-2 justify-center sm:justify-start flex-1 sm:flex-none">
                <TabsTrigger 
                  value="week" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3"
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3"
                >
                  This Month
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3"
                >
                  History
                </TabsTrigger>
              </TabsList>
              
              {/* Export button - mobile optimized */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 justify-center w-full sm:w-auto glass border-glass-border"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Export</span>
              </Button>
            </div>

            {/* Mobile-optimized Year and Month Selectors for History Tab */}
            {activeTab === "history" && (
              <motion.div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <label className="text-sm font-medium text-secondary-foreground whitespace-nowrap">Year:</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="glass border-glass-border flex-1 sm:w-24">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <label className="text-sm font-medium text-secondary-foreground whitespace-nowrap">Month:</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="glass border-glass-border flex-1 sm:w-32">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Mobile-first charts layout */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Pie Chart - Mobile optimized */}
              <GlassCard delay={0.4}>
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold text-neon">Category Breakdown</h2>
                </div>
                
                <PieChartComponent />
                
                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                  {currentData.map((item, index) => (
                    <motion.div
                      key={item.category}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-background-secondary/30 touch-none"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs sm:text-sm truncate">{item.category}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-semibold text-xs sm:text-sm">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-secondary-foreground">{item.percentage}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* Bar Chart - Mobile optimized */}
              <GlassCard delay={0.5}>
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold text-neon">
                    Daily Spending
                  </h2>
                </div>
                <div className="text-xs sm:text-sm text-secondary-foreground mb-2">
                  {activeTab === "week" ? "This Week" : activeTab === "month" ? "This Month" : `${monthLabels.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                </div>
                
                <BarChart />
                
                {/* Mobile-optimized summary stats */}
                <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
                    <div className="text-xs sm:text-sm text-secondary-foreground mb-1">Average Daily</div>
                    <div className="font-bold text-primary text-sm sm:text-base">{formatCurrency(averageDaily)}</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-gradient-to-r from-accent/10 to-neon-purple/10">
                    <div className="text-xs sm:text-sm text-secondary-foreground mb-1">Highest Day</div>
                    <div className="font-bold text-accent text-sm sm:text-base">{highestDay.day}</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Mobile-first Insights Cards */}
          
          </Tabs>

          {/* Mobile-optimized Export Data Dialog */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogContent className="glass border-glass-border max-w-sm sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-neon text-lg sm:text-xl">Export Expense Data</DialogTitle>
                <DialogDescription className="text-sm">
                  Select the month and year to export your expense data as CSV
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Year Selection - Mobile optimized */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select
                    value={exportYear.toString()}
                    onValueChange={(value) => setExportYear(parseInt(value))}
                  >
                    <SelectTrigger className="bg-input border-glass-border">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Selection - Mobile optimized */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select
                    value={exportMonth.toString()}
                    onValueChange={(value) => setExportMonth(parseInt(value))}
                  >
                    <SelectTrigger className="bg-input border-glass-border">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobile-optimized button layout */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(false)}
                  className="border-glass-border w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="bg-gradient-primary hover:glow text-primary-foreground w-full sm:w-auto order-1 sm:order-2"
                >
                  {isExporting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : "Export Data"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;