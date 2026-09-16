import React from 'react';
import { Coins } from 'lucide-react';

function CatOnBooksIllustration() {
  return (
    <svg viewBox="0 0 150 110" className="w-32 h-24" aria-hidden="true">
      {/* window */}
      <rect x="96" y="6" width="44" height="40" rx="6" fill="hsl(239 84% 61% / 0.12)" />
      <line x1="118" y1="6" x2="118" y2="46" stroke="hsl(239 84% 61% / 0.25)" strokeWidth="2" />
      <line x1="96" y1="26" x2="140" y2="26" stroke="hsl(239 84% 61% / 0.25)" strokeWidth="2" />
      <circle cx="128" cy="14" r="4" fill="hsl(43 92% 60%)" />
      {/* book stack */}
      <rect x="30" y="78" width="66" height="12" rx="3" fill="hsl(258 90% 66% / 0.35)" />
      <rect x="36" y="66" width="56" height="12" rx="3" fill="hsl(239 84% 61% / 0.35)" />
      <rect x="42" y="54" width="46" height="12" rx="3" fill="hsl(330 80% 70% / 0.35)" />
      {/* sleeping cat */}
      <ellipse cx="62" cy="40" rx="24" ry="14" fill="hsl(258 60% 74%)" />
      <circle cx="42" cy="32" r="11" fill="hsl(258 60% 78%)" />
      <path d="M34 24 L36 31 L41 26 Z" fill="hsl(258 60% 78%)" />
      <path d="M50 24 L48 31 L43 26 Z" fill="hsl(258 60% 78%)" />
      <path d="M38 32 q2 2 4 0" stroke="hsl(217 33% 30%)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M44 32 q2 2 4 0" stroke="hsl(217 33% 30%)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M84 44 q10 6 6 16 q-2 5 -8 4" stroke="hsl(258 60% 70%)" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* sparkles */}
      <path d="M20 20 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="hsl(43 92% 60%)" />
      <path d="M110 62 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="hsl(258 90% 70%)" />
    </svg>
  );
}

export default function ReaderChapterHeader({ chapter, currentIndex }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-5 md:p-6 mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground mb-2">
          บทที่ {chapter?.chapter_number || currentIndex + 1}
        </span>
        <h1 className="font-heading font-bold text-xl md:text-2xl truncate">{chapter?.title}</h1>
        {chapter?.is_premium && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 border border-yellow-400/40 mt-2">
            <Coins className="w-3 h-3" /> พรีเมียม
          </span>
        )}
      </div>
      <div className="hidden sm:block shrink-0">
        <CatOnBooksIllustration />
      </div>
    </div>
  );
}