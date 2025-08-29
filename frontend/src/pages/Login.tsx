import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    login();
    toast({
      title: isLogin ? "Welcome back!" : "Account created!",
      description: `Successfully ${isLogin ? "logged in" : "signed up"}`,
    });
    navigate("/dashboard");
    setIsLoading(false);
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateY: -90 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    },
    flip: {
      rotateY: 180,
      transition: { duration: 0.6 }
    }
  };

  const floatingParticles = Array.from({ length: 6 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-primary/20 rounded-full"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        opacity: [0, 1, 0]
      }}
      transition={{
        duration: 4 + i,
        repeat: Infinity,
        delay: i * 0.5
      }}
      style={{
        left: `${10 + i * 15}%`,
        top: `${20 + i * 10}%`
      }}
    />
  ));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      {floatingParticles}
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-glow rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl" />
      
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="glass glass-hover rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-neon mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            ExpenseTracker
          </motion.h1>
          <motion.p 
            className="text-secondary-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isLogin ? "Welcome back 👋" : "Create your account ✨"}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <User className="absolute left-3 top-3 h-5 w-5 text-primary" />
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-hover pl-10 bg-input border-glass-border focus:border-primary focus:ring-primary"
                required={!isLogin}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative"
          >
            <Mail className="absolute left-3 top-3 h-5 w-5 text-primary" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-hover pl-10 bg-input border-glass-border focus:border-primary focus:ring-primary"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative"
          >
            <Lock className="absolute left-3 top-3 h-5 w-5 text-primary" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-hover pl-10 pr-10 bg-input border-glass-border focus:border-primary focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-primary hover:text-primary-glow transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:glow-intense text-primary-foreground font-semibold py-6 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </motion.div>
        </form>

        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-glow transition-colors duration-300"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;