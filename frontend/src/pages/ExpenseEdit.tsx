import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, IndianRupee, Tag, Calendar, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";

const ExpenseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    date: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) return;
      try {
        const response = await expenseApi.getExpenseById(id);
        if (response.data.success) {
          const expense = response.data.data.expense;
          setFormData({
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.date ? new Date(expense.date).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
            notes: expense.notes || ""
          });
        } else {
          throw new Error("Failed to fetch expense");
        }
      } catch (error: any) {
        toast({
          title: "Error loading expense",
          description: error.userFriendlyMessage || "Failed to load expense data",
          variant: "destructive"
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpense();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await expenseApi.updateExpense(id, {
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast({
          title: "Expense Updated! ✅",
          description: `₹${formData.amount} updated successfully`,
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error(response.data.error || "Failed to update expense");
      }
    } catch (error: any) {
      toast({
        title: "Error updating expense",
        description: error.userFriendlyMessage || error.message || "Failed to update expense",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
          />
          <span className="text-secondary-foreground">Loading expense...</span>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-neon mb-2">Expense Updated Successfully!</h2>
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
          <h1 className="text-3xl font-bold text-neon">Edit Expense</h1>
          <p className="text-secondary-foreground">Update your expense details</p>
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
                      Updating Expense...
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: [-100, 400] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    "Update Expense"
                  )}
                </Button>
              </motion.div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ExpenseEdit;
