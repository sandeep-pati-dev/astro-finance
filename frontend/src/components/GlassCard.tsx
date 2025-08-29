import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const GlassCard = ({ 
  children, 
  className, 
  hover = true, 
  delay = 0,
  direction = "up" 
}: GlassCardProps) => {
  const getInitialPosition = () => {
    switch (direction) {
      case "left": return { x: -30, y: 0 };
      case "right": return { x: 30, y: 0 };
      case "down": return { x: 0, y: 30 };
      default: return { x: 0, y: -30 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={cn(
        "glass rounded-2xl p-6 transition-all duration-300",
        hover && "glass-hover cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;