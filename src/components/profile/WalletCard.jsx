import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Gift, Star, ArrowUpRight, ArrowDownRight, History, Zap, BookOpen, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import DailyRewardCard from './DailyRewardCard';

const typeConfig = {
  earn:         { label: 'รายได้',              color: 'text-green-400',  bg: 'bg-green-400/10',  icon: ArrowUpRight },
  spend:        { label: 'ใช้จ่าย',             color: 'text-red-400',    bg: 'bg-red-400/10',    icon: ArrowDownRight },
  daily_reward: { label: 'รางวัลประจำวัน',      color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Gift },
  purchase:     { label: 'ซื้อบท',              color: 'text-red-400',    bg: 'bg-red-400/10',    icon: BookOpen },
  refund:       { label: 'คืนเงิน',             color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: ArrowUpRight },
  bonus:        { label: 'โบนัส',               color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Star },
};

const levelConfig = {
  bronze:   { label: 'บรอนซ์',   color: 'from-orange-600 to-orange-400' },
  silver:   { label: 'ซิลเวอร์', color: 'from-gray-400 to-gray-300' },
  gold:     { label: 'โกลด์',    color: 'from-yellow-500 to-yellow-300' },
  platinum: { label: 'แพลตินัม', color: 'from-cyan-400 to-blue-400' },
};

export default function WalletCard({ userEmail }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);

  const { data: wallets, refetch: refetchWallet } = useQuery({
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

  const { data: purchases } = useQuery({
    queryKey: ['purchased', userEmail],
    queryFn: () => base44.entities.PurchasedChapter.filter({ user_email: userEmail }, '-created_date', 30),
    enabled: !!userEmail && showPurchased,
    initialData: [],
  });

  const level = levelConfig[wallet.level || 'bronze'];

  return (
    <div className="space-y-3">
      {/* Main Wallet Card */}
      <GlassCard hover={false} className="p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">กระเป๋าเหรียญ</p>
              <Badge className={`bg-gradient-to-r ${level.color} text-white border-0 text-xs`}>
                ระดับ {level.label}
              </Badge>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <div className="flex items-end gap-2">
              <motion.span
                key={wallet.balance}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold font-space gradient-text"
              >
                {(wallet.balance || 0).toLocaleString()}
              </motion.span>
              <span className="text-base text-muted-foreground mb-0.5">เหรียญ</span>
            </div>
          </div>

          {/* Earned / Spent */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-green-400/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">รับทั้งหมด</span>
              </div>
              <p className="font-bold text-green-400 text-sm">+{(wallet.total_earned || 0).toLocaleString()}</p>
            </div>
            <div className="bg-red-400/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400">ใช้ทั้งหมด</span>
              </div>
              <p className="font-bold text-red-400 text-sm">-{(wallet.total_spent || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline"
              className="gap-1.5 flex-1 text-xs"
              onClick={() => setShowHistory(v => !v)}
            >
              <History className="w-3.5 h-3.5" /> ประวัติ
              <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              size="sm" variant="outline"
              className="gap-1.5 flex-1 text-xs"
              onClick={() => setShowPurchased(v => !v)}
            >
              <BookOpen className="w-3.5 h-3.5" /> ซื้อแล้ว
              <ChevronDown className={`w-3 h-3 transition-transform ${showPurchased ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Daily Reward */}
      <DailyRewardCard userEmail={userEmail} wallet={wallet} onClaimed={() => refetchWallet()} />

      {/* Transaction History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <GlassCard hover={false} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">ประวัติธุรกรรม</h3>
              </div>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">ยังไม่มีธุรกรรม</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {transactions.map(tx => {
                    const cfg = typeConfig[tx.type] || typeConfig.earn;
                    const Icon = cfg.icon;
                    const isPositive = ['earn', 'daily_reward', 'refund', 'bonus'].includes(tx.type);
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{tx.description || cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {tx.created_date ? format(new Date(tx.created_date), 'd MMM yy HH:mm', { locale: th }) : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : '-'}{Math.abs(tx.amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{tx.balance_after || 0}</p>
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

      {/* Purchased Chapters */}
      <AnimatePresence>
        {showPurchased && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <GlassCard hover={false} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">บทที่ซื้อแล้ว</h3>
              </div>
              {purchases.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">ยังไม่มีการซื้อบท</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {purchases.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.chapter_title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.purchased_at ? format(new Date(p.purchased_at), 'd MMM yy', { locale: th }) : ''}
                        </p>
                      </div>
                      <span className="text-xs text-red-400 font-bold">-{p.coins_spent}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}