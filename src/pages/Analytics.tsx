import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";

const Analytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("week");

  const weeklyData = [
    { category: "Food & Dining", amount: 3200, percentage: 40, color: "#ff6b6b" },
    { category: "Transport", amount: 1600, percentage: 20, color: "#4ecdc4" },
    { category: "Shopping", amount: 1200, percentage: 15, color: "#45b7d1" },
    { category: "Entertainment", amount: 800, percentage: 10, color: "#f9ca24" },
    { category: "Bills", amount: 800, percentage: 10, color: "#6c5ce7" },
    { category: "Other", amount: 400, percentage: 5, color: "#a0a0a0" }
  ];

  const monthlyData = [
    { category: "Food & Dining", amount: 12800, percentage: 35, color: "#ff6b6b" },
    { category: "Shopping", amount: 9600, percentage: 26, color: "#45b7d1" },
    { category: "Transport", amount: 5760, percentage: 16, color: "#4ecdc4" },
    { category: "Bills", amount: 4800, percentage: 13, color: "#6c5ce7" },
    { category: "Entertainment", amount: 2400, percentage: 7, color: "#f9ca24" },
    { category: "Other", amount: 1280, percentage: 3, color: "#a0a0a0" }
  ];

  const barChartData = [
    { day: "Mon", amount: 850 },
    { day: "Tue", amount: 1200 },
    { day: "Wed", amount: 900 },
    { day: "Thu", amount: 1500 },
    { day: "Fri", amount: 2100 },
    { day: "Sat", amount: 1800 },
    { day: "Sun", amount: 1300 }
  ];

  const currentData = activeTab === "week" ? weeklyData : monthlyData;
  const maxAmount = Math.max(...barChartData.map(item => item.amount));
  const totalAmount = currentData.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const PieChartComponent = () => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
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
          className="cursor-pointer"
        />
      );
    };

    return (
      <div className="relative">
        <svg width="200" height="200" className="mx-auto">
          {currentData.map((item, index) => 
            createArc(item.percentage, item.color, index)
          )}
          
          {/* Center circle for donut effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r={40}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          
          {/* Total amount in center */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="fill-primary text-xs font-semibold"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            className="fill-foreground text-sm font-bold"
          >
            {formatCurrency(totalAmount)}
          </text>
        </svg>
      </div>
    );
  };

  const BarChart = () => (
    <div className="flex items-end justify-between h-48 p-4">
      {barChartData.map((item, index) => (
        <div key={item.day} className="flex flex-col items-center gap-2">
          <motion.div
            className="bg-gradient-primary rounded-t-lg min-w-[30px] relative group cursor-pointer"
            style={{ height: `${(item.amount / maxAmount) * 150}px` }}
            initial={{ height: 0 }}
            animate={{ height: `${(item.amount / maxAmount) * 150}px` }}
            transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-glass px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ y: 10, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
            >
              {formatCurrency(item.amount)}
            </motion.div>
          </motion.div>
          <span className="text-sm text-secondary-foreground">{item.day}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <motion.header 
        className="flex items-center gap-4 mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="icon"
          className="glass glass-hover border-glass-border"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </Button>
        <div>
          <motion.h1 
            className="text-3xl font-bold text-neon"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Spending Insights
          </motion.h1>
          <p className="text-secondary-foreground">Analyze your financial patterns</p>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto">
        {/* Time Period Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass border-glass-border">
              <TabsTrigger 
                value="week" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                This Week
              </TabsTrigger>
              <TabsTrigger 
                value="month"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                This Month
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <GlassCard delay={0.4}>
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-neon">Category Breakdown</h2>
                </div>
                
                <PieChartComponent />
                
                <div className="space-y-3 mt-6">
                  {currentData.map((item, index) => (
                    <motion.div
                      key={item.category}
                      className="flex items-center justify-between p-3 rounded-lg bg-background-secondary/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-secondary-foreground">{item.percentage}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* Bar Chart */}
              <GlassCard delay={0.5}>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-neon">Daily Spending (This Week)</h2>
                </div>
                
                <BarChart />
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
                    <div className="text-sm text-secondary-foreground mb-1">Average Daily</div>
                    <div className="font-bold text-primary">{formatCurrency(1307)}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-r from-accent/10 to-neon-purple/10">
                    <div className="text-sm text-secondary-foreground mb-1">Highest Day</div>
                    <div className="font-bold text-accent">Friday</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Insights Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard delay={0.7}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="font-semibold text-success">Spending Trend</h3>
                    <p className="text-sm text-secondary-foreground">+12% vs last {activeTab}</p>
                  </div>
                </div>
                <p className="text-xs text-secondary-foreground">
                  Your expenses have increased moderately. Consider reviewing your food spending.
                </p>
              </GlassCard>

              <GlassCard delay={0.8}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-8 w-8 text-warning" />
                  <div>
                    <h3 className="font-semibold text-warning">Budget Status</h3>
                    <p className="text-sm text-secondary-foreground">78% used</p>
                  </div>
                </div>
                <p className="text-xs text-secondary-foreground">
                  You're on track with your monthly budget. Keep monitoring weekend expenses.
                </p>
              </GlassCard>

              <GlassCard delay={0.9}>
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-primary">Top Category</h3>
                    <p className="text-sm text-secondary-foreground">Food & Dining</p>
                  </div>
                </div>
                <p className="text-xs text-secondary-foreground">
                  Consider meal planning to optimize your food expenses.
                </p>
              </GlassCard>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;