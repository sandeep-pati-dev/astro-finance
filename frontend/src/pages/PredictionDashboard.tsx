import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, Calendar, IndianRupee, ArrowLeft, AlertCircle, RefreshCw, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { predictionApi } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

const PredictionDashboard = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<any>(null);
  const [categoryPredictions, setCategoryPredictions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New state for tooltip open on mobile
  const [spendingTooltipOpen, setSpendingTooltipOpen] = useState(false);
  const [predictionTooltipOpen, setPredictionTooltipOpen] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    fetchPredictions();
  }, [period]);

  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      const [predictionsResponse, categoryResponse] = await Promise.all([
        predictionApi.getPredictions(period),
        predictionApi.getCategoryPredictions(period)
      ]);

      if (predictionsResponse.data.success) {
        setPredictions(predictionsResponse.data.data.predictions);
      }

      if (categoryResponse.data.success) {
        setCategoryPredictions(categoryResponse.data.data.categoryPredictions);
      }
    } catch (error: any) {
      toast({
        title: "Error loading predictions",
        description: error.userFriendlyMessage || "Failed to fetch predictions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPredictions();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = categoryPredictions ? Object.entries(categoryPredictions).map(([category, data]: any) => ({
    category: category.replace('_', ' ').length > 10 ? category.replace('_', ' ').slice(0, 10) + '...' : category.replace('_', ' '),
    predicted: data.predictedAmount,
    average: data.averageAmount,
  })).sort((a, b) => b.predicted - a.predicted) : [];

  const chartConfig = {
    predicted: {
      label: "Predicted Amount",
      color: "hsl(var(--primary))",
    },
    average: {
      label: "Average Amount",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <TooltipProvider>
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
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neon mb-2">Expense Predictions</h1>
              <p className="text-secondary-foreground">See your predicted expenses for next month</p>
            </div>
          </div>
        </motion.header>

        {/* Controls */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="glass glass-hover border-glass-border"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Select value={period.toString()} onValueChange={(value) => setPeriod(parseInt(value))}>
              <SelectTrigger className="w-[120px] glass glass-hover border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-secondary-foreground">
            Adjust period to see predictions based on different time frames. (Note: Backend currently uses 3 months)
          </p>
        </motion.div>

      {isLoading ? (
        <GlassCard>
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full"
            />
        </div>
      </GlassCard>
      ) : (
        <>
          <GlassCard delay={0.2}>
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-neon mb-2 flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Next Month Prediction
              </h2>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">
                {formatCurrency(predictions?.nextMonthPrediction || 0)}
              </div>
              <p className="text-sm sm:text-base text-secondary-foreground">
                Expected total spending for next month
              </p>
            </div>

            <div className="border-t border-glass-border pt-4">
              <p className="text-center text-xs sm:text-sm text-secondary-foreground mb-4">
                Based on your average monthly spending over the last {predictions?.basedOnMonths || 0} {predictions?.basedOnMonths === 1 ? 'month' : 'months'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-background-secondary/30">
              <div className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center justify-center gap-1">
                Spending Pattern
                <Tooltip open={isMobile ? spendingTooltipOpen : undefined} onOpenChange={isMobile ? setSpendingTooltipOpen : undefined}>
                  <TooltipTrigger asChild onClick={isMobile ? (e) => { e.preventDefault(); setSpendingTooltipOpen(!spendingTooltipOpen); } : undefined}>
                    <AlertCircle className="h-4 w-4 text-secondary-foreground cursor-help" />
                  </TooltipTrigger>
               <TooltipContent
  side={isMobile ? "bottom" : "top"}
  align="center"
  className={`bg-black text-white ${isMobile ? "max-w-[250px] text-center break-words whitespace-normal px-4 py-2" : "px-4 py-2"}`}
>
  <p className={isMobile ? "text-sm" : ""}>
    Spending Pattern indicates whether your expenses are increasing, decreasing, or stable based on recent trends.
  </p>
</TooltipContent>

                </Tooltip>
              </div>
              <div className={`text-sm sm:text-base font-medium ${
                predictions?.trend === 'increasing' ? 'text-red-500' :
                predictions?.trend === 'decreasing' ? 'text-green-500' : 'text-blue-500'
              }`}>
                {predictions?.trend === 'increasing' ? '↗ Increasing' :
                 predictions?.trend === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
              </div>
            </div>

                <div className="text-center p-3 sm:p-4 rounded-lg bg-background-secondary/30">
                  <div className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center justify-center gap-1">
                    Prediction Reliability
                <Tooltip open={isMobile ? predictionTooltipOpen : undefined} onOpenChange={isMobile ? setPredictionTooltipOpen : undefined}>
                  <TooltipTrigger asChild onClick={isMobile ? (e) => { e.preventDefault(); setPredictionTooltipOpen(!predictionTooltipOpen); } : undefined}>
                    <AlertCircle className="h-4 w-4 text-secondary-foreground cursor-help" />
                  </TooltipTrigger>
                 <TooltipContent
  side={isMobile ? "top" : "top"}
  align="center"
  className={`bg-black text-white ${isMobile ? "max-w-[250px] text-center break-words whitespace-normal px-4 py-2" : "px-4 py-2"}`}
>
  <p className={isMobile ? "text-sm" : ""}>
    Prediction Reliability shows how confident we are in the forecast based on data consistency and trend stability.
  </p>
</TooltipContent>

                </Tooltip>
                  </div>
                  <div className={`text-sm sm:text-base font-medium ${
                    predictions?.confidence === 'high' ? 'text-green-500' :
                    predictions?.confidence === 'medium' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {predictions?.confidence === 'high' ? '●●● High' :
                     predictions?.confidence === 'medium' ? '●●○ Medium' : '●○○ Low'}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.4}>
            <h2 className="text-lg font-semibold text-neon mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Predictions
            </h2>
            <p className="text-sm text-secondary-foreground mb-4">
              Click on category cards for detailed information. The chart below visualizes predicted vs average amounts.
            </p>
            {categoryPredictions ? (
              <>
                {chartData.length > 0 && (
                  <div className="mb-6 overflow-x-auto sm:overflow-visible">
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] min-w-[600px] sm:min-w-0">
                      <BarChart data={chartData}>
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="predicted" fill="var(--color-predicted)" />
                        <Bar dataKey="average" fill="var(--color-average)" />
                      </BarChart>
                    </ChartContainer>
                    <p className="text-xs text-secondary-foreground mt-2 text-center">
                      Interactive chart: Hover over bars for details. Blue bars show predicted amounts, gray bars show averages. Scroll horizontally on mobile for more categories.
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 min-w-max sm:min-w-0">
                    {Object.entries(categoryPredictions).map(([category, data]: any) => (
                      <div
                        key={category}
                        className="p-3 sm:p-4 rounded-xl bg-background-secondary/50 border border-glass-border hover:bg-background-secondary/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedCategory({ category, data })}
                      >
                        <div className="text-xs sm:text-sm font-semibold text-foreground capitalize mb-2 truncate flex items-center gap-1">
                          {category.replace('_', ' ')}
                          <Info className="h-3 w-3 text-secondary-foreground" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
                          {formatCurrency(data.predictedAmount)}
                        </div>
                        <div className="text-xs text-secondary-foreground">
                          Avg: {formatCurrency(data.averageAmount)}
                        </div>
                        <div className="text-xs text-secondary-foreground mt-1">
                          {data.transactionCount} transactions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-secondary-foreground mx-auto mb-3 opacity-50" />
                <p className="text-secondary-foreground text-sm sm:text-base">
                  No category prediction data available yet.
                </p>
                <p className="text-secondary-foreground text-xs sm:text-sm mt-1">
                  Add some expenses to see category predictions.
                </p>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && (
        <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="capitalize flex items-center gap-2">
                {selectedCategory.category.replace('_', ' ')}
                <Info className="h-4 w-4" />
              </DialogTitle>
              <DialogDescription>
                Detailed prediction breakdown for this expense category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Predicted Amount</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(selectedCategory.data.predictedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Average Amount</p>
                  <p className="text-lg font-bold text-secondary">{formatCurrency(selectedCategory.data.averageAmount)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Total Transactions</p>
                <p className="text-lg">{selectedCategory.data.transactionCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Prediction Basis</p>
                <p className="text-sm text-secondary-foreground">
                  Based on spending patterns over the last {period} months.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </TooltipProvider>
  );
};

export default PredictionDashboard;

