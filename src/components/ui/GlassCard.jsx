import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, hover = true, glow = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'glass rounded-xl p-4',
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