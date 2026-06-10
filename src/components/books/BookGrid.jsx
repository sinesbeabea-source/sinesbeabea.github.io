import React from 'react';
import BookCard from './BookCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookGrid({ books, loading, columns = 'default', scroll = false }) {
  const gridClass = columns === 'large' 
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5';

  if (loading) {
    if (scroll) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="shrink-0 w-36">
              <Skeleton className="aspect-[2/3] rounded-xl mb-3" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={gridClass}>
        {Array(10).fill(0).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] rounded-xl mb-3" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!books?.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">ไม่พบหนังสือ</p>
      </div>
    );
  }

  if (scroll) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {books.map((book, i) => (
          <div key={book.id} className="shrink-0 w-36">
            <BookCard book={book} index={i} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {books.map((book, i) => (
        <BookCard key={book.id} book={book} index={i} />
      ))}
    </div>
  );
}