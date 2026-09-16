import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function ReaderTocList({ chapters, bookId, chapterId, isOwner, purchasedChapters, className }) {
  return (
    <div className={className}>
      {chapters.map((ch, i) => {
        const locked = ch.is_premium && !isOwner && !purchasedChapters?.some(p => p.chapter_id === ch.id);
        const active = ch.id === chapterId;
        return (
          <Link
            key={ch.id}
            to={`/read/${bookId}/${ch.id}`}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
              active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
            }`}
          >
            <span className="truncate">
              <span className="text-xs mr-1 opacity-70">{ch.chapter_number || i + 1}.</span>
              {ch.title}
            </span>
            {locked && <Lock className="w-3.5 h-3.5 shrink-0 text-yellow-500" />}
          </Link>
        );
      })}
    </div>
  );
}