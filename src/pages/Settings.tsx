import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Bell, DollarSign, Shield, LogOut, Lightbulb, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { toast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "Sandeep Kumar",
    email: "sandeep@example.com",
    budget: "50000",
    currency: "INR"
  });

  const [preferences, setPreferences] = useState({
    aiInsights: true,
    notifications: true,
    budgetAlerts: true,
    expenseReminders: false,
    weeklyReports: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSaving(false);
    setIsSaved(true);
    
    toast({
      title: "Settings Saved! ✅",
      description: "Your preferences have been updated successfully",
    });

    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "See you again soon!",
    });
    navigate("/login");
  };

  const BudgetProgressRing = () => {
    const budgetUsed = 78; // 78% used
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(budgetUsed / 100) * circumference} ${circumference}`;

    return (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="hsl(var(--glass-border))"
            strokeWidth="8"
            fill="transparent"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#budgetGradient)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 283" }}
            animate={{ strokeDasharray }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          <defs>
            <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{budgetUsed}%</div>
            <div className="text-xs text-secondary-foreground">used</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neon">Settings</h1>
            <p className="text-secondary-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className="bg-gradient-primary hover:glow text-primary-foreground font-semibold px-6"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
            />
          ) : isSaved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaved ? "Saved" : isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </motion.header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Section */}
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-neon">Profile Information</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative mb-4"
              >
                <Avatar className="w-24 h-24 mx-auto border-2 border-primary/30">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-white">
                    SK
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:glow">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </motion.div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-secondary-foreground text-sm">{profile.email}</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-input border-glass-border focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-input border-glass-border focus:border-primary"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Budget Settings */}
        <GlassCard delay={0.2}>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-neon">Budget Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Budget Limit</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input
                  type="number"
                  value={profile.budget}
                  onChange={(e) => setProfile(prev => ({ ...prev, budget: e.target.value }))}
                  className="pl-10 bg-input border-glass-border focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <BudgetProgressRing />
              <p className="text-sm text-secondary-foreground text-center">
                ₹39,000 of ₹50,000 used this month
              </p>
            </div>
          </div>
        </GlassCard>

        {/* AI & Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard delay={0.3}>
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-neon-purple" />
              <h2 className="text-xl font-semibold text-neon-purple">AI Insights</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary/30">
                <div>
                  <h3 className="font-medium">Enable AI Insights</h3>
                  <p className="text-sm text-secondary-foreground">Get personalized spending tips</p>
                </div>
                <Switch
                  checked={preferences.aiInsights}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, aiInsights: checked }))
                  }
                />
              </div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: preferences.aiInsights ? 1 : 0.5,
                  height: "auto"
                }}
                className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5"
              >
                <p className="text-sm">
                  🤖 AI will analyze your spending patterns and provide insights to help you save money and make better financial decisions.
                </p>
              </motion.div>
            </div>
          </GlassCard>

          <GlassCard delay={0.4}>
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-neon">Notifications</h2>
            </div>

            <div className="space-y-4">
              {[
                { key: "notifications", title: "Push Notifications", desc: "General app notifications" },
                { key: "budgetAlerts", title: "Budget Alerts", desc: "When approaching budget limits" },
                { key: "expenseReminders", title: "Expense Reminders", desc: "Daily expense tracking reminders" },
                { key: "weeklyReports", title: "Weekly Reports", desc: "Summary of your spending" }
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-background-secondary/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-secondary-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={preferences[item.key as keyof typeof preferences]}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Security & Logout */}
        <GlassCard delay={0.5}>
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-semibold text-warning">Security</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1 glass-hover border-glass-border"
            >
              Change Password
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 glass-hover border-glass-border"
            >
              Export Data
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;