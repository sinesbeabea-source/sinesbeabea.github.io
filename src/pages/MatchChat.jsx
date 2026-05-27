import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, BookOpen, Sparkles, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const CONVERSATION_STARTERS = [
  '📚 หนังสือเล่มโปรดของคุณตอนนี้คืออะไร?',
  '🌙 คุณชอบอ่านตอนช่วงเวลาไหนมากที่สุด?',
  '✨ มีตัวละครไหนที่คุณชอบมากเป็นพิเศษไหม?',
  '🎭 ชอบแนวหนังสืออะไรมากที่สุด?',
  '💫 เล่มล่าสุดที่อ่านจบคืออะไร?',
];

export default function MatchChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data: myMatches } = useQuery({
    queryKey: ['match-chat-list', user?.email],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, status: 'accepted' }, '-created_date', 30),
    enabled: !!user,
    initialData: [],
  });

  // Get or create chat room for this match
  const { data: chatRooms } = useQuery({
    queryKey: ['match-rooms', selectedMatch?.id],
    queryFn: async () => {
      const roomName = `match:${[user?.email, selectedMatch.matched_email].sort().join(':')}`;
      let rooms = await base44.entities.ChatRoom.filter({ name: roomName });
      if (rooms.length === 0) {
        const room = await base44.entities.ChatRoom.create({
          name: roomName,
          type: 'direct',
          members: [user?.email, selectedMatch.matched_email],
        });
        rooms = [room];
      }
      return rooms;
    },
    enabled: !!selectedMatch,
    initialData: [],
  });

  const chatRoom = chatRooms[0];

  const { data: messages } = useQuery({
    queryKey: ['match-messages', chatRoom?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: chatRoom.id }, 'created_date', 100),
    enabled: !!chatRoom?.id,
    initialData: [],
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (content) => {
      await base44.entities.ChatMessage.create({
        room_id: chatRoom.id,
        sender_email: user?.email,
        sender_name: user?.full_name || user?.email,
        content,
        message_type: 'text',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-messages', chatRoom?.id] });
      setMessage('');
    },
  });

  const handleSend = () => {
    if (!message.trim() || !chatRoom) return;
    sendMessage.mutate(message.trim());
  };

  return (
    <div className="min-h-screen flex">
      {/* Match list sidebar */}
      <div className={`w-full md:w-72 border-r border-border/30 flex flex-col ${selectedMatch ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="font-space font-bold">แมทช์แชท</h2>
          </div>
          <p className="text-xs text-muted-foreground">สนทนากับคู่อ่านของคุณ</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {myMatches.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีแมทช์</p>
              <Link to="/matching">
                <Button size="sm" variant="outline" className="mt-3 gap-2">
                  <Sparkles className="w-3 h-3" /> หาแมทช์
                </Button>
              </Link>
            </div>
          ) : (
            myMatches.map(m => (
              <button
                key={m.id}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  selectedMatch?.id === m.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMatch(m)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{m.matched_email?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.matched_email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span className="text-xs text-muted-foreground">{m.match_percent}% ความเข้ากัน</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!selectedMatch ? 'hidden md:flex' : 'flex'}`}>
        {!selectedMatch ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">เลือกแมทช์เพื่อเริ่มสนทนา</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center gap-3">
              <button className="md:hidden text-muted-foreground" onClick={() => setSelectedMatch(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">{selectedMatch.matched_email?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedMatch.matched_email}</p>
                <div className="flex gap-1">
                  {selectedMatch.shared_genres?.slice(0, 2).map(g => (
                    <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
                  ))}
                </div>
              </div>
              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">
                <Heart className="w-3 h-3 fill-rose-400 mr-1" />
                {selectedMatch.match_percent}%
              </Badge>
            </div>

            {/* Conversation starters (if no messages) */}
            {messages.length === 0 && (
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">เริ่มต้นด้วยคำถามเหล่านี้</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CONVERSATION_STARTERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage.mutate(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-sm'
                            : 'bg-card/80 text-foreground rounded-bl-sm border border-border/30'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Shared books section */}
            {selectedMatch.shared_genres?.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">แนวที่ชอบร่วมกัน:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedMatch.shared_genres.map(g => (
                      <Badge key={g} className="text-[10px] bg-primary/10 text-primary border-primary/20">{g}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border/30 flex gap-2">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button
                size="icon"
                className="bg-gradient-to-r from-primary to-accent shrink-0"
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}