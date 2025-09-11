import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import { authApi } from "./lib/api";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string, userData: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Animated Route Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full h-full"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/add-expense" element={
            <ProtectedRoute>
              <AddExpense />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/login" replace />
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      // Check if token is expired with some buffer time (5 minutes)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now();
        const expirationTime = payload.exp * 1000;
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        if (expirationTime < (currentTime + bufferTime)) {
          // Token is expired or will expire soon, remove it and show message
          localStorage.removeItem('authToken');
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Verify token by fetching current user
        authApi.getCurrentUser()
          .then((response) => {
            if (response.data.success) {
              setIsAuthenticated(true);
              setUser(response.data.data.user);
            } else {
              localStorage.removeItem('authToken');
            }
          })
          .catch((error) => {
            console.error('Token validation failed:', error);
            // Only remove token if it's actually an authentication error
            if (error.response?.status === 401) {
              localStorage.removeItem('authToken');
              toast({
                title: "Session expired",
                description: "Please log in again to continue.",
                variant: "destructive",
              });
            } else {
              // Network error or server error - don't remove token
              console.warn('Network error during token validation, keeping token');
              // You might want to retry the validation later or show a different message
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        // Invalid token format
        console.error('Invalid token format:', error);
        localStorage.removeItem('authToken');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        variant: "default",
      });
      window.location.href = "/login";
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.userFriendlyMessage || "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="particles"></div>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
