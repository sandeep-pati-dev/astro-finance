import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Target, Calendar, IndianRupee, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { goalApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";

interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  targetDate: Date;
  currentSaved: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalEdit = () => {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    currentSaved: ''
  });

  useEffect(() => {
    if (goalId) {
      fetchGoal();
    }
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      const response = await goalApi.getGoalById(goalId!);
      if (response.data.success) {
        const goal = response.data.data.goal;
        setFormData({
          title: goal.title,
          targetAmount: goal.targetAmount.toString(),
          targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
          currentSaved: goal.currentSaved.toString()
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading goal",
        description: error.userFriendlyMessage || "Failed to fetch goal details",
        variant: "destructive"
      });
      navigate('/goals');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.targetAmount || !formData.targetDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const currentSaved = formData.currentSaved ? parseFloat(formData.currentSaved) : 0;

    if (targetAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Target amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (currentSaved < 0) {
      toast({
        title: "Invalid Amount",
        description: "Current saved amount cannot be negative",
        variant: "destructive"
      });
      return;
    }

    const targetDate = new Date(formData.targetDate);
    if (targetDate <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "Target date must be in the future",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await goalApi.updateGoal(goalId!, {
        title: formData.title,
        targetAmount,
        targetDate: formData.targetDate,
        currentSaved: currentSaved || undefined
      });

      toast({
        title: "Goal Updated!",
        description: "Your financial goal has been updated successfully",
      });

      navigate('/goals');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.userFriendlyMessage || "Failed to update goal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isFetching) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/goals')}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neon mb-2">Edit Financial Goal</h1>
            <p className="text-secondary-foreground">Update your goal details and progress</p>
          </div>
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto">
        <GlassCard delay={0.2}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Goal Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Goal Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Buy a new car, Save for vacation"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="glass glass-hover border-glass-border"
                required
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                Target Amount (₹) *
              </Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="50000"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                className="glass glass-hover border-glass-border"
                min="0"
                step="100"
                required
              />
              {formData.targetAmount && (
                <p className="text-sm text-secondary-foreground">
                  {formatCurrency(formData.targetAmount)}
                </p>
              )}
            </div>

            {/* Current Saved Amount */}
            <div className="space-y-2">
              <Label htmlFor="currentSaved" className="text-sm font-medium flex items-center gap-2">
                <Save className="h-4 w-4 text-primary" />
                Current Saved Amount (₹)
              </Label>
              <Input
                id="currentSaved"
                type="number"
                placeholder="0"
                value={formData.currentSaved}
                onChange={(e) => handleInputChange('currentSaved', e.target.value)}
                className="glass glass-hover border-glass-border"
                min="0"
                step="100"
              />
              {formData.currentSaved && (
                <p className="text-sm text-secondary-foreground">
                  {formatCurrency(formData.currentSaved)}
                </p>
              )}
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Target Date *
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleInputChange('targetDate', e.target.value)}
                className="glass glass-hover border-glass-border"
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Progress Preview */}
            {formData.targetAmount && formData.currentSaved && (
              <div className="p-4 rounded-xl bg-background-secondary/50 border border-glass-border">
                <h3 className="text-sm font-medium mb-2">Progress Preview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Progress:</span>
                    <span>{Math.round((parseFloat(formData.currentSaved) / parseFloat(formData.targetAmount)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (parseFloat(formData.currentSaved) / parseFloat(formData.targetAmount)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-secondary-foreground">
                    <span>{formatCurrency(formData.currentSaved)}</span>
                    <span>{formatCurrency(formData.targetAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/goals')}
                className="flex-1 glass glass-hover border-glass-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-primary hover:glow-intense"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Updating...
                  </div>
                ) : (
                  'Update Goal'
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default GoalEdit;
