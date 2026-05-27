import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Search, Trash2, Check, X, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ManageBooks() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ['manage-books'],
    queryFn: () => base44.entities.Book.list('-created_date', 200),
    initialData: [],
  });

  const updateBook = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Book.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-books'] }),
  });

  const deleteBook = useMutation({
    mutationFn: (id) => base44.entities.Book.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-books'] }),
  });

  const filtered = books.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status) => {
    const colors = {
      published: 'bg-green-500/10 text-green-500',
      draft: 'bg-yellow-500/10 text-yellow-500',
      pending_review: 'bg-accent/10 text-accent',
      rejected: 'bg-destructive/10 text-destructive',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <BookOpen className="inline w-7 h-7 text-primary mr-2" />
            Manage Books
          </h1>
          <p className="text-muted-foreground text-sm">{books.length} total books</p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="pl-10 glass" />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            filtered.map((book, i) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <GlassCard hover={false} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-11 rounded bg-muted shrink-0 overflow-hidden">
                      {book.cover_url && <img src={book.cover_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author} · {book.created_by}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${statusBadge(book.status)} text-[10px]`}>{book.status}</Badge>
                    {book.status !== 'published' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => updateBook.mutate({ id: book.id, data: { status: 'published' } })}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateBook.mutate({ id: book.id, data: { featured: !book.featured } })}>
                      <Star className={`w-3.5 h-3.5 ${book.featured ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{book.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this book and all its chapters.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBook.mutate(book.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}