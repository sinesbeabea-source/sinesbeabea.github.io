import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';

export default function BookmarkButton({ user, bookId, chapterId, chapterTitle, chapterNumber, bookTitle, scrollPosition }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['bookmark', user?.email, chapterId],
    queryFn: () => base44.entities.Bookmark.filter({ user_email: user?.email, chapter_id: chapterId }),
    enabled: !!user && !!chapterId,
    select: d => d[0],
  });

  const toggle = async (e) => {
    e.stopPropagation();
    if (!user || saving) return;
    setSaving(true);
    if (existing) {
      await base44.entities.Bookmark.delete(existing.id);
    } else {
      await base44.entities.Bookmark.create({
        user_email: user.email,
        book_id: bookId,
        chapter_id: chapterId,
        chapter_title: chapterTitle,
        chapter_number: chapterNumber,
        book_title: bookTitle,
        scroll_position: scrollPosition || 0,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['bookmark', user?.email, chapterId] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.email] });
    setSaving(false);
  };

  const isBookmarked = !!existing;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={isBookmarked ? 'ลบบุ๊คมาร์ค' : 'บุ๊คมาร์ค'}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border ${
        isBookmarked
          ? 'bg-primary/20 border-primary/50 text-primary'
          : 'bg-muted/60 border-border/40 text-muted-foreground hover:text-primary hover:bg-primary/10'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
    </button>
  );
}