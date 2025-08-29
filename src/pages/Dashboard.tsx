import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Calendar, DollarSign, BarChart3, Settings, LogOut, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";

interface ExpenseSummary {
  title: string;
  amount: number;
  icon: React.ElementType;
  color: string;
  change?: string;
}

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ today: 0, week: 0, month: 0 });
  
  const summaryData: ExpenseSummary[] = [
    { title: "Today's Spend", amount: 1450, icon: DollarSign, color: "text-primary", change: "+15%" },
    { title: "This Week", amount: 8720, icon: Calendar, color: "text-neon-blue", change: "+8%" },
    { title: "This Month", amount: 34500, icon: TrendingUp, color: "text-accent", change: "+12%" }
  ];

  const aiInsights = [
    { icon: "🍔", text: "You spent 40% more on Zomato this week compared to last week.", highlight: "Zomato" },
    { icon: "☕", text: "Chai expenses are growing faster than food expenses.", highlight: "Chai" },
    { icon: "🚗", text: "Setting a budget on travel might save you ₹2000 this month.", highlight: "₹2000" },
    { icon: "💳", text: "Consider using UPI for smaller transactions to track better.", highlight: "UPI" }
  ];

  // Count up animation effect
  useEffect(() => {
    const intervals = summaryData.map((item, index) => {
      const targetAmount = item.amount;
      let currentAmount = 0;
      const increment = targetAmount / 50;
      
      return setInterval(() => {
        currentAmount += increment;
        if (currentAmount >= targetAmount) {
          currentAmount = targetAmount;
          clearInterval(intervals[index]);
        }
        setCounts(prev => ({
          ...prev,
          [index === 0 ? 'today' : index === 1 ? 'week' : 'month']: Math.floor(currentAmount)
        }));
      }, 30);
    });

    return () => intervals.forEach(clearInterval);
  }, []);

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
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold text-neon mb-2">Welcome back, Sandeep 👋</h1>
          <p className="text-secondary-foreground">Track your expenses like a pro</p>
        </div>
        
        <div className="flex gap-3">
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryData.map((item, index) => (
              <GlassCard
                key={item.title}
                delay={index * 0.2}
                direction={index === 0 ? "left" : index === 2 ? "right" : "up"}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-glow">
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                </div>
                
                <h3 className="text-sm text-secondary-foreground mb-2">{item.title}</h3>
                <motion.div
                  key={counts[index === 0 ? 'today' : index === 1 ? 'week' : 'month']}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-foreground mb-2"
                >
                  {formatCurrency(counts[index === 0 ? 'today' : index === 1 ? 'week' : 'month'])}
                </motion.div>
                
                {item.change && (
                  <span className="text-sm text-success">{item.change}</span>
                )}
              </GlassCard>
            ))}
          </div>

          {/* Quick Actions */}
          <GlassCard delay={0.6}>
            <h2 className="text-xl font-semibold text-neon mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Add Expense", icon: Plus, path: "/add-expense", color: "bg-gradient-primary" },
                { title: "Analytics", icon: BarChart3, path: "/analytics", color: "bg-gradient-to-r from-accent to-neon-purple" },
                { title: "Settings", icon: Settings, path: "/settings", color: "bg-gradient-to-r from-neon-blue to-primary" },
              ].map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className={`${action.color} p-4 rounded-xl text-white font-medium hover:glow-intense transition-all duration-300 hover:scale-105`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <action.icon className="h-6 w-6 mx-auto mb-2" />
                  {action.title}
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Recent Expenses Preview */}
          <GlassCard delay={1}>
            <h2 className="text-xl font-semibold text-neon mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { name: "Starbucks Coffee", amount: 250, category: "Food", time: "2 hours ago" },
                { name: "Uber Ride", amount: 180, category: "Transport", time: "5 hours ago" },
                { name: "Grocery Shopping", amount: 1200, category: "Shopping", time: "1 day ago" },
              ].map((expense, index) => (
                <motion.div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-xl bg-background-secondary/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-sm text-secondary-foreground">{expense.category} • {expense.time}</p>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(expense.amount)}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* AI Insights Sidebar */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard hover={false} className="sticky top-4">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="h-6 w-6 text-neon-purple animate-glow-pulse" />
                <h2 className="text-xl font-semibold text-neon-purple">AI Insights 💡</h2>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.2 }}
                    className="glass-hover p-4 rounded-xl border border-glass-border"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <p className="text-sm leading-relaxed">
                        {insight.text.split(insight.highlight).map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="text-neon font-semibold">{insight.highlight}</span>
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="w-full mt-4 p-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mr-2"
                >
                  🔄
                </motion.div>
                Refresh Insights
              </motion.button>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Floating Add Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={() => navigate("/add-expense")}
          size="lg"
          className="bg-gradient-primary hover:glow-intense text-primary-foreground rounded-full p-4 shadow-card hover:scale-110 transition-all duration-300"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
};

export default Dashboard;