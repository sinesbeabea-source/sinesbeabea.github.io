import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

export default function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topGenres, setTopGenres] = useState([]);

  const { data: myProgress } = useQuery({
    queryKey: ['my-progress-recs', user?.email],
    queryFn: () => base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 30),
    enabled: !!user,
    initialData: [],
  });

  const fetchRecommendations = async () => {
    if (!user || loading) return;
    setLoading(true);

    // Get books the user has read
    const bookIds = [...new Set(myProgress.map(p => p.book_id))].filter(Boolean);

    // Get all available books first (always needed)
    const allBooks = await base44.entities.Book.filter({ status: 'published' }, '-rating', 50);

    let readBooks = [];
    if (bookIds.length > 0) {
      readBooks = allBooks.filter(b => bookIds.includes(b.id));
    }

    // Collect genres from read books
    const genreCount = {};
    readBooks.forEach(b => {
      (b.genres || []).forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    setTopGenres(sortedGenres.slice(0, 3));

    // Exclude already-read books
    const unreadBooks = allBooks.filter(b => !bookIds.includes(b.id));
    const bookCandidates = unreadBooks.map(b => ({
      id: b.id,
      title: b.title,
      genres: b.genres,
      mood: b.mood,
      tags: b.tags,
      rating: b.rating,
      description: b.description?.slice(0, 100),
    }));

    const userProfile = readBooks.length > 0
      ? `User has read: ${readBooks.map(b => b.title).join(', ')}. Preferred genres: ${sortedGenres.join(', ')}.`
      : `New user with no reading history. Suggest popular and highly-rated books.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${userProfile}\n\nAvailable books to recommend: ${JSON.stringify(bookCandidates)}\n\nRecommend the best 6 books for this user based on their taste. For each book give a short Thai reason why they'll love it (1 sentence).`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                book_id: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const recIds = (result.recommendations || []).map(r => r.book_id);
    const reasonMap = {};
    (result.recommendations || []).forEach(r => { reasonMap[r.book_id] = r.reason; });

    let recBooks = allBooks.filter(b => recIds.includes(b.id)).map(b => ({
      ...b,
      reason: reasonMap[b.id] || '',
    }));

    // Fallback: ถ้า AI หาไม่เจอ ให้แสดงหนังสือยอดนิยม (rating สูงสุด)
    if (recBooks.length === 0) {
      const fallback = await base44.entities.Book.filter({ status: 'published' }, '-read_count', 6);
      recBooks = fallback.map(b => ({ ...b, reason: 'หนังสือยอดนิยมที่นักอ่านส่วนใหญ่ชื่นชอบ ✨' }));
    }

    setRecommendations(recBooks);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <section className="px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-space font-bold">แนะนำสำหรับคุณ</h2>
              {topGenres.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {topGenres.map(g => (
                    <Badge key={g} className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-0">{g}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            disabled={loading}
            className="gap-2 rounded-full border-primary/30 hover:bg-primary/10"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            {recommendations ? 'โหลดใหม่' : 'รับคำแนะนำ'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {!recommendations && !loading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GlassCard hover={false} className="p-8 text-center border-dashed border-primary/20">
                <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">กด "รับคำแนะนำ" เพื่อให้ AI แนะนำหนังสือที่ถูกใจคุณ</p>
                <p className="text-muted-foreground text-xs mt-1">วิเคราะห์จากแนวที่คุณเคยอ่านมา</p>
              </GlassCard>
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GlassCard hover={false} className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">AI กำลังวิเคราะห์รสนิยมของคุณ...</p>
              </GlassCard>
            </motion.div>
          )}

          {recommendations && !loading && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((book, i) => (
                  <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Link to={`/book/${book.id}`}>
                      <GlassCard className="p-3 flex gap-3 h-full">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-16 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg shrink-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary/40" />
                          </div>
                        )}
                        <div className="flex flex-col justify-between min-w-0">
                          <div>
                            <p className="font-semibold text-sm line-clamp-2 leading-snug mb-1">{book.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(book.genres || []).slice(0, 2).map(g => (
                                <Badge key={g} className="text-[9px] px-1.5 py-0 bg-secondary text-secondary-foreground border-0">{g}</Badge>
                              ))}
                            </div>
                          </div>
                          {book.reason && (
                            <p className="text-[11px] text-primary/80 mt-2 line-clamp-2 italic">✨ {book.reason}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}