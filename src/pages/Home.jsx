import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, BookOpen, Users, ArrowRight, ScanLine, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookGrid from '@/components/books/BookGrid';
import GlassCard from '@/components/ui/GlassCard';

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">แพลตฟอร์มการอ่านด้วย AI</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-space font-bold leading-tight mb-6">
            ค้นพบหนังสือ
            <br />
            <span className="gradient-text">เล่มต่อไปของคุณ</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            ค้นพบหนังสือด้วย AI จับคู่นักอ่าน และชุมชนนักอ่าน — ครบในแพลตฟอร์มเดียว
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/discover">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-8 gap-2">
                <Sparkles className="w-4 h-4" /> สำรวจหนังสือ
              </Button>
            </Link>
            <Link to="/write">
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-primary/30 hover:bg-primary/10">
                <PenTool className="w-4 h-4" /> เริ่มเขียน
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { icon: ScanLine, label: 'AI สแกนหนังสือ', desc: 'สแกนปกหนังสือ', path: '/scanner', color: 'from-violet-500 to-purple-600' },
    { icon: Users, label: 'จับคู่นักอ่าน', desc: 'หาเพื่อนอ่านหนังสือ', path: '/matching', color: 'from-cyan-500 to-blue-600' },
    { icon: BookOpen, label: 'ชุมชน', desc: 'ร่วมพูดคุย', path: '/community', color: 'from-pink-500 to-rose-600' },
    { icon: Sparkles, label: 'AI ค้นพบ', desc: 'แนะนำอัจฉริยะ', path: '/discover', color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <section className="px-4 pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {actions.map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={a.path}>
              <GlassCard className="text-center p-5 md:p-6">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{a.label}</h3>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BookSection({ title, icon: Icon, books, loading, linkTo }) {
  return (
    <section className="px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-space font-bold">{title}</h2>
          </div>
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                ดูทั้งหมด <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
        <BookGrid books={books} loading={loading} />
      </div>
    </section>
  );
}

export default function Home() {
  const { data: trendingBooks, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-read_count', 10),
    initialData: [],
  });

  const { data: recentBooks, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-created_date', 10),
    initialData: [],
  });

  return (
    <div>
      <HeroSection />
      <QuickActions />
      <BookSection title="กำลังนิยม" icon={TrendingUp} books={trendingBooks} loading={trendingLoading} linkTo="/discover" />
      <BookSection title="เพิ่มล่าสุด" icon={BookOpen} books={recentBooks} loading={recentLoading} linkTo="/discover" />
    </div>
  );
}