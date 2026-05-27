import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReadingBuddyFound({ buddy, bookTitle, onClose, onChat }) {
  useEffect(() => {
    if (!buddy) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }, [buddy]);

  return (
    <AnimatePresence>
      {buddy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 80 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 80 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="glass rounded-2xl p-8 max-w-sm w-full text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            {/* Pulse rings */}
            <div className="relative flex items-center justify-center mb-6">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                  style={{ width: 64, height: 64 }}
                />
              ))}
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {buddy.user_name?.[0]?.toUpperCase() || buddy.user_email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">เจอเพื่อนนักอ่าน! 📖</p>
              <h2 className="text-xl font-space font-bold gradient-text mb-1">
                {buddy.user_name || buddy.user_email}
              </h2>
              <p className="text-sm text-muted-foreground mb-1">กำลังอ่าน</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">"{bookTitle}"</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">เล่มเดียวกันกับคุณ!</p>
            </motion.div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                ข้าม
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent border-0"
                onClick={() => { onChat(buddy); onClose(); }}
              >
                <MessageCircle className="w-4 h-4" /> แชทเลย
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}