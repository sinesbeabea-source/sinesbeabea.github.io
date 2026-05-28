import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';

export default function Bookmarks() {
  const { user } = useAuth();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', user?.email],
    queryFn: () => base44.entities.Bookmark.filter({ user_email: user?.email }, '-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-space font-bold mb-2 flex items-center gap-2">
        <Bookmark className="w-7 h-7 text-primary" /> บุ๊คมาร์ค
      </h1>
      <p className="text-muted-foreground text-sm mb-8">บทที่คุณบันทึกไว้</p>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีบุ๊คมาร์ค</p>
          <p className="text-xs mt-1">กดปุ่ม 🔖 ขณะอ่านเพื่อบันทึก</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm, i) => (
            <motion.div key={bm.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/read/${bm.book_id}/${bm.chapter_id}`}>
                <GlassCard className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5 text-primary fill-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bm.book_title || 'หนังสือ'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      บท {bm.chapter_number}: {bm.chapter_title}
                    </p>
                    {bm.note && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">📝 {bm.note}</p>}
                  </div>
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}