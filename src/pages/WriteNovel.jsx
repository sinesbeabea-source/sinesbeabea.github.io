import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PenTool, Plus, Save, Sparkles, Loader2, Trash2, Eye, EyeOff, ArrowLeft, Lock, Unlock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/ui/GlassCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function WriteNovel() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: book } = useQuery({
    queryKey: ['write-book', bookId],
    queryFn: async () => { if (!bookId) return null; const b = await base44.entities.Book.filter({ id: bookId }); return b[0]; },
    enabled: !!bookId,
  });

  const { data: chapters, refetch: refetchChapters } = useQuery({
    queryKey: ['write-chapters', bookId],
    queryFn: () => base44.entities.Chapter.filter({ book_id: bookId }, 'chapter_number', 200),
    initialData: [],
    enabled: !!bookId,
  });

  const { data: myBooks } = useQuery({
    queryKey: ['my-books-write'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Book.filter({ created_by: me.email }, '-created_date', 50);
    },
    initialData: [],
  });

  useEffect(() => {
    if (selectedChapter) {
      setChapterTitle(selectedChapter.title);
      setChapterContent(selectedChapter.content || '');
    }
  }, [selectedChapter]);

  const saveChapter = async () => {
    if (!chapterTitle.trim()) return;
    setSaving(true);
    const wordCount = chapterContent.split(/\s+/).filter(Boolean).length;

    if (selectedChapter?.id) {
      await base44.entities.Chapter.update(selectedChapter.id, {
        title: chapterTitle, content: chapterContent, word_count: wordCount,
      });
    } else {
      await base44.entities.Chapter.create({
        book_id: bookId, title: chapterTitle, content: chapterContent,
        chapter_number: chapters.length + 1, status: 'draft', word_count: wordCount,
      });
    }
    setSaving(false);
    refetchChapters();
  };

  const togglePublish = async (ch) => {
    const newStatus = ch.status === 'published' ? 'draft' : 'published';
    await base44.entities.Chapter.update(ch.id, { status: newStatus });
    refetchChapters();
  };

  const togglePremium = async (ch, e) => {
    e.stopPropagation();
    await base44.entities.Chapter.update(ch.id, {
      is_premium: !ch.is_premium,
      coin_price: !ch.is_premium ? 10 : 0,
    });
    refetchChapters();
  };

  const deleteChapter = async (ch) => {
    await base44.entities.Chapter.delete(ch.id);
    if (selectedChapter?.id === ch.id) {
      setSelectedChapter(null);
      setChapterTitle('');
      setChapterContent('');
    }
    refetchChapters();
  };

  const aiSuggest = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Book: "${book?.title}". Current chapter: "${chapterTitle}". Content so far: "${chapterContent.slice(0, 500)}". Suggest the next 2-3 paragraphs to continue the story. Write in a creative, engaging style.`,
    });
    setChapterContent(prev => prev + '\n\n' + result);
    setAiLoading(false);
  };

  // No book selected - show book list
  if (!bookId) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-space font-bold mb-2">
            <PenTool className="inline w-7 h-7 text-primary mr-2" />
            Writing Desk
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Select a book to write or create a new one</p>

          <Link to="/upload">
            <GlassCard glow className="p-6 mb-6 text-center">
              <Plus className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Create New Book</p>
            </GlassCard>
          </Link>

          <div className="space-y-3">
            {myBooks.map(b => (
              <Link key={b.id} to={`/write/${b.id}`}>
                <GlassCard className="flex items-center gap-4 p-4">
                  <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{b.title}</h3>
                    <p className="text-xs text-muted-foreground">{b.chapter_count || 0} chapters · {b.status}</p>
                  </div>
                </GlassCard>
              </Link>
            ))}
            {myBooks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No books yet. Create your first book above!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chapter Sidebar */}
      <div className="w-64 border-r border-border/30 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border/30">
          <Link to="/write" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h2 className="font-bold text-sm truncate">{book?.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm group ${
                selectedChapter?.id === ch.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedChapter(ch)}
            >
              <span className="flex-1 truncate">#{ch.chapter_number || i + 1} {ch.title}</span>
              {ch.is_premium && <Coins className="w-3 h-3 text-yellow-400 shrink-0" />}
              <div className="hidden group-hover:flex items-center gap-1">
                <button onClick={(e) => togglePremium(ch, e)} title={ch.is_premium ? 'ปลดล็อกฟรี' : 'ตั้งเป็นพรีเมียม (10 coins)'}>
                  {ch.is_premium ? <Lock className="w-3 h-3 text-yellow-400" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); togglePublish(ch); }}>
                  {ch.status === 'published' ? <Eye className="w-3 h-3 text-green-500" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button onClick={e => e.stopPropagation()}><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteChapter(ch)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-border/30">
          <Button variant="ghost" size="sm" className="w-full gap-2" onClick={() => { setSelectedChapter(null); setChapterTitle(''); setChapterContent(''); }}>
            <Plus className="w-4 h-4" /> New Chapter
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border/30 flex items-center gap-3">
          <Input
            value={chapterTitle}
            onChange={e => setChapterTitle(e.target.value)}
            placeholder="Chapter title..."
            className="font-bold text-lg border-none bg-transparent p-0 h-auto focus-visible:ring-0"
          />
          <Button variant="outline" size="sm" onClick={aiSuggest} disabled={aiLoading} className="gap-1 shrink-0">
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI
          </Button>
          <Button size="sm" onClick={saveChapter} disabled={saving} className="gap-1 bg-primary shrink-0">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
          </Button>
        </div>
        <Textarea
          value={chapterContent}
          onChange={e => setChapterContent(e.target.value)}
          placeholder="Start writing your story..."
          className="flex-1 border-none rounded-none resize-none p-6 text-base leading-relaxed focus-visible:ring-0 bg-transparent"
        />
        <div className="p-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>{chapterContent.split(/\s+/).filter(Boolean).length} words</span>
          <span>{selectedChapter?.status || 'draft'}</span>
        </div>
      </div>
    </div>
  );
}