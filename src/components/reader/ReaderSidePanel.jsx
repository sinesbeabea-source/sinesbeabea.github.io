import React from 'react';
import { List, Sparkles } from 'lucide-react';
import ReaderTocList from './ReaderTocList';
import ReaderRecommendations from './ReaderRecommendations';

export default function ReaderSidePanel({ chapters, bookId, chapterId, isOwner, purchasedChapters }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <List className="w-4 h-4 text-primary" />
          <p className="text-sm font-heading font-bold">สารบัญ</p>
          <span className="text-[10px] text-muted-foreground ml-auto">{chapters.length} บท</span>
        </div>
        <ReaderTocList
          chapters={chapters}
          bookId={bookId}
          chapterId={chapterId}
          isOwner={isOwner}
          purchasedChapters={purchasedChapters}
          className="space-y-0.5 max-h-72 overflow-y-auto pr-1"
        />
      </div>

      <ReaderRecommendations currentBookId={bookId} />

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-heading font-bold">หนังสือดี ๆ รอให้คุณค้นพบ อยู่เสมอ</p>
        <p className="text-xs text-muted-foreground mt-1">สำรวจคลังหนังสือของเรา</p>
      </div>
    </div>
  );
}