import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, X, Moon, Sun, List, Lock, Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PremiumChapterModal from '@/components/reader/PremiumChapterModal';
import BookmarkButton from '@/components/reader/BookmarkButton';
import TTSButton from '@/components/reader/TTSButton';
import HighlightLayer from '@/components/reader/HighlightLayer';
import ReaderBookInfo from '@/components/reader/ReaderBookInfo';
import ReaderSidePanel from '@/components/reader/ReaderSidePanel';
import ReaderTocList from '@/components/reader/ReaderTocList';
import ReaderChapterHeader from '@/components/reader/ReaderChapterHeader';

export default function EbookReader() {
  const { bookId, chapterId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
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

  // Increment read_count once per chapter open
  useEffect(() => {
    if (!bookId || isLocked) return;
    base44.entities.Book.filter({ id: bookId }).then(([b]) => {
      if (b) base44.entities.Book.update(bookId, { read_count: (b.read_count || 0) + 1 });
    });
  }, [chapterId]);

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const percent = chapters.length ? Math.round(((currentIndex + 1) / chapters.length) * 100) : 0;

  // Save progress
  useEffect(() => {
    if (!user || !book || chapters.length === 0 || isLocked) return;
    const progressPercent = Math.round(((currentIndex + 1) / chapters.length) * 100);
    base44.entities.ReadingProgress.filter({ book_id: bookId, created_by: user.email }).then(progs => {
      if (progs[0]) {
        base44.entities.ReadingProgress.update(progs[0].id, {
          current_chapter: currentIndex + 1,
          progress_percent: progressPercent,
          status: 'reading',
          last_read_date: new Date().toISOString()
        });
      } else {
        base44.entities.ReadingProgress.create({
          book_id: bookId,
          current_chapter: currentIndex + 1,
          progress_percent: progressPercent,
          status: 'reading',
          last_read_date: new Date().toISOString()
        });
      }
    });
  }, [chapterId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link to={`/book/${bookId}`}>
              <Button variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{book?.title}</p>
              <p className="text-xs text-muted-foreground truncate">{chapter?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TTSButton text={chapter?.content} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)_320px] items-start">
        {/* Left sidebar — book info */}
        <aside className="hidden lg:block sticky top-[72px]">
          <ReaderBookInfo
            book={book}
            bookId={bookId}
            progress={percent}
            currentIndex={Math.max(currentIndex, 0)}
            totalChapters={chapters.length}
          />
        </aside>

        {/* Center — reader */}
        <main className="min-w-0">
          <ReaderChapterHeader chapter={chapter} currentIndex={currentIndex} />

          {/* Reading controls */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Select value={chapterId} onValueChange={v => navigate(`/read/${bookId}/${v}`)}>
              <SelectTrigger className="w-[210px] h-9 rounded-full text-sm">
                <SelectValue placeholder="เลือกตอน" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((ch, i) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    บทที่ {ch.chapter_number || i + 1} — {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => setDarkMode(d => !d)}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              โหมดกลางคืน
            </Button>

            <div className="flex items-center rounded-full border border-border bg-card h-9 overflow-hidden">
              <button
                onClick={() => setFontSize(f => Math.max(12, f - 1))}
                className="px-3 h-full text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                A-
              </button>
              <div className="w-px h-4 bg-border" />
              <button
                onClick={() => setFontSize(f => Math.min(28, f + 1))}
                className="px-3 h-full text-sm font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                A+
              </button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                  <List className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>สารบัญ</SheetTitle></SheetHeader>
                <ReaderTocList
                  chapters={chapters}
                  bookId={bookId}
                  chapterId={chapterId}
                  isOwner={isOwner}
                  purchasedChapters={purchasedChapters}
                  className="mt-4 space-y-0.5 max-h-[75vh] overflow-y-auto"
                />
              </SheetContent>
            </Sheet>

            <BookmarkButton
              user={user}
              bookId={bookId}
              chapterId={chapterId}
              chapterTitle={chapter?.title}
              chapterNumber={chapter?.chapter_number}
              bookTitle={book?.title}
              scrollPosition={window.scrollY}
            />
          </div>

          {/* Chapter content */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">{chapter?.title}</h2>
                <p className="text-muted-foreground mb-6">บทนี้เป็นบทพรีเมียม กรุณาซื้อเพื่ออ่าน</p>
                <div className="flex items-center gap-2 mb-8 px-6 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">ราคา: {chapter?.coin_price || 10} เหรียญ</span>
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
              <HighlightLayer user={user} bookId={bookId} chapterId={chapterId}>
                <div
                  className="max-w-none leading-loose text-foreground"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
                  dangerouslySetInnerHTML={{ __html: chapter?.content || '<p>ยังไม่มีเนื้อหาในบทนี้</p>' }}
                />
              </HighlightLayer>
            )}
          </div>

          {/* Chapter footer nav */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {prevChapter ? (
              <Link to={`/read/${bookId}/${prevChapter.id}`} className="group">
                <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ChevronLeft className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">ตอนก่อนหน้า</p>
                    <p className="text-sm font-semibold truncate group-hover:text-primary">{prevChapter.title}</p>
                  </div>
                </div>
              </Link>
            ) : <div />}

            {nextChapter ? (
              <Link to={`/read/${bookId}/${nextChapter.id}`} className="group">
                <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-end gap-3 text-right hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">ตอนถัดไป</p>
                    <p className="text-sm font-semibold truncate group-hover:text-primary">{nextChapter.title}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Link>
            ) : <div />}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            {currentIndex + 1} / {chapters.length}
          </p>
        </main>

        {/* Right sidebar — TOC + recommendations */}
        <aside className="hidden lg:block sticky top-[72px]">
          <ReaderSidePanel
            chapters={chapters}
            bookId={bookId}
            chapterId={chapterId}
            isOwner={isOwner}
            purchasedChapters={purchasedChapters}
          />
        </aside>
      </div>

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