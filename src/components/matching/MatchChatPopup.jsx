import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, Heart, UserPlus, UserCheck, ArrowRight,
  Phone, PhoneOff, BookOpen, ChevronRight, ChevronDown, Image, Loader2
} from 'lucide-react';
import VoiceCall from '@/components/voice/VoiceCall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

// ─── After Chat Popup ───────────────────────────────────────────────
function AfterChatPopup({ matchedEmail, onClose }) {
  const { user } = useAuth();
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    await base44.entities.Follow.create({
      follower_email: user?.email,
      following_email: matchedEmail,
    });
    await base44.entities.Notification.create({
      user_email: matchedEmail,
      type: 'follower',
      title: `${user?.full_name || user?.email?.split('@')[0]} เริ่มติดตามคุณ`,
      message: 'คุณมีผู้ติดตามใหม่!',
      from_user: user?.email,
      link: `/user/${encodeURIComponent(user?.email)}`,
    });
    setFollowed(true);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-md flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="glass rounded-2xl p-7 max-w-sm w-full text-center border border-primary/20 neon-glow"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">{matchedEmail?.[0]?.toUpperCase()}</span>
        </div>
        <h3 className="font-space font-bold text-lg mb-1">จบการสนทนาแล้ว 💬</h3>
        <p className="text-sm text-muted-foreground mb-5">
          สนใจติดตาม <span className="text-foreground font-medium">{matchedEmail?.split('@')[0]}</span> ต่อมั้ย?
        </p>
        <div className="flex flex-col gap-2">
          {!followed ? (
            <Button onClick={handleFollow} disabled={loading}
              className="gap-2 bg-gradient-to-r from-primary to-accent w-full rounded-full">
              <UserPlus className="w-4 h-4" />
              {loading ? 'กำลังติดตาม...' : 'ติดตามเลย'}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-400 py-2">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">ติดตามแล้ว!</span>
            </div>
          )}
          <Link to={`/user/${encodeURIComponent(matchedEmail)}`} onClick={onClose}>
            <Button variant="outline" className="gap-2 w-full rounded-full border-primary/30">
              <ArrowRight className="w-4 h-4" /> ดูโปรไฟล์
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground rounded-full">
            ไม่ ขอบคุณ
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Read Together Panel ─────────────────────────────────────────────
function ReadTogetherPanel({ matchId, buddyEmail, userEmail, onClose }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.Book.filter({ status: 'published' }, '-read_count', 30).then(setBooks);
  }, []);

  const selectBook = async (book) => {
    setSelectedBook(book);
    setLoading(true);
    const chs = await base44.entities.Chapter.filter({ book_id: book.id, status: 'published' }, 'chapter_number', 50);
    setChapters(chs);
    setLoading(false);
  };

  const startReading = async (chapter) => {
    const syncData = {
      sync_book_id: selectedBook.id,
      sync_book_title: selectedBook.title,
      sync_chapter_id: chapter.id,
      sync_chapter_number: chapter.chapter_number,
      sync_chapter_title: chapter.title,
      sync_active: true,
    };
    // Sync my record
    await base44.entities.ReaderMatch.update(matchId, syncData);
    // Sync buddy's record
    const buddyRecords = await base44.entities.ReaderMatch.filter({
      user_email: buddyEmail, matched_email: userEmail,
    });
    for (const r of buddyRecords) {
      await base44.entities.ReaderMatch.update(r.id, syncData);
    }
    // Notify buddy
    await base44.entities.Notification.create({
      user_email: buddyEmail,
      type: 'system',
      title: '📖 เริ่มอ่านด้วยกัน!',
      message: `กำลังอ่าน "${selectedBook.title}" บทที่ ${chapter.chapter_number}`,
      link: `/read/${selectedBook.id}/${chapter.id}`,
    });
    navigate(`/read/${selectedBook.id}/${chapter.id}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="absolute inset-0 bg-card rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden z-10"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-sm">
          {selectedBook ? `📖 ${selectedBook.title}` : '📚 เลือกหนังสืออ่านด้วยกัน'}
        </span>
        {selectedBook && (
          <Button size="sm" variant="ghost" className="ml-auto text-xs text-muted-foreground"
            onClick={() => { setSelectedBook(null); setChapters([]); }}>
            เปลี่ยน
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!selectedBook ? (
          books.map(book => (
            <button key={book.id} onClick={() => selectBook(book)}
              className="w-full flex items-center gap-3 p-3 rounded-xl glass glass-hover text-left">
              {book.cover_url
                ? <img src={book.cover_url} className="w-10 h-14 object-cover rounded-lg shrink-0" alt="" />
                : <div className="w-10 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))
        ) : loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลดบท...</div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">ไม่มีบทที่เผยแพร่แล้ว</div>
        ) : (
          chapters.map(ch => (
            <button key={ch.id} onClick={() => startReading(ch)}
              className="w-full flex items-center gap-3 p-3 rounded-xl glass glass-hover text-left">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {ch.chapter_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ch.title}</p>
                <p className="text-xs text-muted-foreground">{ch.word_count ? `${ch.word_count.toLocaleString()} คำ` : ''}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// CallOverlay is now replaced by VoiceCall component

// ─── Main Chat Popup ─────────────────────────────────────────────────
export default function MatchChatPopup({ matchId, buddyEmail, bookTitle, onClose, onEnded }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showAfterChat, setShowAfterChat] = useState(false);
  const [showReadTogether, setShowReadTogether] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const messagesEndRef = useRef(null);

  const roomName = user?.email && buddyEmail
    ? `reading:${[user.email, buddyEmail].sort().join(':')}`
    : null;

  // Poll match record for call state changes
  const { data: matchRecord } = useQuery({
    queryKey: ['match-record', matchId, user?.email],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, matched_email: buddyEmail, status: 'accepted' }),
    enabled: !!user?.email && !!buddyEmail,
    refetchInterval: 3000,
    select: (data) => data?.[0] || null,
  });

  // Also poll buddy's match record to see call state from their side
  const { data: buddyMatchRecord } = useQuery({
    queryKey: ['buddy-match-record', buddyEmail, user?.email],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: buddyEmail, matched_email: user?.email }),
    enabled: !!buddyEmail && !!user?.email,
    refetchInterval: 3000,
    select: (data) => data?.[0] || null,
  });

  const callStatus = matchRecord?.call_status || 'idle';
  const buddyCallStatus = buddyMatchRecord?.call_status || 'idle';
  const isIncomingCall = buddyCallStatus === 'calling' && buddyMatchRecord?.call_initiated_by === buddyEmail;
  const showCall = callStatus === 'calling' || callStatus === 'in_call' || isIncomingCall;

  // Get or create chat room
  const { data: chatRoom } = useQuery({
    queryKey: ['popup-room', roomName],
    queryFn: async () => {
      const rooms = await base44.entities.ChatRoom.filter({ name: roomName });
      if (rooms.length > 0) return rooms[0];
      return base44.entities.ChatRoom.create({
        name: roomName,
        type: 'direct',
        members: [user.email, buddyEmail],
        description: bookTitle ? `อ่าน "${bookTitle}" ด้วยกัน` : 'Reading Buddy Chat',
      });
    },
    enabled: !!roomName,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['popup-messages', chatRoom?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: chatRoom.id }, 'created_date', 100),
    enabled: !!chatRoom?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const sendMessage = useMutation({
    mutationFn: (overrides = {}) => base44.entities.ChatMessage.create({
      room_id: chatRoom.id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      content: message,
      message_type: 'text',
      ...overrides,
    }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['popup-messages', chatRoom?.id] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatRoom) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ChatMessage.create({
      room_id: chatRoom.id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      content: file_url,
      message_type: 'image',
    });
    queryClient.invalidateQueries({ queryKey: ['popup-messages', chatRoom?.id] });
    setUploadingImage(false);
    e.target.value = '';
  };

  const syncBothSides = async (data) => {
    const updates = [base44.entities.ReaderMatch.update(matchId, data)];
    const reverse = await base44.entities.ReaderMatch.filter({
      user_email: buddyEmail, matched_email: user?.email,
    });
    for (const r of reverse) updates.push(base44.entities.ReaderMatch.update(r.id, data));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['match-record', matchId] });
    queryClient.invalidateQueries({ queryKey: ['buddy-match-record', buddyEmail] });
  };

  const handleCall = async () => {
    await syncBothSides({ call_status: 'calling', call_initiated_by: user?.email });
    await base44.entities.Notification.create({
      user_email: buddyEmail,
      type: 'message',
      title: '📞 โทรเข้า!',
      message: `${user?.full_name || user?.email?.split('@')[0]} กำลังโทรหาคุณ`,
      from_user: user?.email,
    });
  };

  const handleEndCall = async () => {
    await syncBothSides({ call_status: 'idle', call_initiated_by: null });
  };

  const handleEndChat = async () => {
    const now = new Date().toISOString();
    if (matchId) {
      await base44.entities.ReaderMatch.update(matchId, {
        status: 'ended',
        ended_at: now,
        popup_opened: false,
        sync_active: false,
        call_status: 'idle',
      });
    }
    const reverse = await base44.entities.ReaderMatch.filter({
      user_email: buddyEmail,
      matched_email: user?.email,
    });
    for (const r of reverse) {
      if (r.status !== 'ended') {
        await base44.entities.ReaderMatch.update(r.id, {
          status: 'ended',
          ended_at: now,
          popup_opened: false,
          sync_active: false,
          call_status: 'idle',
        });
      }
    }
    setConfirmEnd(false);
    setShowAfterChat(true);
  };

  if (showAfterChat) {
    return (
      <AnimatePresence>
        <AfterChatPopup
          matchedEmail={buddyEmail}
          onClose={() => { onEnded?.(); }}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-background/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:px-4"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="relative w-full sm:max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        style={{ height: '75vh' }}
      >
        {/* Voice Call overlay */}
        <AnimatePresence>
          {showCall && (
            <VoiceCall
              matchId={matchId}
              buddyEmail={buddyEmail}
              callStatus={isIncomingCall ? buddyCallStatus : callStatus}
              isIncoming={isIncomingCall}
              onEnd={handleEndCall}
            />
          )}
        </AnimatePresence>

        {/* Read together overlay */}
        <AnimatePresence>
          {showReadTogether && (
            <ReadTogetherPanel
              matchId={matchId}
              buddyEmail={buddyEmail}
              userEmail={user?.email}
              onClose={() => setShowReadTogether(false)}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">{buddyEmail?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{buddyEmail?.split('@')[0]}</p>
            {bookTitle && <p className="text-xs text-muted-foreground truncate">📚 {bookTitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {/* Read Together */}
            <Button size="icon" variant="ghost" title="อ่านด้วยกัน"
              onClick={() => setShowReadTogether(true)} className="h-8 w-8">
              <BookOpen className="w-4 h-4 text-accent" />
            </Button>
            {/* Call */}
            <Button size="icon" variant="ghost" title="โทร"
              onClick={handleCall} disabled={callStatus !== 'idle'}
              className="h-8 w-8">
              <Phone className="w-4 h-4 text-green-400" />
            </Button>
            {/* End chat */}
            <Button size="sm" variant="ghost" onClick={() => setConfirmEnd(true)}
              className="text-xs text-muted-foreground hover:text-destructive gap-1 rounded-full">
              <PhoneOff className="w-3 h-3" /> จบแชท
            </Button>
            {/* Minimize — shrinks to floating bubble, chat stays alive */}
            <Button size="icon" variant="ghost" onClick={onClose} title="ย่อลง" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Confirm end banner */}
        <AnimatePresence>
          {confirmEnd && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mx-3 mt-2 p-3 glass rounded-xl border border-destructive/30 flex items-center gap-3 shrink-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">จบการแมทช์นี้?</p>
                <p className="text-xs text-muted-foreground">ทั้งสองฝ่ายจะออกจากแชทนี้</p>
              </div>
              <Button size="sm" variant="destructive" onClick={handleEndChat} className="text-xs rounded-full">
                จบเลย
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmEnd(false)} className="text-xs rounded-full p-1.5">
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2 fill-rose-400" />
              <p className="text-sm text-muted-foreground">ทั้งคู่กดใจกันแล้ว เริ่มคุยได้เลย! 🎉</p>
              <div className="flex gap-2 justify-center mt-3">
                <button onClick={() => setShowReadTogether(true)}
                  className="text-xs glass px-3 py-1.5 rounded-full text-accent hover:bg-accent/10 transition-colors flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> อ่านด้วยกัน
                </button>
                <button onClick={handleCall}
                  className="text-xs glass px-3 py-1.5 rounded-full text-green-400 hover:bg-green-400/10 transition-colors flex items-center gap-1">
                  <Phone className="w-3 h-3" /> โทรหากัน
                </button>
              </div>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_email === user?.email;
            const isImage = msg.message_type === 'image';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {isImage ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.content}
                        alt="รูปภาพ"
                        className="max-w-[200px] rounded-2xl object-cover border border-border/30"
                      />
                    </a>
                  ) : (
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-rose-500 to-primary text-white rounded-br-sm'
                        : 'glass text-foreground rounded-bl-sm border border-border/30'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground px-1">
                    {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/30 flex gap-2 shrink-0">
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full shrink-0 text-muted-foreground hover:text-accent"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage || !chatRoom}
            title="ส่งรูปภาพ"
          >
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </Button>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 rounded-full"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && message.trim() && chatRoom) {
                e.preventDefault();
                sendMessage.mutate();
              }
            }}
          />
          <Button
            size="icon"
            className="rounded-full bg-gradient-to-r from-rose-500 to-primary shrink-0"
            onClick={() => sendMessage.mutate()}
            disabled={!message.trim() || !chatRoom}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}