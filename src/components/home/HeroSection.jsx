import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, BookOpen, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="mb-8">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3.5 py-1.5 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> BookMatch AI
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold leading-tight tracking-tight mb-3">
            มากกว่าการแนะนำหนังสือ
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-2">
            เพราะทุกเล่ม...อาจพาเราไปเจอคนที่ใช่
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            BookMatch AI คือพื้นที่สำหรับคนรักการอ่าน — ค้นหาหนังสือที่ใช่
            จับคู่เพื่อนนักอ่านที่มีรสนิยมเดียวกัน และพูดคุยในชุมชนอันอบอุ่น
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/discover">
              <Button size="lg" className="rounded-full px-7 gap-2">
                <Search className="w-4 h-4" /> เริ่มค้นหาหนังสือ
              </Button>
            </Link>
            <Link to="/matching">
              <Button size="lg" variant="outline" className="rounded-full px-7 gap-2">
                ดูวิธีใช้งาน
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Abstract floating-books graphic (no images) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden lg:flex items-center justify-center">
          <div className="relative w-80 h-80">
            <div className="absolute inset-4 rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, #E3E8FF, transparent 70%)' }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-32 rounded-xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, #5D5FEF, #8B5CF6)', boxShadow: '0 16px 32px rgba(93,95,239,0.35)' }}>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="absolute right-6 top-8 w-20 h-28 rounded-xl flex items-center justify-center animate-float-slow" style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', boxShadow: '0 16px 32px rgba(236,72,153,0.30)' }}>
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="absolute left-4 bottom-12 w-20 h-28 rounded-xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, #A78BFA, #5D5FEF)', boxShadow: '0 16px 32px rgba(139,92,246,0.30)', animationDelay: '1.2s' }}>
              <Star className="w-7 h-7 text-white" />
            </div>
            <div className="absolute right-10 bottom-10 bg-card border border-border rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm animate-bounce-soft">
              ⭐ 4.9
            </div>
            <div className="absolute left-8 top-10 bg-card border border-border rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm animate-bounce-soft" style={{ animationDelay: '0.8s' }}>
              1,200+ นักอ่าน
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}