import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Star, Heart, Info, BookMarked, Share2, BookOpen, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function ReaderBookInfo({ book, bookId, progress, currentIndex, totalChapters }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const rating = Number(book?.rating) || 0;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'คัดลอกลิงก์บทอ่านแล้ว' });
    } catch {
      toast({ title: 'คัดลอกลิงก์ไม่สำเร็จ', variant: 'destructive' });
    }
  };

  const menuItems = [
    { icon: Info, label: 'รายละเอียดหนังสือ', to: `/book/${bookId}` },
    { icon: MessageCircle, label: 'รีวิว', to: `/book/${bookId}` },
    { icon: BookMarked, label: 'เพิ่มในคลัง', to: '/library' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Link to={`/book/${bookId}`}>
        <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </Button>
      </Link>

      <div className="w-32 mx-auto mb-4">
        {book?.cover_url ? (
          <img
            src={book.cover_url}
            alt={book?.title}
            className="w-full aspect-[2/3] object-cover rounded-xl border border-border shadow-md"
          />
        ) : (
          <div className="w-full aspect-[2/3] rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary/50" />
          </div>
        )}
      </div>

      <h3 className="font-heading font-bold text-base text-center mb-0.5">{book?.title}</h3>
      <p className="text-xs text-muted-foreground text-center mb-3">{book?.author}</p>

      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`}
            />
          ))}
          <span className="text-xs font-semibold ml-1">{rating || '-'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5 fill-primary/20 text-primary" />
          {(book?.like_count || 0).toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {(book?.genres || []).slice(0, 4).map(g => (
          <Badge key={g} variant="secondary" className="rounded-full text-[10px]">{g}</Badge>
        ))}
      </div>

      <p className={`text-xs text-muted-foreground leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-3'}`}>
        {book?.description || 'ยังไม่มีคำอธิบายหนังสือ'}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-full text-xs mb-5"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'ย่อรายละเอียด' : 'อ่านเพิ่มเติม'}
      </Button>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold">ความคืบหน้าการอ่าน</span>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 mb-1" />
        <p className="text-[10px] text-muted-foreground">บทที่ {currentIndex + 1} จาก {totalChapters} บท</p>
      </div>

      <div className="space-y-1">
        {menuItems.map(item => (
          <Link key={item.label} to={item.to}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
          </Link>
        ))}
        <button
          onClick={handleShare}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Share2 className="w-4 h-4" />
          แชร์
        </button>
      </div>
    </div>
  );
}