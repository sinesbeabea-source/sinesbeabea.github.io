import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, hover = true, glow = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, scale: 1.02 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'glass rounded-2xl p-4',
        hover && 'glass-hover cursor-pointer',
        glow && 'neon-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}