import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Target, Calendar, IndianRupee, TrendingUp, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface GoalProgress {
  goal: Goal;
  progress: {
    percentage: number;
    remainingAmount: number;
    daysLeft: number;
    monthsLeft: number;
    monthlySavingsNeeded: number;
    isOnTrack: boolean;
  };
}

const GoalsDashboard = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsProgress, setGoalsProgress] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const [goalsResponse, progressResponse] = await Promise.all([
        goalApi.getGoals(),
        goalApi.getAllGoalsProgress()
      ]);

      if (goalsResponse.data.success) {
        setGoals(goalsResponse.data.data.goals);
      }

      if (progressResponse.data.success) {
        setGoalsProgress(progressResponse.data.data.goalsProgress);
      }
    } catch (error: any) {
      toast({
        title: "Error loading goals",
        description: error.userFriendlyMessage || "Failed to fetch goals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await goalApi.deleteGoal(goalId);
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed successfully",
      });
      fetchGoals(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.userFriendlyMessage || "Failed to delete goal",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <motion.header
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="icon"
            className="glass glass-hover border-glass-border"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neon mb-2">Financial Goals</h1>
            <p className="text-secondary-foreground">Track your progress towards financial targets</p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/goals/create')}
          className="bg-gradient-primary hover:glow-intense"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </motion.header>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <GlassCard key={index} delay={index * 0.1}>
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-background-secondary rounded w-3/4"></div>
                <div className="h-4 bg-background-secondary rounded w-1/2"></div>
                <div className="h-2 bg-background-secondary rounded"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-background-secondary rounded w-1/4"></div>
                  <div className="h-4 bg-background-secondary rounded w-1/4"></div>
                </div>
              </div>
            </GlassCard>
          ))
        ) : goalsProgress.length > 0 ? (
          goalsProgress.map((item, index) => (
            <GlassCard key={item.goal._id} delay={index * 0.1}>
              <div className="space-y-4">
                {/* Goal Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neon truncate">
                      {item.goal.title}
                    </h3>
                    <p className="text-sm text-secondary-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Target: {formatDate(item.goal.targetDate)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/goals/${item.goal._id}/edit`)}
                      className="h-8 w-8 p-0"
                      title="Edit Goal"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGoal(item.goal._id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className={`text-sm font-bold ${getProgressColor(item.progress.percentage)}`}>
                      {Math.round(item.progress.percentage)}%
                    </span>
                  </div>
                  <Progress
                    value={item.progress.percentage}
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm text-secondary-foreground">
                    <span>{formatCurrency(item.goal.currentSaved)}</span>
                    <span>{formatCurrency(item.goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Goal Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-glass-border">
                  <div className="text-center">
                    <p className="text-xs text-secondary-foreground">Remaining</p>
                    <p className="text-sm font-semibold text-destructive">
                      {formatCurrency(item.progress.remainingAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-secondary-foreground">Monthly Needed</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(item.progress.monthlySavingsNeeded)}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {item.progress.isOnTrack ? (
                    <div className="flex items-center gap-2 text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium">On Track</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-warning">
                      <Target className="h-4 w-4" />
                      <span className="text-xs font-medium">Needs Attention</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          // Empty state
          <div className="col-span-full">
            <GlassCard>
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-secondary-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Goals Yet</h3>
                <p className="text-secondary-foreground mb-6">
                  Start your financial journey by creating your first goal
                </p>
                <Button
                  onClick={() => navigate('/goals/create')}
                  className="bg-gradient-primary hover:glow-intense"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {goals.length > 0 && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
        >
          <Button
            onClick={() => navigate('/predictions')}
            size="lg"
            className="bg-gradient-to-r from-accent to-neon-purple hover:glow-intense text-primary-foreground rounded-full p-4 shadow-card"
          >
            <TrendingUp className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default GoalsDashboard;
