import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Trash2, Archive, RotateCcw, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function Trash() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: deletedBooks, isLoading } = useQuery({
    queryKey: ['deleted-books', user?.email],
    queryFn: () => base44.entities.DeletedBook.filter({ owner_email: user?.email, permanently_deleted: false }, '-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  const restoreBook = useMutation({
    mutationFn: async (deletedBook) => {
      // Restore book to published
      await base44.entities.Book.update(deletedBook.original_book_id, { status: 'draft' });
      // Remove from deleted books
      await base44.entities.DeletedBook.update(deletedBook.id, { permanently_deleted: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });

  const permanentDelete = useMutation({
    mutationFn: async (deletedBook) => {
      await base44.entities.DeletedBook.update(deletedBook.id, { permanently_deleted: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deleted-books'] }),
  });

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h1 className="text-3xl font-space font-bold">ถังขยะ</h1>
          </div>
          <p className="text-muted-foreground text-sm">หนังสือที่เก็บถาวร สามารถกู้คืนหรือลบถาวรได้</p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : deletedBooks.length === 0 ? (
          <div className="text-center py-16">
            <Archive className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">ถังขยะว่างเปล่า</p>
            <p className="text-xs text-muted-foreground mt-1">หนังสือที่เก็บถาวรจะปรากฏที่นี่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deletedBooks.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hover={false} className="flex items-center gap-4 p-4">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-12 h-16 rounded-lg object-cover shrink-0 opacity-60" />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0 opacity-60">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                        เก็บถาวร
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {book.deleted_at ? format(new Date(book.deleted_at), 'd MMM yyyy', { locale: th }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => restoreBook.mutate(book)}
                      disabled={restoreBook.isPending}
                    >
                      {restoreBook.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      <span className="hidden sm:inline">กู้คืน</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">ลบถาวร</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass border-border/50">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" /> ลบถาวร?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            "{book.title}" จะถูกลบออกจากถังขยะอย่างถาวร ไม่สามารถกู้คืนได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => permanentDelete.mutate(book)}
                          >
                            ลบถาวร
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}