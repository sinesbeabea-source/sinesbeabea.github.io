import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, PenTool, Settings, LogOut, Library, Users, Camera, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import BookGrid from '@/components/books/BookGrid';
import { Dialog } from '@/components/ui/dialog';
import WalletCard from '@/components/profile/WalletCard';
import AvatarEditor, { AvatarDisplay } from '@/components/profile/AvatarEditor';
import DeleteBookModal from '@/components/books/DeleteBookModal';

export default function Profile() {
  const { user } = useAuth();
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const { data: myBooks, refetch: refetchBooks } = useQuery({
    queryKey: ['my-books'],
    queryFn: () => base44.entities.Book.filter({ created_by: user?.email }, '-created_date', 20),
    initialData: [],
    enabled: !!user,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-progress-all'],
    queryFn: () => base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 50),
    initialData: [],
    enabled: !!user,
  });

  const { data: myMatches } = useQuery({
    queryKey: ['my-matches-count'],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, status: 'accepted' }),
    initialData: [],
    enabled: !!user,
  });

  const { data: avatars } = useQuery({
    queryKey: ['avatar', user?.email],
    queryFn: () => base44.entities.UserAvatar.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const currentAvatar = avatars[0];

  const stats = [
    { label: 'อ่านจบแล้ว', value: myProgress.filter(p => p.status === 'finished').length, icon: BookOpen },
    { label: 'กำลังอ่าน', value: myProgress.filter(p => p.status === 'reading').length, icon: Library },
    { label: 'อัปโหลด', value: myBooks.length, icon: PenTool },
    { label: 'แมทช์', value: myMatches.length, icon: Users },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} glow className="p-8 text-center mb-8">
            {/* Avatar with edit button */}
            <div className="relative inline-block mb-4">
              <AvatarDisplay avatar={currentAvatar} userName={user?.full_name || user?.email} size="lg" />
              <button
                onClick={() => setShowAvatarEditor(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            <h1 className="text-2xl font-space font-bold mb-1">{user?.full_name || 'นักอ่าน'}</h1>
            <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-primary/10 text-primary">คนรักหนังสือ</Badge>
              <Badge className="bg-accent/10 text-accent">นักสำรวจ</Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Wallet toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <button
            onClick={() => setShowWallet(!showWallet)}
            className="w-full flex items-center gap-3 p-4 glass rounded-xl hover:bg-card/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold">กระเป๋าเหรียญ</p>
              <p className="text-xs text-muted-foreground">ดูยอดเหรียญและประวัติธุรกรรม</p>
            </div>
            <span className="text-muted-foreground text-sm">{showWallet ? '▲' : '▼'}</span>
          </button>
          {showWallet && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
              <WalletCard userEmail={user?.email} />
            </motion.div>
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'ชั้นหนังสือ', path: '/library', icon: Library },
            { label: 'อัปโหลดหนังสือ', path: '/upload', icon: BookOpen },
            { label: 'เขียนนิยาย', path: '/write', icon: PenTool },
            { label: 'ตั้งค่า', path: '/settings', icon: Settings },
            { label: 'แมทช์แชท', path: '/match-chat', icon: Users },
            { label: 'ถังขยะ', path: '/trash', icon: Trash2 },
          ].map(link => (
            <Link key={link.path} to={link.path}>
              <GlassCard className="p-4 text-center">
                <link.icon className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{link.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* My Books */}
        {myBooks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-space font-bold mb-4">หนังสือของฉัน</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {myBooks.map(book => (
                <div key={book.id} className="relative group">
                  <Link to={`/book/${book.id}`}>
                    <GlassCard className="p-2">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full aspect-[2/3] object-cover rounded-lg mb-2" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-2 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-primary/50" />
                        </div>
                      )}
                      <p className="text-xs font-medium truncate">{book.title}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{book.status}</Badge>
                    </GlassCard>
                  </Link>
                  <button
                    onClick={() => setBookToDelete(book)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button variant="ghost" className="text-destructive gap-2" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* Avatar Editor Dialog */}
      <Dialog open={showAvatarEditor} onOpenChange={setShowAvatarEditor}>
        <AvatarEditor
          userEmail={user?.email}
          userName={user?.full_name || user?.email}
          onClose={() => setShowAvatarEditor(false)}
        />
      </Dialog>

      {/* Delete Book Modal */}
      {bookToDelete && (
        <DeleteBookModal
          book={bookToDelete}
          open={!!bookToDelete}
          onClose={() => setBookToDelete(null)}
          onDeleted={() => { refetchBooks(); setBookToDelete(null); }}
        />
      )}
    </div>
  );
}