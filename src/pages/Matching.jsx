import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, Search, Loader2, Radio, MessageCircle,
  Heart, X, ChevronRight, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import ReadingBuddyFound from '@/components/matching/ReadingBuddyFound';
import { useNavigate } from 'react-router-dom';

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const ACTIVE_THRESHOLD = 60000;   // 60 seconds = considered "online"
const POLL_INTERVAL = 5000;       // poll every 5 seconds

export default function Matching() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedBook, setSelectedBook] = useState(null);
  const [searching, setSearching] = useState(false);
  const [mySession, setMySession] = useState(null);
  const [foundBuddy, setFoundBuddy] = useState(null);
  const [notifiedBuddies, setNotifiedBuddies] = useState(new Set());

  const heartbeatRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch user's reading progress / books
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

  // Fetch all published books (as fallback if no reading history)
  const { data: allBooks } = useQuery({
    queryKey: ['all-published-books'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-read_count', 30),
    initialData: [],
  });

  const displayBooks = myBooks.length > 0 ? myBooks : allBooks;

  // Active reading sessions (other users on same book)
  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions', selectedBook?.id],
    queryFn: async () => {
      if (!selectedBook) return [];
      const since = new Date(Date.now() - ACTIVE_THRESHOLD).toISOString();
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

  // Start searching: create/update session + heartbeat
  const startSearching = useCallback(async (book) => {
    if (!user || !book) return;
    setSelectedBook(book);
    setSearching(true);

    const now = new Date().toISOString();
    // Try to update existing session or create new one
    const existing = await base44.entities.ReadingSession.filter({ user_email: user.email });
    let session;
    if (existing.length > 0) {
      session = await base44.entities.ReadingSession.update(existing[0].id, {
        book_id: book.id,
        book_title: book.title,
        book_cover: book.cover_url || '',
        book_author: book.author || '',
        user_name: user.full_name || user.email,
        last_active: now,
        status: 'searching',
      });
    } else {
      session = await base44.entities.ReadingSession.create({
        user_email: user.email,
        user_name: user.full_name || user.email,
        book_id: book.id,
        book_title: book.title,
        book_cover: book.cover_url || '',
        book_author: book.author || '',
        last_active: now,
        status: 'searching',
      });
    }
    setMySession(session);

    // Heartbeat: keep last_active fresh
    heartbeatRef.current = setInterval(async () => {
      if (session?.id) {
        await base44.entities.ReadingSession.update(session.id, {
          last_active: new Date().toISOString(),
        });
      }
    }, HEARTBEAT_INTERVAL);
  }, [user]);

  const stopSearching = useCallback(async () => {
    clearInterval(heartbeatRef.current);
    clearInterval(pollRef.current);
    if (mySession?.id) {
      await base44.entities.ReadingSession.update(mySession.id, { status: 'offline' });
    }
    setMySession(null);
    setSearching(false);
    setSelectedBook(null);
    setNotifiedBuddies(new Set());
  }, [mySession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(heartbeatRef.current);
      if (mySession?.id) {
        base44.entities.ReadingSession.update(mySession.id, { status: 'offline' }).catch(() => {});
      }
    };
  }, [mySession]);

  // Detect new buddies and notify once
  useEffect(() => {
    if (!activeSessions?.length) return;
    for (const s of activeSessions) {
      if (!notifiedBuddies.has(s.user_email)) {
        setFoundBuddy(s);
        setNotifiedBuddies(prev => new Set([...prev, s.user_email]));
        break; // notify one at a time
      }
    }
  }, [activeSessions]);

  const handleChat = async (buddy) => {
    // Create or find chat room
    const roomName = `reading:${[user?.email, buddy.user_email].sort().join(':')}`;
    const rooms = await base44.entities.ChatRoom.filter({ name: roomName });
    let room;
    if (rooms.length === 0) {
      room = await base44.entities.ChatRoom.create({
        name: roomName,
        type: 'direct',
        members: [user?.email, buddy.user_email],
        description: `อ่าน "${buddy.book_title}" ด้วยกัน`,
      });
    } else {
      room = rooms[0];
    }
    navigate('/match-chat');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <ReadingBuddyFound
        buddy={foundBuddy}
        bookTitle={selectedBook?.title}
        onClose={() => setFoundBuddy(null)}
        onChat={handleChat}
      />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <Users className="inline w-7 h-7 text-primary mr-2" />
            Reading <span className="gradient-text">Buddy</span>
          </h1>
          <p className="text-muted-foreground text-sm">ค้นหาคนที่กำลังอ่านเล่มเดียวกัน แบบ Real-time</p>
        </motion.div>

        {/* Searching state */}
        {searching && selectedBook && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <GlassCard hover={false} glow className="p-6 text-center">
              {/* Pulse indicator */}
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

              {/* Online count */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  {activeSessions?.length > 0
                    ? `พบ ${activeSessions.length} คนที่กำลังอ่านอยู่`
                    : 'กำลังรอคนอื่น...'}
                </span>
              </div>

              {/* Active buddies list */}
              <AnimatePresence>
                {activeSessions?.map(s => (
                  <motion.div
                    key={s.user_email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-2 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">
                        {s.user_name?.[0]?.toUpperCase() || s.user_email?.[0]?.toUpperCase() || '?'}
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
                      className="gap-1 h-7 text-xs bg-gradient-to-r from-primary to-accent border-0 shrink-0"
                      onClick={() => handleChat(s)}
                    >
                      <MessageCircle className="w-3 h-3" /> แชท
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

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
                { icon: Radio, label: 'ค้นหา Real-time', desc: 'ระบบหาคนที่อ่านเล่มเดียวกัน' },
                { icon: MessageCircle, label: 'แชทได้เลย', desc: 'เจอกันทันที' },
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