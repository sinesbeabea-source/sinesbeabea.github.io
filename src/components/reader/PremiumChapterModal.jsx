import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Lock, Unlock, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PremiumChapterModal({ chapter, bookId, userEmail, open, onClose, onUnlocked }) {
  const PREMIUM_PRICE = chapter?.coin_price || 10;
  const queryClient = useQueryClient();

  const { data: wallets } = useQuery({
    queryKey: ['wallet', userEmail],
    queryFn: () => base44.entities.Wallet.filter({ user_email: userEmail }),
    enabled: !!userEmail && open,
    initialData: [],
  });

  const wallet = wallets[0] || { balance: 0 };
  const hasEnough = (wallet.balance || 0) >= PREMIUM_PRICE;

  const unlock = useMutation({
    mutationFn: async () => {
      if ((wallet.balance || 0) < PREMIUM_PRICE) throw new Error('ยอดเหรียญไม่เพียงพอ');

      const newBalance = wallet.balance - PREMIUM_PRICE;

      // Deduct from wallet
      if (wallet.id) {
        await base44.entities.Wallet.update(wallet.id, {
          balance: newBalance,
          total_spent: (wallet.total_spent || 0) + PREMIUM_PRICE,
        });
      } else {
        await base44.entities.Wallet.create({
          user_email: userEmail,
          balance: newBalance,
          total_spent: PREMIUM_PRICE,
        });
      }

      // Record transaction
      await base44.entities.CoinTransaction.create({
        user_email: userEmail,
        amount: PREMIUM_PRICE,
        type: 'purchase',
        description: `ปลดล็อกบท: ${chapter.title}`,
        balance_after: newBalance,
        reference_id: chapter.id,
      });

      // Record purchase
      await base44.entities.PurchasedChapter.create({
        user_email: userEmail,
        chapter_id: chapter.id,
        book_id: bookId,
        chapter_title: chapter.title,
        coins_spent: PREMIUM_PRICE,
        purchased_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['purchased', userEmail] });
      onUnlocked?.();
      onClose();
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${hasEnough ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                {hasEnough
                  ? <Lock className="w-8 h-8 text-primary" />
                  : <AlertTriangle className="w-8 h-8 text-destructive" />
                }
              </div>
            </div>

            {hasEnough ? (
              <>
                <h2 className="text-xl font-space font-bold text-center mb-1">บทพรีเมียม</h2>
                <p className="text-muted-foreground text-sm text-center mb-6">{chapter?.title}</p>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ราคา</span>
                    <div className="flex items-center gap-1 font-bold text-primary">
                      <Coins className="w-4 h-4" /> {PREMIUM_PRICE} เหรียญ
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ยอดคงเหลือ</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Coins className="w-4 h-4 text-yellow-400" /> {wallet.balance}
                    </div>
                  </div>
                  <div className="border-t border-border/30 pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">หลังปลดล็อก</span>
                    <div className="flex items-center gap-1 font-bold text-green-400">
                      <Coins className="w-4 h-4" /> {wallet.balance - PREMIUM_PRICE}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent border-0"
                    onClick={() => unlock.mutate()}
                    disabled={unlock.isPending}
                  >
                    {unlock.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Unlock className="w-4 h-4" />
                    }
                    ปลดล็อก
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-space font-bold text-center mb-1">เหรียญไม่เพียงพอ</h2>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  คุณต้องการ <span className="text-primary font-bold">{PREMIUM_PRICE} เหรียญ</span> แต่มีเพียง{' '}
                  <span className="font-bold">{wallet.balance} เหรียญ</span>
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 text-sm text-center text-yellow-400">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  รับเหรียญฟรีทุกวันจากรางวัลประจำวัน!
                </div>
                <Button className="w-full" onClick={onClose}>ตกลง</Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}