import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Star, BookOpen, Eye, ChevronRight, Loader2, Plus, Lock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => base44.entities.Book.filter({ id }),
    select: (data) => data[0],
  });

  const { data: chapters } = useQuery({
    queryKey: ['chapters', id],
    queryFn: () => base44.entities.Chapter.filter({ book_id: id, status: 'published' }, 'chapter_number', 100),
    initialData: [],
  });

  const { data: purchasedChapters } = useQuery({
    queryKey: ['purchased', user?.email],
    queryFn: () => base44.entities.PurchasedChapter.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const purchasedIds = new Set(purchasedChapters.map(p => p.chapter_id));

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => base44.entities.Review.filter({ book_id: id }, '-created_date', 20),
    initialData: [],
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-progress', id],
    queryFn: async () => {
      const progs = await base44.entities.ReadingProgress.filter({ book_id: id, created_by: user?.email });
      return progs[0] || null;
    },
    enabled: !!user,
  });

  const addToLibrary = useMutation({
    mutationFn: (status) => {
      if (myProgress) {
        return base44.entities.ReadingProgress.update(myProgress.id, { status });
      }
      return base44.entities.ReadingProgress.create({ book_id: id, status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-progress', id] }),
  });

  const submitReview = useMutation({
    mutationFn: () => base44.entities.Review.create({ book_id: id, rating: reviewRating, content: reviewText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewText('');
      setShowReviewForm(false);
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!book) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Book not found</p></div>;
  }

  const placeholderCover = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 h-80">
          <img src={book.cover_url || placeholderCover} alt="" className="w-full h-full object-cover opacity-20 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="shrink-0">
              <div className="w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden neon-glow mx-auto md:mx-0">
                <img src={book.cover_url || placeholderCover} alt={book.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-space font-bold mb-2">{book.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{book.author || 'ไม่ทราบผู้แต่ง'}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                {book.rating > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(book.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-sm ml-1">{book.rating?.toFixed(1)} ({book.rating_count || 0})</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" /> {book.read_count || 0} ครั้ง
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" /> {chapters.length} บท
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                {book.genres?.map(g => <Badge key={g} variant="outline" className="border-primary/30 text-primary">{g}</Badge>)}
                {book.mood && <Badge className="bg-accent/20 text-accent">{book.mood}</Badge>}
                {book.tags?.slice(0, 4).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>

              <p className="text-muted-foreground mb-6 max-w-2xl">{book.description}</p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {chapters.length > 0 && (
                  <Link to={`/read/${id}/${chapters[0]?.id}`}>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent rounded-full gap-2 px-8">
                      <BookOpen className="w-4 h-4" /> {myProgress?.status === 'reading' ? 'อ่านต่อ' : 'เริ่มอ่าน'}
                    </Button>
                  </Link>
                )}
                <Select value={myProgress?.status || ''} onValueChange={(v) => addToLibrary.mutate(v)}>
                  <SelectTrigger className="w-44 rounded-full">
                    <SelectValue placeholder="+ เพิ่มในชั้นหนังสือ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want_to_read">อยากอ่าน</SelectItem>
                    <SelectItem value="reading">กำลังอ่าน</SelectItem>
                    <SelectItem value="finished">อ่านจบแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {myProgress && (
                <div className="mt-4 max-w-xs">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{myProgress.progress_percent || 0}%</span>
                  </div>
                  <Progress value={myProgress.progress_percent || 0} className="h-1.5" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chapters & Reviews */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Chapters */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-space font-bold mb-4">บทต่างๆ</h2>
            <div className="space-y-2">
              {chapters.map((ch, i) => {
                const isPremium = ch.is_premium;
                const isOwned = purchasedIds.has(ch.id) || ch.created_by === user?.email;
                const locked = isPremium && !isOwned;
                return (
                  <Link key={ch.id} to={`/read/${id}/${ch.id}`}>
                    <GlassCard className={`flex items-center justify-between p-3 ${locked ? 'opacity-80' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8">#{ch.chapter_number || i + 1}</span>
                        <div>
                          <span className="text-sm font-medium">{ch.title}</span>
                          {isPremium && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge className="text-[9px] h-4 px-1.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                พรีเมียม
                              </Badge>
                              <div className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                                <Coins className="w-2.5 h-2.5" /> 10
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {locked
                        ? <Lock className="w-4 h-4 text-yellow-400" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </GlassCard>
                  </Link>
                );
              })}
              {chapters.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีบทที่เผยแพร่</p>}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-space font-bold">รีวิว</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showReviewForm && (
              <GlassCard hover={false} className="mb-4 p-4">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className={`w-5 h-5 cursor-pointer ${s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="เขียนรีวิวของคุณ..." className="mb-3" />
                <Button size="sm" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
                  {submitReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ส่งรีวิว'}
                </Button>
              </GlassCard>
            )}

            <div className="space-y-3">
              {reviews.map(r => (
                <GlassCard key={r.id} hover={false} className="p-3">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{r.created_by}</p>
                </GlassCard>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีรีวิว</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}