import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Gift, Star, ArrowUpRight, ArrowDownRight, History, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const typeConfig = {
  earn: { label: 'รายได้', color: 'text-green-400', bg: 'bg-green-400/10', icon: ArrowUpRight },
  spend: { label: 'ใช้จ่าย', color: 'text-red-400', bg: 'bg-red-400/10', icon: ArrowDownRight },
  daily_reward: { label: 'รางวัลประจำวัน', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Gift },
  purchase: { label: 'ซื้อ', color: 'text-red-400', bg: 'bg-red-400/10', icon: ArrowDownRight },
  refund: { label: 'คืนเงิน', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: ArrowUpRight },
  bonus: { label: 'โบนัส', color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Star },
};

const levelConfig = {
  bronze: { label: 'บรอนซ์', color: 'from-orange-600 to-orange-400', textColor: 'text-orange-400' },
  silver: { label: 'ซิลเวอร์', color: 'from-gray-400 to-gray-300', textColor: 'text-gray-300' },
  gold: { label: 'โกลด์', color: 'from-yellow-500 to-yellow-300', textColor: 'text-yellow-400' },
  platinum: { label: 'แพลตินัม', color: 'from-cyan-400 to-blue-400', textColor: 'text-cyan-400' },
};

export default function WalletCard({ userEmail }) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  const { data: wallets } = useQuery({
    queryKey: ['wallet', userEmail],
    queryFn: () => base44.entities.Wallet.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    initialData: [],
  });

  const wallet = wallets[0] || { balance: 0, total_earned: 0, total_spent: 0, level: 'bronze' };

  const { data: transactions } = useQuery({
    queryKey: ['transactions', userEmail],
    queryFn: () => base44.entities.CoinTransaction.filter({ user_email: userEmail }, '-created_date', 30),
    enabled: !!userEmail && showHistory,
    initialData: [],
  });

  const claimDailyReward = useMutation({
    mutationFn: async () => {
      const amount = 10 + Math.floor(Math.random() * 20);
      const newBalance = (wallet.balance || 0) + amount;
      
      await base44.entities.CoinTransaction.create({
        user_email: userEmail,
        amount,
        type: 'daily_reward',
        description: 'รางวัลประจำวัน',
        balance_after: newBalance,
      });

      if (wallet.id) {
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
      return amount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userEmail] });
    },
  });

  const level = levelConfig[wallet.level || 'bronze'];

  return (
    <div className="space-y-4">
      {/* Main Wallet Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="p-6 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">กระเป๋าเหรียญ</p>
                <Badge className={`bg-gradient-to-r ${level.color} text-white border-0 text-xs`}>
                  ระดับ {level.label}
                </Badge>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Coin balance */}
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <motion.span
                  key={wallet.balance}
                  initial={{ scale: 1.2, color: '#7c3aed' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  className="text-5xl font-bold font-space"
                >
                  {(wallet.balance || 0).toLocaleString()}
                </motion.span>
                <span className="text-lg text-muted-foreground mb-1">เหรียญ</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-400/10 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">รับทั้งหมด</span>
                </div>
                <p className="font-bold text-green-400">+{(wallet.total_earned || 0).toLocaleString()}</p>
              </div>
              <div className="bg-red-400/10 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">ใช้ทั้งหมด</span>
                </div>
                <p className="font-bold text-red-400">-{(wallet.total_spent || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-2 flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0"
                onClick={() => claimDailyReward.mutate()}
                disabled={claimDailyReward.isPending}
              >
                <Gift className="w-4 h-4" />
                {claimDailyReward.isPending ? 'กำลังรับ...' : 'รับรางวัลวันนี้'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4" />
                ประวัติ
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Transaction History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard hover={false} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">ประวัติธุรกรรม</h3>
              </div>

              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">ยังไม่มีธุรกรรม</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {transactions.map(tx => {
                    const cfg = typeConfig[tx.type] || typeConfig.earn;
                    const Icon = cfg.icon;
                    const isPositive = ['earn', 'daily_reward', 'refund', 'bonus'].includes(tx.type);
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description || cfg.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.created_date ? format(new Date(tx.created_date), 'd MMM yyyy', { locale: th }) : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{(tx.balance_after || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}