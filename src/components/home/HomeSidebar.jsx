import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, UserPlus, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function HomeSidebar({ user, avatarUrl, exp, expMax, stats, trendingBooks }) {
  const displayName = user?.full_name || 'นักอ่าน';
  const level = Math.floor(exp / expMax) + 1;

  return (
    <aside className="space-y-5 lg:sticky lg:top-20">
      {/* Profile summary */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">สวัสดี</p>
            <div className="flex items-center gap-2">
              <p className="font-bold leading-tight">{displayName}</p>
              <span className="text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">เลเวล {level}</span>
            </div>
          </div>
        </div>
        <div className="mb-1 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">สถิตินักอ่าน</span>
          <span className="font-semibold text-primary">{Math.min(exp, expMax)}/{expMax} EXP</span>
        </div>
        <Progress value={Math.min(100, (exp / expMax) * 100)} className="h-2 mb-4" />
        <div className="grid grid-cols-4 gap-2 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-primary/10 flex items-center justify-center">
                <p className="font-heading font-bold text-sm text-primary">{s.value}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promo cards */}
      <Link to="/coin-shop">
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Gift className="w-4 h-4" />
            <p className="text-xs font-semibold opacity-90">กิจกรรม & โปรโมชั่น</p>
          </div>
          <p className="font-bold text-sm mb-1">สะสมแต้มแลกรางวัลกับ BookMatch AI</p>
          <p className="text-[11px] opacity-80">สะสมเหรียญจากการอ่านและกิจกรรม แลกรางวัลสุดพิเศษ</p>
        </motion.div>
      </Link>
      <Link to="/friends">
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #E3E8FF, #F3E8FF)' }}>
          <div className="flex items-center gap-2 mb-1.5 text-primary">
            <UserPlus className="w-4 h-4" />
            <p className="text-xs font-semibold">ชวนเพื่อนมาอ่านด้วยกัน</p>
          </div>
          <p className="font-bold text-sm mb-1 text-foreground">ตามหาเพื่อนนักอ่านที่ใช่</p>
          <p className="text-[11px] text-muted-foreground">จับคู่กับคนที่มีรสนิยมการอ่านเหมือนคุณ</p>
        </motion.div>
      </Link>

      {/* Trending books */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-primary" />
          <h3 className="font-bold">หนังสือยอดนิยม</h3>
        </div>
        <div className="space-y-3">
          {trendingBooks.length === 0 && (
            <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
          )}
          {trendingBooks.map((b, i) => (
            <Link key={b.id} to={`/book/${b.id}`} className="flex items-center gap-3 group">
              <span className="font-heading font-bold text-lg text-primary/40 w-5 text-center shrink-0">{i + 1}</span>
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-9 h-12 rounded object-cover shrink-0" />
              ) : (
                <div className="w-9 h-12 rounded bg-muted shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{b.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{b.author || 'Unknown'}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/discover" className="mt-4 block">
          <Button variant="ghost" size="sm" className="w-full gap-1 text-primary">ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" /></Button>
        </Link>
      </div>
    </aside>
  );
}