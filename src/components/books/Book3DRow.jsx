import React from 'react';
import Book3D from './Book3D';
import { Skeleton } from '@/components/ui/skeleton';

export default function Book3DRow({ books, loading }) {
  if (loading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="shrink-0 w-36">
            <Skeleton className="aspect-[2/3] rounded-xl mb-4 ml-3" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!books?.length) {
    return <div className="text-center py-16 text-muted-foreground text-sm">ไม่พบหนังสือ</div>;
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
      {books.map((book, i) => (
        <div key={book.id} className="shrink-0 w-36 md:w-40">
          <Book3D book={book} index={i} />
        </div>
      ))}
    </div>
  );
}