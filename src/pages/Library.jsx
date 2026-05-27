import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Library as LibraryIcon, BookOpen, Clock, CheckCircle, Bookmark, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';

export default function Library() {
  const { user } = useAuth();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['my-library'],
    queryFn: () => base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 100),
    initialData: [],
    enabled: !!user,
  });

  const { data: books } = useQuery({
    queryKey: ['all-books-lib'],
    queryFn: () => base44.entities.Book.list('-created_date', 200),
    initialData: [],
  });

  const bookMap = {};
  books.forEach(b => { bookMap[b.id] = b; });

  const getBooksByStatus = (status) => progress.filter(p => p.status === status).map(p => ({ ...p, book: bookMap[p.book_id] })).filter(p => p.book);

  const statusTabs = [
    { value: 'reading', label: 'Reading', icon: BookOpen },
    { value: 'want_to_read', label: 'Want to Read', icon: Bookmark },
    { value: 'finished', label: 'Finished', icon: CheckCircle },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <LibraryIcon className="inline w-7 h-7 text-primary mr-2" />
            My Library
          </h1>
          <p className="text-muted-foreground text-sm">{progress.length} books in your collection</p>
        </motion.div>

        <Tabs defaultValue="reading">
          <TabsList className="glass mb-6">
            {statusTabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-2">
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="text-xs text-muted-foreground">({getBooksByStatus(t.value).length})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {statusTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {getBooksByStatus(tab.value).length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No books here yet</p>
              ) : (
                <div className="space-y-3">
                  {getBooksByStatus(tab.value).map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link to={`/book/${item.book.id}`}>
                        <GlassCard className="flex items-center gap-4 p-3">
                          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={item.book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop'}
                              alt={item.book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{item.book.title}</h3>
                            <p className="text-xs text-muted-foreground">{item.book.author}</p>
                            {item.status === 'reading' && (
                              <div className="mt-2">
                                <Progress value={item.progress_percent || 0} className="h-1" />
                                <p className="text-[10px] text-muted-foreground mt-0.5">{item.progress_percent || 0}% complete</p>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            Ch. {item.current_chapter || 1}
                          </div>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}