import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, BookOpen } from 'lucide-react';

export default function ReaderRecommendations({ currentBookId }) {
  const { data: books } = useQuery({
    queryKey: ['reader-recs', currentBookId],
    queryFn: async () => {
      const all = await base44.entities.Book.filter({ status: 'published' }, '-rating', 6);
      return all.filter(b => b.id !== currentBookId).slice(0, 3);
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-heading font-bold mb-3">แนะนำสำหรับคุณ</p>
      <div className="space-y-3">
        {(books || []).map(b => (
          <Link key={b.id} to={`/book/${b.id}`} className="flex items-center gap-3 group">
            <div className="w-11 shrink-0">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-full aspect-[2/3] object-cover rounded-md border border-border" />
              ) : (
                <div className="w-full aspect-[2/3] rounded-md bg-gradient-to-br from-primary/15 to-accent/15 border border-border flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{b.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{b.author}</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-semibold">{b.rating || '-'}</span>
              </div>
            </div>
          </Link>
        ))}
        {books && books.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">ยังไม่มีหนังสือแนะนำ</p>
        )}
      </div>
    </div>
  );
}