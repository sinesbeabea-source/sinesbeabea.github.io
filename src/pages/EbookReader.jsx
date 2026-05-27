import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, Settings, X, Moon, Sun, Minus, Plus, BookOpen, List, Lock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import PremiumChapterModal from '@/components/reader/PremiumChapterModal';

export default function EbookReader() {
  const { bookId, chapterId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => { const b = await base44.entities.Book.filter({ id: bookId }); return b[0]; },
  });

  const { data: chapters } = useQuery({
    queryKey: ['chapters', bookId],
    queryFn: () => base44.entities.Chapter.filter({ book_id: bookId, status: 'published' }, 'chapter_number', 200),
    initialData: [],
  });

  const { data: chapter, isLoading, refetch: refetchChapter } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => { const c = await base44.entities.Chapter.filter({ id: chapterId }); return c[0]; },
  });

  // Check if user already purchased this chapter
  const { data: purchasedChapters, refetch: refetchPurchased } = useQuery({
    queryKey: ['purchased', user?.email],
    queryFn: () => base44.entities.PurchasedChapter.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const isOwner = chapter?.created_by === user?.email || book?.created_by === user?.email;
  const isPurchased = purchasedChapters.some(p => p.chapter_id === chapterId);
  const isLocked = chapter?.is_premium && !isOwner && !isPurchased;

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Save progress
  useEffect(() => {
    if (!user || !book || chapters.length === 0 || isLocked) return;
    const percent = Math.round(((currentIndex + 1) / chapters.length) * 100);
    base44.entities.ReadingProgress.filter({ book_id: bookId, created_by: user.email }).then(progs => {
      if (progs[0]) {
        base44.entities.ReadingProgress.update(progs[0].id, {
          current_chapter: currentIndex + 1,
          progress_percent: percent,
          status: 'reading',
          last_read_date: new Date().toISOString()
        });
      } else {
        base44.entities.ReadingProgress.create({
          book_id: bookId,
          current_chapter: currentIndex + 1,
          progress_percent: percent,
          status: 'reading',
          last_read_date: new Date().toISOString()
        });
      }
    });
  }, [chapterId]);

  const bgClass = darkMode ? 'bg-[#0d0f14] text-[#c8ccd4]' : 'bg-[#f5f0e8] text-[#2d2a24]';

  if (isLoading) {
    return <div className={`min-h-screen flex items-center justify-center ${bgClass}`}><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`} onClick={() => setShowControls(p => !p)}>
      {/* Top bar */}
      {showControls && (
        <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 p-3 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Link to={`/book/${bookId}`}>
              <Button variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
            </Link>
            <div>
              <p className="text-sm font-medium line-clamp-1">{book?.title}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">{chapter?.title}</p>
                {chapter?.is_premium && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-0.5">
                    <Coins className="w-2 h-2" /> พรีเมียม
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><List className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>สารบัญ</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-1 max-h-[80vh] overflow-y-auto">
                  {chapters.map((ch, i) => {
                    const chLocked = ch.is_premium && !isOwner && !purchasedChapters.some(p => p.chapter_id === ch.id);
                    return (
                      <Link key={ch.id} to={`/read/${bookId}/${ch.id}`}>
                        <Button variant={ch.id === chapterId ? "secondary" : "ghost"} className="w-full justify-between text-sm" size="sm">
                          <span>#{ch.chapter_number || i + 1} — {ch.title}</span>
                          {chLocked && <Lock className="w-3 h-3 text-yellow-400" />}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>ตั้งค่าการอ่าน</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">ขนาดตัวอักษร</label>
                    <div className="flex items-center gap-3">
                      <Minus className="w-4 h-4" />
                      <Slider value={[fontSize]} onValueChange={v => setFontSize(v[0])} min={12} max={28} step={1} />
                      <Plus className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{fontSize}px</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">ธีม</label>
                    <div className="flex gap-2">
                      <Button variant={darkMode ? "default" : "outline"} size="sm" onClick={() => setDarkMode(true)}>
                        <Moon className="w-4 h-4 mr-1" /> มืด
                      </Button>
                      <Button variant={!darkMode ? "default" : "outline"} size="sm" onClick={() => setDarkMode(false)}>
                        <Sun className="w-4 h-4 mr-1" /> สว่าง
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-24" onClick={e => e.stopPropagation()}>
        {isLocked ? (
          /* Locked chapter paywall */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-space font-bold mb-2">{chapter?.title}</h2>
            <p className="text-muted-foreground mb-6">บทนี้เป็นบทพรีเมียม กรุณาซื้อเพื่ออ่าน</p>
            <div className="flex items-center gap-2 mb-8 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">ราคา: 10 เหรียญ</span>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 rounded-full px-8"
              onClick={() => setShowPremiumModal(true)}
            >
              <Coins className="w-4 h-4" /> ปลดล็อกบทนี้
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-8 text-center">{chapter?.title}</h1>
            <div
              className="prose prose-invert max-w-none leading-relaxed"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: chapter?.content || '<p>ยังไม่มีเนื้อหาในบทนี้</p>' }}
            />
          </>
        )}
      </div>

      {/* Bottom nav */}
      {showControls && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 p-3 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          {prevChapter ? (
            <Link to={`/read/${bookId}/${prevChapter.id}`}>
              <Button variant="ghost" size="sm" className="gap-1"><ChevronLeft className="w-4 h-4" /> ก่อนหน้า</Button>
            </Link>
          ) : <div />}

          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {chapters.length}
          </span>

          {nextChapter ? (
            <Link to={`/read/${bookId}/${nextChapter.id}`}>
              <Button variant="ghost" size="sm" className="gap-1">ถัดไป <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          ) : <div />}
        </div>
      )}

      {/* Premium unlock modal */}
      <PremiumChapterModal
        chapter={chapter}
        bookId={bookId}
        userEmail={user?.email}
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUnlocked={() => {
          refetchPurchased();
          refetchChapter();
          queryClient.invalidateQueries({ queryKey: ['wallet', user?.email] });
        }}
      />
    </div>
  );
}