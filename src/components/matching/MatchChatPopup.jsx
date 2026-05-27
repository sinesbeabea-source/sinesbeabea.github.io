import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Heart, UserPlus, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// After-chat popup
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        <h3 className="font-space font-bold text-lg mb-1">จบการสนทนาแล้ว</h3>
        <p className="text-sm text-muted-foreground mb-5">
          สนใจติดตาม <span className="text-foreground font-medium">{matchedEmail?.split('@')[0]}</span> ต่อมั้ย?
        </p>
        <div className="flex flex-col gap-2">
          {!followed ? (
            <Button
              onClick={handleFollow}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-primary to-accent w-full rounded-full"
            >
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

// Main chat popup — accepts matchId (string) or buddyEmail directly
export default function MatchChatPopup({ matchId, buddyEmail, bookTitle, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showAfterChat, setShowAfterChat] = useState(false);
  const messagesEndRef = useRef(null);

  const roomName = user?.email && buddyEmail
    ? `reading:${[user.email, buddyEmail].sort().join(':')}`
    : null;

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

  // Messages with polling
  const { data: messages = [] } = useQuery({
    queryKey: ['popup-messages', chatRoom?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: chatRoom.id }, 'created_date', 100),
    enabled: !!chatRoom?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: () => base44.entities.ChatMessage.create({
      room_id: chatRoom.id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      content: message,
    }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['popup-messages', chatRoom?.id] });
    },
  });

  const handleEndChat = async () => {
    const now = new Date().toISOString();
    // End my match record
    if (matchId) {
      await base44.entities.ReaderMatch.update(matchId, { status: 'ended', ended_at: now });
    }
    // End buddy's reverse match record
    const reverse = await base44.entities.ReaderMatch.filter({
      user_email: buddyEmail,
      matched_email: user?.email,
    });
    for (const r of reverse) {
      if (r.status !== 'ended') {
        await base44.entities.ReaderMatch.update(r.id, { status: 'ended', ended_at: now });
      }
    }
    setShowAfterChat(true);
  };

  if (showAfterChat) {
    return (
      <AnimatePresence>
        <AfterChatPopup matchedEmail={buddyEmail} onClose={onClose} />
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-background/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:px-4"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="w-full sm:max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl"
        style={{ height: '70vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">{buddyEmail?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{buddyEmail?.split('@')[0]}</p>
            {bookTitle && <p className="text-xs text-muted-foreground truncate">📚 {bookTitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEndChat}
              className="text-xs text-muted-foreground hover:text-destructive gap-1 rounded-full"
            >
              <X className="w-3 h-3" /> จบแชท
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2 fill-rose-400" />
              <p className="text-sm text-muted-foreground">ทั้งคู่กดใจกันแล้ว เริ่มคุยได้เลย! 🎉</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-500 to-primary text-white rounded-br-sm'
                      : 'glass text-foreground rounded-bl-sm border border-border/30'
                  }`}>
                    {msg.content}
                  </div>
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
        <div className="p-3 border-t border-border/30 flex gap-2">
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