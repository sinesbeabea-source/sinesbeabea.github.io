import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Clock, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAILY_REWARD = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!targetMs) return;
    const tick = () => {
      const diff = targetMs - Date.now();
      setRemaining(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { remaining, h, m, s };
}

export default function DailyRewardCard({ userEmail, wallet, onClaimed }) {
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  // Last claim stored in localStorage (client-side cooldown check)
  const storageKey = `daily_claim_${userEmail}`;
  const lastClaimStr = localStorage.getItem(storageKey);
  const lastClaim = lastClaimStr ? parseInt(lastClaimStr, 10) : 0;
  const nextClaimAt = lastClaim + COOLDOWN_MS;
  const canClaim = Date.now() >= nextClaimAt;

  const { remaining, h, m, s } = useCountdown(canClaim ? 0 : nextClaimAt);

  const claimReward = useMutation({
    mutationFn: async () => {
      if (!canClaim) throw new Error('ยังไม่ถึงเวลา');

      const amount = DAILY_REWARD;
      const newBalance = (wallet?.balance || 0) + amount;

      // Record transaction
      await base44.entities.CoinTransaction.create({
        user_email: userEmail,
        amount,
        type: 'daily_reward',
        description: `รางวัลล็อกอินประจำวัน`,
        balance_after: newBalance,
      });

      // Update wallet
      if (wallet?.id) {
        await base44.entities.Wallet.update(wallet.id, {
          balance: newBalance,
          total_earned: (wallet.total_earned || 0) + amount,
        });
      } else {
        await base44.entities.Wallet.create({
          user_email: userEmail,
          balance: newBalance,
          total_earned: amount,
          total_spent: 0,
        });
      }

      // Save claim time locally
      localStorage.setItem(storageKey, Date.now().toString());
      return amount;
    },
    onSuccess: (amount) => {
      setClaimedAmount(amount);
      setShowPopup(true);
      queryClient.invalidateQueries({ queryKey: ['wallet', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userEmail] });
      onClaimed?.();
      setTimeout(() => setShowPopup(false), 3000);
    },
  });

  return (
    <>
      <div className={`relative rounded-xl p-4 border transition-all overflow-hidden ${
        canClaim
          ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10'
          : 'border-border/30 bg-muted/20'
      }`}>
        {canClaim && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: 'inset 0 0 30px hsl(45 100% 50% / 0.1)' }}
          />
        )}

        <div className="flex items-center gap-3 relative">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canClaim ? 'bg-yellow-500/20' : 'bg-muted'}`}>
            <Gift className={`w-5 h-5 ${canClaim ? 'text-yellow-400' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">รางวัลล็อกอินประจำวัน</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">+{DAILY_REWARD} เหรียญ</span>
            </div>
          </div>

          {canClaim ? (
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 shrink-0"
              onClick={() => claimReward.mutate()}
              disabled={claimReward.isPending}
            >
              {claimReward.isPending ? (
                <span className="text-xs">กำลังรับ...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs">รับ!</span>
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 glass rounded-2xl p-4 flex items-center gap-3 border border-yellow-500/30"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">รับรางวัลสำเร็จ!</p>
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Coins className="w-3 h-3" /> +{claimedAmount} เหรียญ
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}