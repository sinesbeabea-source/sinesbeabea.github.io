import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function MatchNotificationPopup({ match, onClose, onStartChat }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (match) {
      // Play a soft sound using Web Audio API
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (_) {}
    }
  }, [match]);

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="glass rounded-2xl p-8 max-w-sm w-full text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            {/* Hearts animation */}
            <div className="relative mb-6">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: (i % 2 === 0 ? 1 : -1) * (20 + i * 15),
                    y: -60 - i * 10,
                  }}
                  transition={{ delay: i * 0.1, duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
                  className="absolute top-8 left-1/2 text-rose-400"
                  style={{ fontSize: 12 + i * 2 }}
                >
                  ❤️
                </motion.div>
              ))}

              <div className="flex justify-center items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{match.user_email?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                </motion.div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{match.matched_email?.[0]?.toUpperCase() || '?'}</span>
                </div>
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-space font-bold gradient-text mb-2"
            >
              แมทช์สำเร็จ! 🎉
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-sm mb-2"
            >
              คุณและ <span className="text-foreground font-semibold">{match.matched_email}</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-primary font-semibold mb-6"
            >
              ความเข้ากัน {match.match_percent}%
            </motion.p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                ดูต่อ
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent border-0"
                onClick={() => { onStartChat(match); onClose(); }}
              >
                <MessageCircle className="w-4 h-4" /> เริ่มแชท
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}