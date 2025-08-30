import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Shield, LogOut, Save, Check, X, Eye, EyeOff, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { toast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";
import { userApi, budgetApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    budget: "50000",
    currency: "INR"
  });

  const [budgetData, setBudgetData] = useState({
    totalSpent: 0,
    percentageUsed: 0,
    budgetAmount: 50000,
    loading: true,
    error: null as string | null
  });

  // Change password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Export data state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await userApi.getProfile();
        if (profileResponse.data.success) {
          const user = profileResponse.data.data.user;
          setProfile({
            name: user.name || "",
            email: user.email || "",
            budget: profile.budget,
            currency: profile.currency
          });
        }

        // Fetch budget usage for current month
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const budgetResponse = await budgetApi.getBudgetUsage(year, month);
        if (budgetResponse.data.success) {
          const { totalSpent, percentageUsed, budget }= budgetResponse.data.data;
          // Calculate fallback percentageUsed if missing or zero
          const calcPercentageUsed = (percentageUsed && percentageUsed > 0)
            ? percentageUsed
            : budget && budget.amount > 0
              ? (totalSpent / budget.amount) * 100
              : 0;

          setBudgetData(prev => ({
            ...prev,
            totalSpent,
            percentageUsed: calcPercentageUsed,
            budgetAmount: budget?.amount || 50000,
            loading: false
          }));
          
          // Update profile budget with real data
          setProfile(prev => ({
            ...prev,
            budget: budget?.amount?.toString() || "50000"
          }));
        }
      } catch (error: any) {
        console.error("Failed to fetch data", error);
        setBudgetData(prev => ({
          ...prev,
          loading: false,
          error: error.userFriendlyMessage || "Failed to load budget data"
        }));
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update profile with API
      const profileResponse = await userApi.updateProfile({
        name: profile.name,
        email: profile.email,
      });

      // Update budget if changed
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const budgetAmount = Number(profile.budget);

      if (!isNaN(budgetAmount) && budgetAmount !== budgetData.budgetAmount) {
        await budgetApi.updateBudget(year, month, { amount: budgetAmount });
        setBudgetData(prev => ({ ...prev, budgetAmount }));
      }
      
      if (profileResponse.data.success) {
        setIsSaved(true);
        toast({
          title: "Profile Updated! ✅",
          description: "Your profile information has been updated successfully",
        });
      } else {
        throw new Error(profileResponse.data.error || "Failed to update profile");
      }
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.userFriendlyMessage || "Failed to update profile information",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleLogout = () => {
    // Show toast first
    toast({
      title: "Logged Out",
      description: "See you again soon!",
    });
    
    // Add a small delay to ensure toast is visible before navigation
    setTimeout(() => {
      logout();
      navigate("/login");
    }, 100);
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    
    try {
      const response = await userApi.changePassword(passwordData);
      
      if (response.data.success) {
        toast({
          title: "Password Changed! ✅",
          description: "Your password has been updated successfully",
        });
        setIsChangePasswordOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: ""
        });
      } else {
        throw new Error(response.data.error || "Failed to change password");
      }
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description: error.userFriendlyMessage || "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const response = await userApi.exportData(exportYear, exportMonth);
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${exportYear}-${exportMonth}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful! ✅",
        description: `Your expense data for ${exportMonth}/${exportYear} has been downloaded`,
      });
      
      setIsExportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.userFriendlyMessage || "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const BudgetProgressRing = () => {
    const budgetUsed = budgetData.percentageUsed || 0; // use real data
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
            <div className="text-lg font-bold text-primary">{budgetUsed.toFixed(0)}%</div>
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
                  disabled
                  className="bg-input border-glass-border focus:border-primary opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-secondary-foreground mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Budget Settings */}
        <GlassCard delay={0.2}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-primary text-xl font-semibold">₹</span>
            <h2 className="text-xl font-semibold text-neon">Budget Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Budget Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-primary text-sm font-semibold">₹</span>
                <Input
                  type="number"
                  value={profile.budget}
                  onChange={(e) => setProfile(prev => ({ ...prev, budget: e.target.value }))}
                  className="pl-8 bg-input border-glass-border focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <BudgetProgressRing />
              <p className="text-sm text-secondary-foreground text-center">
                ₹{budgetData.totalSpent.toLocaleString()} of ₹{budgetData.budgetAmount.toLocaleString()} used this month
              </p>
            </div>
          </div>
        </GlassCard>

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
              onClick={() => setIsChangePasswordOpen(true)}
            >
              Change Password
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 glass-hover border-glass-border"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
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

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="glass border-glass-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neon">Change Password</DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    currentPassword: e.target.value 
                  }))}
                  className="pr-10 bg-input border-glass-border"
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value 
                  }))}
                  className="pr-10 bg-input border-glass-border"
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    confirmNewPassword: e.target.value 
                  }))}
                  className="pr-10 bg-input border-glass-border"
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
              className="border-glass-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-gradient-primary hover:glow text-primary-foreground"
            >
              {isChangingPassword ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="glass border-glass-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neon">Export Expense Data</DialogTitle>
            <DialogDescription>
              Select the month and year to export your expense data as CSV
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Year Selection */}
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
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
                  {[
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
                  ].map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              className="border-glass-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="bg-gradient-primary hover:glow text-primary-foreground"
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
    </div>
  );
};

export default Settings;
