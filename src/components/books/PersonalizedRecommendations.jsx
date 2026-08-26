import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-white">แนะนำสำหรับคุณ</h2>
              {topGenres.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {topGenres.map(g => (
                    <Badge key={g} className="text-[10px] px-2 py-0 bg-amber-400/10 text-amber-300 border-0">{g}</Badge>
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
            className="gap-2 rounded-full border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            {recommendations ? 'โหลดใหม่' : 'รับคำแนะนำ'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {!recommendations && !loading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-dashed border-amber-400/25 bg-white/5 backdrop-blur-md p-8 text-center">
                <Sparkles className="w-10 h-10 text-amber-300/40 mx-auto mb-3" />
                <p className="text-white/60 text-sm">กด "รับคำแนะนำ" เพื่อให้ AI แนะนำหนังสือที่ถูกใจคุณ</p>
                <p className="text-white/40 text-xs mt-1">วิเคราะห์จากแนวที่คุณเคยอ่านมา</p>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center">
                <Loader2 className="w-8 h-8 text-amber-300 animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/60">AI กำลังวิเคราะห์รสนิยมของคุณ...</p>
              </div>
            </motion.div>
          )}

          {recommendations && !loading && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((book, i) => (
                  <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Link to={`/book/${book.id}`}>
                      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 flex gap-3 h-full hover:border-amber-400/40 hover:bg-white/10 transition-all">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-16 h-24 bg-gradient-to-br from-amber-400/20 to-amber-600/10 rounded-lg shrink-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-300/40" />
                          </div>
                        )}
                        <div className="flex flex-col justify-between min-w-0">
                          <div>
                            <p className="font-semibold text-sm line-clamp-2 leading-snug mb-1 text-white">{book.title}</p>
                            <p className="text-xs text-white/50 line-clamp-1">{book.author}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(book.genres || []).slice(0, 2).map(g => (
                                <Badge key={g} className="text-[9px] px-1.5 py-0 bg-white/10 text-white/60 border-0">{g}</Badge>
                              ))}
                            </div>
                          </div>
                          {book.reason && (
                            <p className="text-[11px] text-amber-300/80 mt-2 line-clamp-2 italic">✨ {book.reason}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 shrink-0 self-center" />
                      </div>
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