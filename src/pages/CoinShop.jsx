import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, Zap, Star, Crown, Gem, CheckCircle2, Loader2, ArrowLeft, ShoppingCart, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 50,
    bonus: 5,
    price: 19,
    icon: Coins,
    color: 'from-slate-400 to-slate-500',
    glow: 'hsl(220 10% 50% / 0.2)',
    badge: null,
  },
  {
    id: 'mini',
    name: 'Mini Pack',
    coins: 120,
    bonus: 20,
    price: 49,
    icon: Zap,
    color: 'from-blue-400 to-blue-600',
    glow: 'hsl(217 90% 60% / 0.2)',
    badge: null,
  },
  {
    id: 'reader',
    name: 'Reader Pack',
    coins: 250,
    bonus: 50,
    price: 99,
    icon: Star,
    color: 'from-violet-400 to-purple-600',
    glow: 'hsl(260 80% 60% / 0.2)',
    badge: 'ยอดนิยม',
    popular: true,
  },
  {
    id: 'booklover',
    name: 'Book Lover Pack',
    coins: 650,
    bonus: 150,
    price: 249,
    icon: Sparkles,
    color: 'from-yellow-400 to-orange-500',
    glow: 'hsl(40 95% 55% / 0.25)',
    badge: 'คุ้มค่า',
  },
  {
    id: 'premium',
    name: 'Premium Reader',
    coins: 1400,
    bonus: 400,
    price: 499,
    icon: Crown,
    color: 'from-pink-400 to-rose-600',
    glow: 'hsl(340 80% 60% / 0.25)',
    badge: 'แนะนำ',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Reader',
    coins: 3000,
    bonus: 1000,
    price: 999,
    icon: Gem,
    color: 'from-cyan-400 to-teal-500',
    glow: 'hsl(185 90% 50% / 0.25)',
    badge: 'สุดคุ้ม',
  },
];

export default function CoinShop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [success, setSuccess] = useState(null);

  const { data: wallets } = useQuery({
    queryKey: ['wallet', user?.email],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });
  const wallet = wallets[0] || { balance: 0 };

  const purchase = useMutation({
    mutationFn: async (pkg) => {
      const totalCoins = pkg.coins + pkg.bonus;
      const newBalance = (wallet.balance || 0) + totalCoins;

      if (wallet.id) {
        await base44.entities.Wallet.update(wallet.id, {
          balance: newBalance,
          total_earned: (wallet.total_earned || 0) + totalCoins,
        });
      } else {
        await base44.entities.Wallet.create({
          user_email: user.email,
          balance: newBalance,
          total_earned: totalCoins,
          total_spent: 0,
        });
      }

      await base44.entities.CoinTransaction.create({
        user_email: user.email,
        amount: totalCoins,
        type: 'purchase',
        description: `ซื้อแพ็กเกจ: ${pkg.name} (${pkg.coins}+${pkg.bonus} เหรียญ)`,
        balance_after: newBalance,
        reference_id: pkg.id,
      });

      return { pkg, totalCoins, newBalance };
    },
    onSuccess: ({ pkg, totalCoins }) => {
      setSelected(null);
      setSuccess({ pkg, totalCoins });
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.email] });
      setTimeout(() => setSuccess(null), 4000);
    },
  });

  const perCoin = (pkg) => (pkg.price / (pkg.coins + pkg.bonus)).toFixed(2);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/profile">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-space font-bold gradient-text">ร้านค้าเหรียญ</h1>
              <p className="text-xs text-muted-foreground">เติมเหรียญเพื่อปลดล็อกบทพรีเมียม</p>
            </div>
          </div>

          {/* Current balance */}
          <GlassCard hover={false} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">เหรียญของฉัน</p>
              <motion.p key={wallet.balance} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-2xl font-bold font-space gradient-text">
                {(wallet.balance || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">เหรียญ</span>
              </motion.p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              1 บทพรีเมียม = 10 เหรียญ
            </Badge>
          </GlassCard>
        </motion.div>

        {/* Packages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PACKAGES.map((pkg, i) => {
            const Icon = pkg.icon;
            const total = pkg.coins + pkg.bonus;
            const isSelected = selected?.id === pkg.id;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div
                  className={`relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    pkg.popular
                      ? 'border-primary/50 shadow-lg'
                      : 'border-border/40 hover:border-border/70'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  style={pkg.popular ? { boxShadow: `0 0 24px ${pkg.glow}` } : undefined}
                  onClick={() => setSelected(pkg)}
                >
                  {/* Glow bg */}
                  <div className="absolute inset-0 bg-card/70 backdrop-blur-sm" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-5`} />

                  {pkg.badge && (
                    <div className={`absolute top-3 right-3 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${pkg.color} text-white`}>
                      {pkg.badge}
                    </div>
                  )}

                  <div className="relative p-4">
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-semibold text-sm">{pkg.name}</p>
                    </div>

                    {/* Coins */}
                    <div className="mb-3">
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold font-space">{pkg.coins.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground mb-1">เหรียญ</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Gift className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">+{pkg.bonus} โบนัส = รวม {total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Price + per coin */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold font-space">฿{pkg.price.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">฿{perCoin(pkg)}/เหรียญ</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          * นี่คือระบบสาธิต ไม่มีการเรียกเก็บเงินจริง เหรียญจะถูกเพิ่มเข้ากระเป๋าทันที
        </p>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 60, scale: 0.95 }}
              className="glass rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              {/* Package icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selected.color} flex items-center justify-center`}>
                  <selected.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-space font-bold text-center mb-1">{selected.name}</h2>
              <p className="text-muted-foreground text-sm text-center mb-5">ยืนยันการซื้อแพ็กเกจนี้?</p>

              <div className="bg-muted/30 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เหรียญ</span>
                  <span className="font-semibold flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-yellow-400" />{selected.coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">โบนัส</span>
                  <span className="font-semibold text-green-400 flex items-center gap-1"><Gift className="w-3.5 h-3.5" />+{selected.bonus}</span>
                </div>
                <div className="border-t border-border/30 pt-2 flex justify-between font-bold">
                  <span>รวม</span>
                  <span className="gradient-text flex items-center gap-1"><Coins className="w-3.5 h-3.5" />{(selected.coins + selected.bonus).toLocaleString()} เหรียญ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ราคา</span>
                  <span className="font-bold">฿{selected.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>ยกเลิก</Button>
                <Button
                  className={`flex-1 gap-2 bg-gradient-to-r ${selected.color} border-0 text-white hover:opacity-90`}
                  onClick={() => purchase.mutate(selected)}
                  disabled={purchase.isPending}
                >
                  {purchase.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  ซื้อเลย
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-6 py-4 flex items-center gap-4 border border-green-500/30 min-w-72"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">ซื้อสำเร็จ!</p>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Coins className="w-3 h-3" />
                +{success.totalCoins.toLocaleString()} เหรียญเข้ากระเป๋าแล้ว
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}