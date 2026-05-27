import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Plus, Users, Hash, ArrowLeft, Trash2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function GroupChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: myRooms } = useQuery({
    queryKey: ['chat-rooms', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ChatRoom.list('-updated_date', 100);
      return all.filter(r => r.members?.includes(user?.email));
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedRoom?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: selectedRoom?.id }, 'created_date', 100),
    initialData: [],
    enabled: !!selectedRoom,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const msg = await base44.entities.ChatMessage.create({
        room_id: selectedRoom.id,
        sender_email: user?.email,
        sender_name: user?.full_name || user?.email,
        content: message,
      });
      await base44.entities.ChatRoom.update(selectedRoom.id, { last_message: message });
      const others = (selectedRoom.members || []).filter(m => m !== user?.email);
      for (const memberEmail of others) {
        await base44.entities.Notification.create({
          user_email: memberEmail, type: 'message',
          title: `${user?.full_name || user?.email?.split('@')[0]} ส่งข้อความ`,
          message: message.length > 50 ? message.slice(0, 50) + '...' : message,
          from_user: user?.email, link: '/chat',
        });
      }
      return msg;
    },
    onSuccess: () => { setMessage(''); refetchMessages(); },
  });

  const createRoom = useMutation({
    mutationFn: () => base44.entities.ChatRoom.create({ name: newRoomName, type: 'group', members: [user?.email] }),
    onSuccess: () => { setNewRoomName(''); queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }); },
  });

  // Leave room (remove self from members)
  const leaveRoom = useMutation({
    mutationFn: async (room) => {
      const newMembers = (room.members || []).filter(m => m !== user?.email);
      if (newMembers.length === 0) {
        // Delete room and its messages if no members left
        const msgs = await base44.entities.ChatMessage.filter({ room_id: room.id });
        for (const m of msgs) await base44.entities.ChatMessage.delete(m.id);
        await base44.entities.ChatRoom.delete(room.id);
      } else {
        await base44.entities.ChatRoom.update(room.id, { members: newMembers });
      }
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      if (selectedRoom?.id === confirmDeleteId) setSelectedRoom(null);
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });

  const joinRoom = async (room) => {
    if (!room.members?.includes(user?.email)) {
      await base44.entities.ChatRoom.update(room.id, { members: [...(room.members || []), user?.email] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
    setSelectedRoom(room);
  };

  const roomToDelete = myRooms.find(r => r.id === confirmDeleteId);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-border/30 flex flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground">ห้องแชทของฉัน</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="w-3.5 h-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>สร้างห้องแชท</DialogTitle></DialogHeader>
              <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="ชื่อห้อง..." />
              <Button onClick={() => createRoom.mutate()} disabled={!newRoomName.trim()}>สร้าง</Button>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {myRooms.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีห้องแชท สร้างเลย!</p>
            )}
            {myRooms.map(room => (
              <div key={room.id} className="relative group">
                <button
                  onClick={() => joinRoom(room)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 pr-10 ${
                    selectedRoom?.id === room.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                    {room.type === 'group' ? <Users className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    {room.last_message && <p className="text-xs text-muted-foreground truncate">{room.last_message}</p>}
                  </div>
                </button>
                {/* Delete/Leave button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(room.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="ออกจากห้อง"
                >
                  {room.created_by === user?.email ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Confirm delete dialog */}
      {confirmDeleteId && roomToDelete && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setConfirmDeleteId(null)}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-border/50 shadow-xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">
              {roomToDelete.created_by === user?.email ? 'ลบห้องแชท?' : 'ออกจากห้องแชท?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {roomToDelete.created_by === user?.email
                ? `ห้อง "${roomToDelete.name}" และข้อความทั้งหมดจะถูกลบถาวร`
                : `คุณจะออกจากห้อง "${roomToDelete.name}"`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive" className="flex-1 rounded-full"
                onClick={() => leaveRoom.mutate(roomToDelete)}
                disabled={leaveRoom.isPending}
              >
                {leaveRoom.isPending ? 'กำลังดำเนินการ...' : roomToDelete.created_by === user?.email ? 'ลบห้อง' : 'ออกจากห้อง'}
              </Button>
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setConfirmDeleteId(null)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-border/30 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedRoom(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedRoom.name}</p>
                <p className="text-xs text-muted-foreground">{selectedRoom.members?.length} สมาชิก</p>
              </div>
              <Button
                size="sm" variant="ghost"
                onClick={() => setConfirmDeleteId(selectedRoom.id)}
                className="text-muted-foreground hover:text-destructive gap-1.5 text-xs rounded-full"
              >
                {selectedRoom.created_by === user?.email ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                {selectedRoom.created_by === user?.email ? 'ลบ' : 'ออก'}
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(msg => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground' : 'glass'}`}>
                        {!isMe && (
                          <Link to={`/user/${encodeURIComponent(msg.sender_email)}`} className="text-xs font-medium text-primary mb-1 hover:underline block">
                            {msg.sender_name}
                          </Link>
                        )}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/30">
              <form onSubmit={e => { e.preventDefault(); if (message.trim()) sendMessage.mutate(); }} className="flex gap-2">
                <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 rounded-full glass" />
                <Button type="submit" size="icon" className="rounded-full bg-gradient-to-r from-primary to-accent shrink-0" disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">เลือกห้องแชทเพื่อเริ่มสนทนา</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}