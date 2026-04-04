import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, IndianRupee, Tag, Calendar, FileText, Check, Zap, TrendingUp, Sparkles, Banknote, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { expenseApi } from "@/lib/api";

const AddExpense = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    paymentMethod: "credit_card" as "cash" | "credit_card" | "upi",
    date: new Date().toLocaleDateString('en-CA'),
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  // Utility functions for number formatting
  const formatNumber = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Split into integer and decimal parts
    const parts = numericValue.split('.');
    // Format integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Rejoin with decimal part (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const parseNumber = (formattedValue: string) => {
    // Remove commas and return clean number string
    return formattedValue.replace(/,/g, '');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers, commas, and one decimal point
    if (/^[0-9,]*\.?[0-9]*$/.test(inputValue) || inputValue === '') {
      const formatted = formatNumber(inputValue);
      setFormData(prev => ({ ...prev, amount: parseNumber(formatted) }));
    }
  };

  const categories = [
    { value: "food", label: "Food & Dining", icon: "🍔", color: "from-orange-500 to-red-500", glow: "shadow-orange-500/50" },
    { value: "groceries", label: "Groceries", icon: "🛒", color: "from-green-500 to-emerald-500", glow: "shadow-green-500/50" },
    { value: "vegetables", label: "Vegetables", icon: "🥦", color: "from-green-700 to-green-900", glow: "shadow-green-700/50" },
    { value: "transport", label: "Transport", icon: "🚗", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/50" },
    { value: "travel", label: "Travel", icon: "✈️", color: "from-sky-500 to-blue-600", glow: "shadow-sky-500/50" },
    { value: "shopping", label: "Shopping", icon: "🛍️", color: "from-pink-500 to-rose-500", glow: "shadow-pink-500/50" },
    { value: "personal_care", label: "Personal Care", icon: "💄", color: "from-pink-600 to-purple-500", glow: "shadow-pink-600/50" },
    { value: "entertainment", label: "Entertainment", icon: "🎬", color: "from-purple-500 to-violet-500", glow: "shadow-purple-500/50" },
    { value: "subscriptions", label: "Subscriptions", icon: "📺", color: "from-violet-500 to-purple-600", glow: "shadow-violet-500/50" },
    { value: "bills", label: "Bills & Utilities", icon: "💡", color: "from-yellow-500 to-orange-500", glow: "shadow-yellow-500/50" },
    { value: "healthcare", label: "Healthcare", icon: "🏥", color: "from-red-500 to-pink-500", glow: "shadow-red-500/50" },
    { value: "insurance", label: "Insurance", icon: "🛡️", color: "from-red-600 to-rose-600", glow: "shadow-red-600/50" },
    { value: "education", label: "Education", icon: "📚", color: "from-green-600 to-teal-500", glow: "shadow-green-600/50" },
    { value: "gifts", label: "Gifts", icon: "🎁", color: "from-rose-500 to-pink-600", glow: "shadow-rose-500/50" },
    { value: "savings", label: "Savings", icon: "💰", color: "from-yellow-600 to-amber-500", glow: "shadow-yellow-600/50" },
    { value: "investments", label: "Investments", icon: "📈", color: "from-emerald-600 to-green-700", glow: "shadow-emerald-600/50" },
    { value: "other", label: "Other", icon: "📦", color: "from-gray-600 to-slate-600", glow: "shadow-gray-600/50" }
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
      const response = await expenseApi.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        notes: formData.notes
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        toast({
          title: "Expense Added! ✅",
          description: `₹${formData.amount} added successfully`,
        });

        setTimeout(() => {
          setFormData({
            amount: "",
            category: "",
            paymentMethod: "credit_card",
            date: new Date().toLocaleDateString('en-CA'),
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

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            className="relative w-32 h-32 mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-50" />
            <motion.div
              className="absolute inset-2 bg-gradient-primary rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Check className="h-16 w-16 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-neon mb-4"
          >
            Transaction Successful
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-secondary-foreground text-lg"
          >
            Your expense has been recorded
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 glass rounded-full border-glass-border"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-foreground font-medium">Redirecting to dashboard...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{ x: [-100, 100, -100], y: [-50, 50, -50], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="max-w-4xl mx-auto mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div whileHover={{ scale: 1.05, x: -5 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="icon"
              className="glass glass-hover border-glass-border"
            >
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-neon mb-2">
              New Expense
            </h1>
            <p className="text-secondary-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Real-time expense tracking
            </p>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-hover border-glass-border rounded-3xl p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden"
        >
          {/* Card Glow Effect */}
          {selectedCategory && (
            <motion.div
              className={`absolute -inset-1 bg-gradient-to-r ${selectedCategory.color} opacity-20 blur-2xl`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
            />
          )}

          <div className="space-y-6 relative z-10">
            {/* Amount Input - Hero Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-8"
            >
              <label className="block text-sm font-medium text-secondary-foreground mb-4 uppercase tracking-wider">
                Amount *
              </label>
              <div className="relative inline-block">
                <motion.div
                  className="absolute -inset-4 bg-gradient-primary opacity-0 rounded-3xl blur-xl transition-opacity duration-300"
                  animate={{ opacity: focusedField === "amount" ? 0.3 : 0 }}
                />
                <div className="relative flex items-center justify-center gap-2">
                  <IndianRupee className="h-12 w-12 text-primary" strokeWidth={2.5} />
                  <Input
                    type="text"
                    placeholder="0"
                    value={formData.amount ? formatNumber(formData.amount) : ''}
                    onChange={handleAmountChange}
                    onFocus={() => setFocusedField("amount")}
                    onBlur={() => setFocusedField("")}
                    className="text-2xl md:text-3xl font-medium bg-white/80 border border-primary/30 rounded-xl outline-none text-gray-900 placeholder:text-gray-500 w-full max-w-xs text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary shadow-sm hover:shadow-md transition-all duration-200 px-4 py-3"
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Category Selection - Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-secondary-foreground mb-4 uppercase tracking-wider">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.02 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                      formData.category === category.value
                        ? `bg-gradient-to-br ${category.color} border-white/30 shadow-lg ${category.glow}`
                        : 'glass glass-hover border-glass-border'
                    }`}
                  >
                    {formData.category === category.value && (
                      <motion.div
                        layoutId="categoryGlow"
                        className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-2xl blur-xl opacity-50`}
                      />
                    )}
                    <div className="relative flex flex-col items-center gap-2">
                      <span className="text-3xl">{category.icon}</span>
                      <span className={`text-xs font-medium ${
                        formData.category === category.value ? 'text-white' : 'text-foreground'
                      }`}>
                        {category.label}
                      </span>
                    </div>
                    {formData.category === category.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="block text-sm font-medium text-secondary-foreground mb-4 uppercase tracking-wider">
                Paid with
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { value: "cash" as const, label: "Cash", icon: Banknote, color: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/50" },
                    { value: "credit_card" as const, label: "Credit card", icon: CreditCard, color: "from-violet-600 to-purple-600", glow: "shadow-violet-500/50" },
                    { value: "upi" as const, label: "UPI", icon: Smartphone, color: "from-cyan-600 to-blue-600", glow: "shadow-cyan-500/50" },
                  ]
                ).map((opt) => {
                  const PayIcon = opt.icon;
                  return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: opt.value }))}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                      formData.paymentMethod === opt.value
                        ? `bg-gradient-to-br ${opt.color} border-white/30 shadow-lg ${opt.glow}`
                        : "glass glass-hover border-glass-border"
                    }`}
                  >
                    <div className="relative flex flex-col items-center gap-2">
                      <PayIcon
                        className={`h-8 w-8 ${formData.paymentMethod === opt.value ? "text-white" : "text-primary"}`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          formData.paymentMethod === opt.value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    {formData.paymentMethod === opt.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Date and Notes - Side by Side on Desktop */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Date
                </label>
                <div className="relative">
                  <motion.div
                    className="absolute -inset-1 bg-gradient-primary opacity-0 rounded-2xl blur transition-opacity duration-300"
                    animate={{ opacity: focusedField === "date" ? 0.3 : 0 }}
                  />
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-4 h-5 w-5 text-primary pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      onFocus={() => setFocusedField("date")}
                      onBlur={() => setFocusedField("")}
                      className="w-full pl-12 pr-4 py-4 bg-input border-glass-border rounded-2xl text-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Notes Input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <div className="relative">
                  <motion.div
                    className="absolute -inset-1 bg-gradient-primary opacity-0 rounded-2xl blur transition-opacity duration-300"
                    animate={{ opacity: focusedField === "notes" ? 0.3 : 0 }}
                  />
                  <div className="relative flex items-start">
                    <FileText className="absolute left-4 top-4 h-5 w-5 text-primary pointer-events-none z-10" />
                    <Textarea
                      placeholder="Add details..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      onFocus={() => setFocusedField("notes")}
                      onBlur={() => setFocusedField("")}
                      className="w-full pl-12 pr-4 py-4 bg-input border-glass-border rounded-2xl text-foreground focus:border-primary focus:ring-primary resize-none h-24"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.amount || !formData.category}
                className="relative w-full py-6 rounded-2xl font-bold text-lg text-primary-foreground overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-primary hover:glow-intense transition-all duration-300"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-6 w-6" />
                      Add Expense
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Amount Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass glass-hover border-glass-border rounded-3xl p-6 shadow-2xl"
        >
          <h3 className="text-lg font-semibold text-neon mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Amounts
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[100, 250, 500, 1000, 2000, 5000].map((amount, index) => (
              <motion.button
                key={amount}
                onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-primary hover:glow transition-all duration-300 group font-semibold"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 rounded-xl transition-opacity" />
                <span className="relative">₹{formatNumber(amount.toString())}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddExpense;