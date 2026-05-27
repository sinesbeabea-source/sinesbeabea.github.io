import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, Search, Radio, X, ChevronRight, Clock, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import MatchChatPopup from '@/components/matching/MatchChatPopup';

const HEARTBEAT_INTERVAL = 15000;
const ACTIVE_THRESHOLD = 60000;
const POLL_INTERVAL = 5000;

export default function Matching() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedBook, setSelectedBook] = useState(null);
  const [searching, setSearching] = useState(false);
  const [mySession, setMySession] = useState(null);
  const [likedEmails, setLikedEmails] = useState(new Set());   // emails I liked
  const [chatPopup, setChatPopup] = useState(null);             // { buddyEmail, match, bookTitle }

  const heartbeatRef = useRef(null);

  // My books
  const { data: myBooks } = useQuery({
    queryKey: ['my-reading-books', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 20);
      const bookIds = [...new Set(progress.map(p => p.book_id).filter(Boolean))];
      if (!bookIds.length) return [];
      const allBooks = await base44.entities.Book.list('-updated_date', 100);
      return allBooks.filter(b => bookIds.includes(b.id) && b.status === 'published');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: allBooks } = useQuery({
    queryKey: ['all-published-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-read_count', 30),
    initialData: [],
  });

  const displayBooks = myBooks.length > 0 ? myBooks : allBooks;

  // Active sessions (other users on same book)
  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions', selectedBook?.id],
    queryFn: async () => {
      if (!selectedBook) return [];
      const sessions = await base44.entities.ReadingSession.filter(
        { book_id: selectedBook.id, status: 'searching' },
        '-last_active', 50
      );
      return sessions.filter(s =>
        s.user_email !== user?.email &&
        s.last_active &&
        new Date(s.last_active) > new Date(Date.now() - ACTIVE_THRESHOLD)
      );
    },
    enabled: !!selectedBook && searching,
    refetchInterval: POLL_INTERVAL,
  });

  // Poll for mutual likes (someone liked me back)
  useQuery({
    queryKey: ['mutual-likes', user?.email],
    queryFn: async () => {
      if (!likedEmails.size) return [];
      // Check if anyone who I liked has also liked me
      for (const likedEmail of likedEmails) {
        const theyLikedMe = await base44.entities.ReaderMatch.filter({
          user_email: likedEmail,
          matched_email: user?.email,
          status: 'liked',
        });
        if (theyLikedMe.length > 0) {
          // Mutual like! update both to accepted and open chat
          const myMatch = await base44.entities.ReaderMatch.filter({
            user_email: user?.email,
            matched_email: likedEmail,
          });
          if (myMatch.length > 0 && myMatch[0].status === 'liked') {
            await base44.entities.ReaderMatch.update(myMatch[0].id, { status: 'accepted' });
            await base44.entities.ReaderMatch.update(theyLikedMe[0].id, { status: 'accepted' });
            // Notify the other person
            await base44.entities.Notification.create({
              user_email: likedEmail,
              type: 'match',
              title: '💕 แมทช์แล้ว!',
              message: `${user?.full_name || user?.email?.split('@')[0]} กดใจคุณกลับแล้ว!`,
              from_user: user?.email,
              link: '/matching',
            });
            setChatPopup({
              buddyEmail: likedEmail,
              match: myMatch[0],
              bookTitle: selectedBook?.title,
            });
            setLikedEmails(prev => { const n = new Set(prev); n.delete(likedEmail); return n; });
          }
        }
      }
      return [];
    },
    enabled: likedEmails.size > 0,
    refetchInterval: 4000,
  });

  const startSearching = useCallback(async (book) => {
    if (!user || !book) return;
    setSelectedBook(book);
    setSearching(true);

    const now = new Date().toISOString();
    const existing = await base44.entities.ReadingSession.filter({ user_email: user.email });
    let session;
    if (existing.length > 0) {
      session = await base44.entities.ReadingSession.update(existing[0].id, {
        book_id: book.id, book_title: book.title,
        book_cover: book.cover_url || '', book_author: book.author || '',
        user_name: user.full_name || user.email,
        last_active: now, status: 'searching',
      });
    } else {
      session = await base44.entities.ReadingSession.create({
        user_email: user.email, user_name: user.full_name || user.email,
        book_id: book.id, book_title: book.title,
        book_cover: book.cover_url || '', book_author: book.author || '',
        last_active: now, status: 'searching',
      });
    }
    setMySession(session);

    heartbeatRef.current = setInterval(async () => {
      if (session?.id) {
        await base44.entities.ReadingSession.update(session.id, { last_active: new Date().toISOString() });
      }
    }, HEARTBEAT_INTERVAL);
  }, [user]);

  const stopSearching = useCallback(async () => {
    clearInterval(heartbeatRef.current);
    if (mySession?.id) {
      await base44.entities.ReadingSession.update(mySession.id, { status: 'offline' });
    }
    setMySession(null);
    setSearching(false);
    setSelectedBook(null);
    setLikedEmails(new Set());
  }, [mySession]);

  useEffect(() => {
    return () => {
      clearInterval(heartbeatRef.current);
      if (mySession?.id) {
        base44.entities.ReadingSession.update(mySession.id, { status: 'offline' }).catch(() => {});
      }
    };
  }, [mySession]);

  const handleLike = async (buddy) => {
    // Create a ReaderMatch with status "liked"
    const existing = await base44.entities.ReaderMatch.filter({
      user_email: user?.email,
      matched_email: buddy.user_email,
    });
    if (existing.length === 0) {
      await base44.entities.ReaderMatch.create({
        user_email: user?.email,
        matched_email: buddy.user_email,
        status: 'liked',
        liked_at: new Date().toISOString(),
        book_id: selectedBook?.id,
        book_title: selectedBook?.title,
      });
      // Notify the buddy
      await base44.entities.Notification.create({
        user_email: buddy.user_email,
        type: 'match',
        title: '💙 มีคนกดใจคุณ!',
        message: `${user?.full_name || user?.email?.split('@')[0]} กดใจคุณขณะอ่าน "${selectedBook?.title}"`,
        from_user: user?.email,
        link: '/matching',
      });
    }
    setLikedEmails(prev => new Set([...prev, buddy.user_email]));
  };

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Chat Popup */}
      <AnimatePresence>
        {chatPopup && (
          <MatchChatPopup
            match={chatPopup.match}
            buddyEmail={chatPopup.buddyEmail}
            bookTitle={chatPopup.bookTitle}
            onClose={() => setChatPopup(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <Users className="inline w-7 h-7 text-primary mr-2" />
            Reading <span className="gradient-text">Buddy</span>
          </h1>
          <p className="text-muted-foreground text-sm">กดใจคนที่อ่านเล่มเดียวกัน ถ้ากดใจกันทั้งคู่ แชทได้เลย!</p>
        </motion.div>

        {/* Searching state */}
        {searching && selectedBook && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <GlassCard hover={false} glow className="p-6 text-center">
              {/* Pulse */}
              <div className="relative flex items-center justify-center mb-6">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-primary/30"
                    animate={{ scale: [1, 2 + i * 0.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                    style={{ width: 60, height: 60 }}
                  />
                ))}
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                  <Radio className="w-7 h-7 text-primary" />
                </div>
              </div>

              <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">กำลังค้นหา...</p>
              <h2 className="font-space font-bold text-xl mb-1">"{selectedBook.title}"</h2>
              {selectedBook.author && <p className="text-sm text-muted-foreground mb-4">โดย {selectedBook.author}</p>}

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  {activeSessions?.length > 0
                    ? `พบ ${activeSessions.length} คนที่กำลังอ่านอยู่`
                    : 'กำลังรอคนอื่น...'}
                </span>
              </div>

              {/* Buddy list with like button */}
              <AnimatePresence>
                {activeSessions?.map(s => {
                  const liked = likedEmails.has(s.user_email);
                  return (
                    <motion.div
                      key={s.user_email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-2 text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {s.user_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.user_name || s.user_email}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">ออนไลน์อยู่</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => !liked && handleLike(s)}
                        className={`gap-1 h-8 text-xs shrink-0 rounded-full transition-all ${
                          liked
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 cursor-default'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${liked ? 'fill-rose-400' : ''}`} />
                        {liked ? 'กดใจแล้ว' : 'กดใจ'}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {likedEmails.size > 0 && (
                <p className="text-xs text-muted-foreground mt-2 mb-3">
                  💕 รอให้อีกฝ่ายกดใจกลับ... จะเปิดแชทอัตโนมัติ
                </p>
              )}

              <Button variant="outline" onClick={stopSearching} className="mt-2 gap-2 text-muted-foreground">
                <X className="w-4 h-4" /> หยุดค้นหา
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Book selection */}
        {!searching && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {myBooks.length > 0 ? 'หนังสือที่คุณกำลังอ่าน' : 'เลือกหนังสือที่อยากหาเพื่อนอ่าน'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayBooks.slice(0, 10).map(book => (
                <motion.button
                  key={book.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startSearching(book)}
                  className="flex items-center gap-3 p-3 rounded-xl glass glass-hover text-left w-full"
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-12 h-16 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    {book.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {book.genres?.slice(0, 2).map(g => (
                        <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary shrink-0">
                    <Search className="w-3 h-3" />
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>
              ))}
            </div>
            {displayBooks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีหนังสือ — ไปค้นพบและเพิ่มในชั้นหนังสือก่อนนะครับ</p>
              </div>
            )}
          </motion.div>
        )}

        {/* How it works */}
        {!searching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10">
            <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">วิธีใช้งาน</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: BookOpen, label: 'เลือกหนังสือ', desc: 'ที่กำลังอ่านอยู่' },
                { icon: Heart, label: 'กดใจ', desc: 'ถ้ากดใจกันทั้งคู่จะแมทช์' },
                { icon: Radio, label: 'แชทได้เลย', desc: 'popup เปิดอัตโนมัติ' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}