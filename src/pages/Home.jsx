import React from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import CategoriesRow from '@/components/home/CategoriesRow';
import HomeSidebar from '@/components/home/HomeSidebar';
import CommunityFeed from '@/components/home/CommunityFeed';
import BottomBanner from '@/components/home/BottomBanner';
import BookGrid from '@/components/books/BookGrid';

export default function Home() {
  const { user } = useAuth();

  const { data: trendingBooks = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-read_count', 10),
    staleTime: 0,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['home-posts'],
    queryFn: () => base44.entities.CommunityPost.filter({}, '-created_date', 3),
    staleTime: 30 * 1000,
  });

  const { data: myProgress = [] } = useQuery({
    queryKey: ['my-progress-home', user?.email],
    queryFn: () => base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 100),
    enabled: !!user,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['my-friends-home', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['my-matches-home', user?.email],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, status: 'accepted' }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['my-avatar-home', user?.email],
    queryFn: () => base44.entities.UserAvatar.filter({ user_email: user?.email }, '-created_date', 1),
    enabled: !!user,
  });

  const finished = myProgress.filter(p => p.status === 'finished').length;
  const reading = myProgress.filter(p => p.status === 'reading').length;
  const exp = finished * 100 + reading * 40;
  const expMax = 300;

  const stats = [
    { label: 'อ่านจบ', value: finished },
    { label: 'กำลังอ่าน', value: reading },
    { label: 'เพื่อน', value: friends.length },
    { label: 'แมทช์', value: matches.length },
  ];

  return (
    <div className="pb-10">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <HeroSection />
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main column */}
          <div className="min-w-0">
            <CategoriesRow />
            <section className="mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-heading font-bold">แนะนำสำหรับคุณ</h2>
              </div>
              <BookGrid books={trendingBooks} loading={trendingLoading} scroll />
            </section>
            <CommunityFeed posts={posts} />
          </div>
          {/* Sidebar */}
          <HomeSidebar
            user={user}
            avatarUrl={avatars[0]?.avatar_url}
            exp={exp}
            expMax={expMax}
            stats={stats}
            trendingBooks={trendingBooks.slice(0, 3)}
          />
        </div>
        <BottomBanner />
      </div>
    </div>
  );
}