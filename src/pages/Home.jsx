import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, BookOpen, Users, ArrowRight, PenTool, UsersRound, Library, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookGrid from '@/components/books/BookGrid';
import PersonalizedRecommendations from '@/components/books/PersonalizedRecommendations';

function HeroSection({ user }) {
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-14 md:pt-24 md:pb-20">
      <div className="relative max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
          {/* Left text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-1.5 mb-6 bg-card">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">แพลตฟอร์มนักอ่าน</span>
            </div>
            {firstName && (
              <p className="text-foreground/60 text-lg mb-3 font-medium">สวัสดี, {firstName} 👋</p>
            )}
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-[1.05] tracking-tight mb-5">
              ค้นพบหนังสือ<br />
              <span className="gradient-text-static">เล่มต่อไปของคุณ</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md mb-8 mx-auto md:mx-0">
              อ่านหนังสือ เขียนนิยาย จับคู่นักอ่าน และพูดคุยในชุมชน — ครบในแพลตฟอร์มเดียว
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <Link to="/discover">
                <Button size="lg" className="rounded-full px-8 gap-2">
                  <Sparkles className="w-4 h-4" /> สำรวจหนังสือ
                </Button>
              </Link>
              <Link to="/write">
                <Button size="lg" variant="outline" className="rounded-full px-8 gap-2">
                  <PenTool className="w-4 h-4" /> เริ่มเขียน
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right stacked boxes */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden md:flex flex-col gap-3 w-64 shrink-0">
            {[
              { icon: TrendingUp, title: 'กำลังนิยม', sub: 'อัปเดตทุกวัน', to: '/discover' },
              { icon: Users, title: 'จับคู่นักอ่าน', sub: 'เจอเพื่อนใหม่', to: '/matching' },
              { icon: Star, title: 'รีวิวจากชุมชน', sub: 'คัดสรรแล้ว', to: '/community' },
            ].map((c, i) => (
              <motion.div key={c.title} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: i * 0.6 }}>
                <Link to={c.to}>
                  <div className="flex items-center gap-3 rounded-2xl border border-foreground/12 bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_hsl(328_62%_30%/0.10)]">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <c.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.sub}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { icon: Users, label: 'จับคู่นักอ่าน', desc: 'หาเพื่อนอ่านหนังสือ', path: '/matching' },
    { icon: UsersRound, label: 'Book Clubs', desc: 'คลับตามแนวที่ชอบ', path: '/book-clubs' },
    { icon: BookOpen, label: 'ชุมชน', desc: 'ร่วมพูดคุย', path: '/community' },
    { icon: Library, label: 'ชั้นหนังสือ', desc: 'ของสะสมของคุณ', path: '/library' },
  ];

  return (
    <section className="px-4 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {actions.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
              <Link to={a.path}>
                <div className="text-center p-5 md:p-6 rounded-2xl border border-foreground/12 bg-card transition-all hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_hsl(328_62%_30%/0.10)] group h-full">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <a.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{a.label}</h3>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const { data: bookCount } = useQuery({
    queryKey: ['stat-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-created_date', 1),
    initialData: [],
    staleTime: 5 * 60 * 1000,
  });
  const stats = [
    { label: 'หนังสือในคลัง', value: '500+' },
    { label: 'นักอ่านออนไลน์', value: '1,200+' },
    { label: 'ชุมชนเปิดใหม่', value: '50+' },
    { label: 'บทใหม่ทุกวัน', value: '100+' },
  ];
  return (
    <section className="px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 py-6 border-y border-foreground/10">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }} className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookSection({ title, icon: Icon, books, loading, linkTo, delay = 0 }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold tracking-tight">{title}</h2>
          </div>
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary rounded-full">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <BookGrid books={books} loading={loading} scroll />
      </div>
    </motion.section>
  );
}

function WriteBanner() {
  return (
    <section className="px-4 pb-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="relative overflow-hidden rounded-2xl bg-primary/8 border border-primary/15 p-6 md:p-8">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-card text-primary rounded-full px-3 py-1 text-xs mb-3 border border-primary/20">
                  <PenTool className="w-3 h-3" /> สำหรับนักเขียน
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-2">มีเรื่องที่อยากเล่า?</h3>
                <p className="text-sm text-muted-foreground">เริ่มเขียนนิยายของคุณ แล้วให้นักอ่านทั่วโลกได้อ่าน</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link to="/write">
                  <Button className="gap-2 rounded-full px-6"><PenTool className="w-4 h-4" /> เริ่มเขียน</Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="gap-2 rounded-full px-6"><BookOpen className="w-4 h-4" /> อัปโหลดหนังสือ</Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();

  const { data: trendingBooks = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-read_count', 10),
    staleTime: 0,
  });

  const { data: recentBooks = [], isLoading: recentLoading } = useQuery({
    queryKey: ['recent-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-created_date', 10),
    staleTime: 0,
  });

  const { data: topRatedBooks = [], isLoading: topRatedLoading } = useQuery({
    queryKey: ['top-rated-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-rating', 10),
    staleTime: 0,
  });

  return (
    <div>
      <HeroSection user={user} />
      <QuickActions />
      <StatsBar />
      <BookSection title="กำลังนิยม" icon={TrendingUp} books={trendingBooks} loading={trendingLoading} linkTo="/discover" delay={0.3} />
      <PersonalizedRecommendations />
      <BookSection title="คะแนนสูงสุด" icon={Star} books={topRatedBooks} loading={topRatedLoading} linkTo="/discover" delay={0.35} />
      <WriteBanner />
      <BookSection title="เพิ่มล่าสุด" icon={BookOpen} books={recentBooks} loading={recentLoading} linkTo="/discover" delay={0.5} />
    </div>
  );
}