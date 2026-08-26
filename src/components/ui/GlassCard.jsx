import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, hover = true, glow = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'bg-card border border-foreground/12 rounded-2xl p-4',
        hover && 'cursor-pointer hover:border-primary/40 hover:shadow-[0_10px_30px_hsl(328_62%_30%/0.08)] transition-all duration-300',
        glow && 'shadow-[0_8px_28px_hsl(328_62%_30%/0.10)]',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}