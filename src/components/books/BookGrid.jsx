import React from 'react';
import BookCard from './BookCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookGrid({ books, loading, columns = 'default' }) {
  const gridClass = columns === 'large' 
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5';

  if (loading) {
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
        <p className="text-muted-foreground">No books found</p>
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