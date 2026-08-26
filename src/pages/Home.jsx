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

function HeroSection({ user, featuredCover }) {
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const cards = [
    { icon: TrendingUp, title: 'กำลังนิยม', sub: 'อัปเดตทุกวัน', to: '/discover' },
    { icon: Users, title: 'จับคู่นักอ่าน', sub: 'เจอเพื่อนใหม่', to: '/matching' },
    { icon: Star, title: 'รีวิวจากชุมชน', sub: 'คัดสรรแล้ว', to: '/community' },
  ];
  return (
    <section className="relative px-4 pt-10 pb-14 md:pt-16 md:pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
          {/* Left text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-medium text-amber-200">แพลตฟอร์มนักอ่าน</span>
            </div>
            {firstName && (
              <p className="text-white/60 text-lg mb-3 font-medium">สวัสดี, {firstName} 👋</p>
            )}
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-[1.05] tracking-tight mb-5 text-white">
              ค้นพบหนังสือ<br />
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">เล่มต่อไปของคุณ</span>
            </h1>
            <p className="text-base text-white/60 max-w-md mb-8 mx-auto lg:mx-0">
              อ่านหนังสือ เขียนนิยาย จับคู่นักอ่าน และพูดคุยในชุมชน — ครบในแพลตฟอร์มเดียว
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <Link to="/discover">
                <Button size="lg" className="rounded-full px-8 gap-2 bg-none bg-amber-400 text-black hover:bg-amber-300 shadow-[0_8px_30px_hsl(43_96%_56%/0.35)]">
                  <Sparkles className="w-4 h-4" /> สำรวจหนังสือ
                </Button>
              </Link>
              <Link to="/write">
                <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-amber-400/50 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400">
                  <PenTool className="w-4 h-4" /> เริ่มเขียน
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Middle stacked cards */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden lg:flex flex-col gap-3 w-60 shrink-0">
            {cards.map((c, i) => (
              <motion.div key={c.title} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: i * 0.6 }}>
                <Link to={c.to}>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-all hover:border-amber-400/40 hover:-translate-y-0.5 hover:bg-white/10">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
                      <c.icon className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{c.title}</p>
                      <p className="text-xs text-white/50">{c.sub}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Right featured cover in glowing gold ring */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.25 }} className="hidden md:flex shrink-0">
            <div className="relative w-56 h-56 rounded-full p-[3px] bg-gradient-to-br from-amber-300/80 via-amber-500/40 to-transparent" style={{ boxShadow: '0 0 90px hsl(43 96% 56% / 0.35)' }}>
              <div className="w-full h-full rounded-full overflow-hidden bg-white/5 backdrop-blur-md border border-white/10">
                {featuredCover ? (
                  <img src={featuredCover} alt="featured" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-amber-300/40" />
                  </div>
                )}
              </div>
            </div>
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
                <div className="text-center p-5 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-amber-400/40 hover:-translate-y-1 hover:bg-white/10 group h-full">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-400/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <a.icon className="w-5 h-5 text-amber-300" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-white">{a.label}</h3>
                  <p className="text-xs text-white/50">{a.desc}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 py-6 border-y border-white/10">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }} className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs text-white/50 mt-1.5 tracking-wide">{s.label}</p>
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
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <Icon className="w-4 h-4 text-amber-300" />
            </div>
            <h2 className="text-xl font-heading font-bold tracking-tight text-white">{title}</h2>
          </div>
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="gap-1 text-white/50 hover:text-amber-300 rounded-full hover:bg-white/10">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <BookGrid books={books} loading={loading} scroll dark />
      </div>
    </motion.section>
  );
}

function WriteBanner() {
  return (
    <section className="px-4 pb-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-amber-400/20 p-6 md:p-8 backdrop-blur-md">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-400/15 text-amber-300 rounded-full px-3 py-1 text-xs mb-3 border border-amber-400/25">
                  <PenTool className="w-3 h-3" /> สำหรับนักเขียน
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-2 text-white">มีเรื่องที่อยากเล่า?</h3>
                <p className="text-sm text-white/60">เริ่มเขียนนิยายของคุณ แล้วให้นักอ่านทั่วโลกได้อ่าน</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link to="/write">
                  <Button className="gap-2 rounded-full px-6 bg-none bg-amber-400 text-black hover:bg-amber-300"><PenTool className="w-4 h-4" /> เริ่มเขียน</Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="gap-2 rounded-full px-6 border-amber-400/50 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400"><BookOpen className="w-4 h-4" /> อัปโหลดหนังสือ</Button>
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

  const featuredCover = trendingBooks[0]?.cover_url || topRatedBooks[0]?.cover_url;

  return (
    <div className="relative min-h-screen bg-[#0B1120] text-white overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 w-[36rem] h-[36rem] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, hsl(43 96% 56% / 0.12), transparent 60%)' }} />
        <div className="absolute top-1/3 -left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, hsl(217 91% 60% / 0.10), transparent 60%)' }} />
      </div>

      <div className="relative">
        <HeroSection user={user} featuredCover={featuredCover} />
        <QuickActions />
        <StatsBar />
        <BookSection title="กำลังนิยม" icon={TrendingUp} books={trendingBooks} loading={trendingLoading} linkTo="/discover" delay={0.3} />
        <PersonalizedRecommendations />
        <BookSection title="คะแนนสูงสุด" icon={Star} books={topRatedBooks} loading={topRatedLoading} linkTo="/discover" delay={0.35} />
        <WriteBanner />
        <BookSection title="เพิ่มล่าสุด" icon={BookOpen} books={recentBooks} loading={recentLoading} linkTo="/discover" delay={0.5} />
      </div>
    </div>
  );
}