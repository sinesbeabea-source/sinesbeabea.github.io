import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Archive, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function DeleteBookModal({ book, open, onClose, onDeleted }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('choose'); // 'choose' | 'archive' | 'permanent'

  const archiveBook = useMutation({
    mutationFn: async () => {
      // Save to DeletedBook (soft delete)
      await base44.entities.DeletedBook.create({
        original_book_id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        owner_email: book.created_by,
        deleted_at: new Date().toISOString(),
        book_data: JSON.stringify(book),
        permanently_deleted: false,
      });
      // Unpublish the book
      await base44.entities.Book.update(book.id, { status: 'unpublished' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books-write'] });
      onDeleted?.();
      onClose();
    },
  });

  const permanentDelete = useMutation({
    mutationFn: async () => {
      // Delete all chapters first
      const chapters = await base44.entities.Chapter.filter({ book_id: book.id });
      await Promise.all(chapters.map(ch => base44.entities.Chapter.delete(ch.id)));
      // Delete book
      await base44.entities.Book.delete(book.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-books-write'] });
      onDeleted?.();
      onClose();
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="glass border-border/50 max-w-md">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl">ลบหนังสือ: {book?.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            เลือกวิธีที่ต้องการลบหนังสือเล่มนี้
          </AlertDialogDescription>
        </AlertDialogHeader>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => setMode('archive')}
              className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-left transition-all"
            >
              <Archive className="w-6 h-6 text-primary mb-2" />
              <p className="font-semibold text-sm">เก็บถาวร</p>
              <p className="text-xs text-muted-foreground mt-1">ซ่อนหนังสือ สามารถกู้คืนได้ในภายหลัง</p>
            </button>
            <button
              onClick={() => setMode('permanent')}
              className="p-4 rounded-xl border border-border/50 hover:border-destructive/30 hover:bg-destructive/5 text-left transition-all"
            >
              <Trash2 className="w-6 h-6 text-destructive mb-2" />
              <p className="font-semibold text-sm">ลบถาวร</p>
              <p className="text-xs text-muted-foreground mt-1">ลบหนังสือและทุกบทอย่างถาวร</p>
            </button>
          </div>
        )}

        {mode === 'archive' && (
          <div className="py-2">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <Archive className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium">เก็บถาวรหนังสือ</p>
              <p className="text-xs text-muted-foreground mt-1">หนังสือจะถูกซ่อนจากผู้อ่านอื่น แต่ข้อมูลทั้งหมดยังคงอยู่ คุณสามารถกู้คืนได้จากถังขยะ</p>
            </div>
          </div>
        )}

        {mode === 'permanent' && (
          <div className="py-2">
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">คำเตือน: ไม่สามารถย้อนกลับได้</p>
              <p className="text-xs text-muted-foreground mt-1">หนังสือและทุกบทจะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้</p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={() => { setMode('choose'); onClose(); }}>ยกเลิก</AlertDialogCancel>
          {mode === 'archive' && (
            <Button
              className="gap-2 bg-primary"
              onClick={() => archiveBook.mutate()}
              disabled={archiveBook.isPending}
            >
              {archiveBook.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              เก็บถาวร
            </Button>
          )}
          {mode === 'permanent' && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => permanentDelete.mutate()}
              disabled={permanentDelete.isPending}
            >
              {permanentDelete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ลบถาวร
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}