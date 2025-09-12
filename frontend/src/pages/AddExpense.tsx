import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, IndianRupee, Tag, Calendar, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";

const AddExpense = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format in local time
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = [
    { value: "food", label: "🍔 Food & Dining", color: "text-orange-400" },
    { value: "groceries", label: "🛒 Groceries", color: "text-green-500" },
    { value: "transport", label: "🚗 Transport", color: "text-blue-400" },
    { value: "travel", label: "✈️ Travel", color: "text-blue-500" },
    { value: "shopping", label: "🛍️ Shopping", color: "text-pink-400" },
    { value: "personal_care", label: "💄 Personal Care", color: "text-pink-500" },
    { value: "entertainment", label: "🎬 Entertainment", color: "text-purple-400" },
    { value: "subscriptions", label: "📺 Subscriptions", color: "text-purple-500" },
    { value: "bills", label: "💡 Bills & Utilities", color: "text-yellow-400" },
    { value: "healthcare", label: "🏥 Healthcare", color: "text-red-400" },
    { value: "insurance", label: "🛡️ Insurance", color: "text-red-500" },
    { value: "education", label: "📚 Education", color: "text-green-400" },
    { value: "gifts", label: "🎁 Gifts", color: "text-red-600" },
    { value: "savings", label: "💰 Savings", color: "text-yellow-500" },
    { value: "investments", label: "📈 Investments", color: "text-green-600" },
    { value: "other", label: "📦 Other", color: "text-gray-400" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Make real API call
      const response = await expenseApi.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        toast({
          title: "Expense Added! ✅",
          description: `₹${formData.amount} added successfully`,
        });

        // Reset form and navigate after success animation
        setTimeout(() => {
          setFormData({
            amount: "",
            category: "",
            date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format in local time
            notes: ""
          });
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error(response.data.error || "Failed to add expense");
      }
    } catch (error: any) {
      toast({
        title: "Error adding expense",
        description: error.userFriendlyMessage || error.message || "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rippleVariants = {
    start: { scale: 0, opacity: 0.8 },
    end: { scale: 4, opacity: 0 }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 relative"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: 2 }}
          >
            <Check className="h-12 w-12 text-white" />
            <motion.div
              variants={rippleVariants}
              initial="start"
              animate="end"
              transition={{ duration: 1.5 }}
              className="absolute inset-0 border-2 border-primary rounded-full"
            />
          </motion.div>
          <h2 className="text-2xl font-bold text-neon mb-2">Expense Added Successfully!</h2>
          <p className="text-secondary-foreground">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-neon">Add New Expense</h1>
          <p className="text-secondary-foreground">Track your spending in real-time</p>
        </div>
      </motion.header>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-primary" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="pl-10 text-2xl font-bold bg-input border-glass-border focus:border-primary focus:ring-primary focus:glow"
                    required
                  />
                </div>
              </motion.div>

              {/* Category Select */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-primary z-10" />
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="pl-10 glass-hover bg-input border-glass-border focus:border-primary focus:ring-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      {categories.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          className="hover:bg-glass-hover"
                        >
                          <span className={category.color}>{category.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Date Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-primary" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="pl-10 bg-input border-glass-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </motion.div>

              {/* Notes Textarea */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-primary" />
                  <Textarea
                    placeholder="Add any additional details..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="pl-10 min-h-[100px] bg-input border-glass-border focus:border-primary focus:ring-primary resize-none"
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-primary hover:glow-intense text-primary-foreground font-semibold py-6 rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Adding Expense...
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: [-100, 400] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </motion.div>
            </form>
          </GlassCard>
        </motion.div>

        {/* Quick Amount Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <GlassCard>
            <h3 className="text-lg font-semibold text-neon mb-4">Quick Amounts</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[100, 250, 500, 1000, 2000, 5000].map((amount, index) => (
                <motion.button
                  key={amount}
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                  className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-primary hover:glow transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  ₹{amount}
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default AddExpense;