import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, Settings, X, Moon, Sun, Minus, Plus, BookOpen, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

export default function EbookReader() {
  const { bookId, chapterId } = useParams();
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => { const b = await base44.entities.Book.filter({ id: bookId }); return b[0]; },
  });

  const { data: chapters } = useQuery({
    queryKey: ['chapters', bookId],
    queryFn: () => base44.entities.Chapter.filter({ book_id: bookId, status: 'published' }, 'chapter_number', 200),
    initialData: [],
  });

  const { data: chapter, isLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => { const c = await base44.entities.Chapter.filter({ id: chapterId }); return c[0]; },
  });

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Save progress
  useEffect(() => {
    if (!user || !book || chapters.length === 0) return;
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
              <p className="text-xs text-muted-foreground">{chapter?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Chapter list */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><List className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Chapters</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-1 max-h-[80vh] overflow-y-auto">
                  {chapters.map((ch, i) => (
                    <Link key={ch.id} to={`/read/${bookId}/${ch.id}`}>
                      <Button variant={ch.id === chapterId ? "secondary" : "ghost"} className="w-full justify-start text-sm" size="sm">
                        #{ch.chapter_number || i + 1} — {ch.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Settings */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Reading Settings</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Font Size</label>
                    <div className="flex items-center gap-3">
                      <Minus className="w-4 h-4" />
                      <Slider value={[fontSize]} onValueChange={v => setFontSize(v[0])} min={12} max={28} step={1} />
                      <Plus className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{fontSize}px</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Theme</label>
                    <div className="flex gap-2">
                      <Button variant={darkMode ? "default" : "outline"} size="sm" onClick={() => setDarkMode(true)}>
                        <Moon className="w-4 h-4 mr-1" /> Dark
                      </Button>
                      <Button variant={!darkMode ? "default" : "outline"} size="sm" onClick={() => setDarkMode(false)}>
                        <Sun className="w-4 h-4 mr-1" /> Light
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
        <h1 className="text-2xl font-bold mb-8 text-center">{chapter?.title}</h1>
        <div 
          className="prose prose-invert max-w-none leading-relaxed"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: chapter?.content || '<p>No content available for this chapter.</p>' }}
        />
      </div>

      {/* Bottom nav */}
      {showControls && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 p-3 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          {prevChapter ? (
            <Link to={`/read/${bookId}/${prevChapter.id}`}>
              <Button variant="ghost" size="sm" className="gap-1"><ChevronLeft className="w-4 h-4" /> Previous</Button>
            </Link>
          ) : <div />}
          
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {chapters.length}
          </span>

          {nextChapter ? (
            <Link to={`/read/${bookId}/${nextChapter.id}`}>
              <Button variant="ghost" size="sm" className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
}