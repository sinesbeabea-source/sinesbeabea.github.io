import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, BookOpen, MessageCircle, Lock, Globe, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';

const GENRES = ['แฟนตาซี', 'โรแมนซ์', 'สยองขวัญ', 'ลึกลับ', 'วิทยาศาสตร์', 'ผจญภัย', 'ประวัติศาสตร์', 'ทั่วไป'];
const GENRE_COLORS = {
  'แฟนตาซี': 'from-violet-500 to-purple-600',
  'โรแมนซ์': 'from-pink-500 to-rose-600',
  'สยองขวัญ': 'from-gray-700 to-gray-900',
  'ลึกลับ': 'from-indigo-500 to-blue-700',
  'วิทยาศาสตร์': 'from-cyan-500 to-teal-600',
  'ผจญภัย': 'from-amber-500 to-orange-600',
  'ประวัติศาสตร์': 'from-yellow-600 to-amber-700',
  'ทั่วไป': 'from-primary to-accent',
};

export default function BookClubs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', genre_focus: 'ทั่วไป' });
  const [activeGenre, setActiveGenre] = useState('ทั้งหมด');

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['book-clubs'],
    queryFn: () => base44.entities.ChatRoom.filter({ type: 'group' }, '-updated_date', 50),
    initialData: [],
  });

  const createClub = useMutation({
    mutationFn: () => base44.entities.ChatRoom.create({
      name: form.name,
      description: form.description,
      genre_focus: form.genre_focus,
      type: 'group',
      members: [user?.email],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-clubs'] });
      setDialogOpen(false);
      setForm({ name: '', description: '', genre_focus: 'ทั่วไป' });
    },
  });

  const joinClub = useMutation({
    mutationFn: async (room) => {
      if (!room.members?.includes(user?.email)) {
        await base44.entities.ChatRoom.update(room.id, {
          members: [...(room.members || []), user?.email],
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-clubs'] }),
  });

  const filtered = activeGenre === 'ทั้งหมด' ? rooms : rooms.filter(r => r.genre_focus === activeGenre);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">คลับนักอ่าน</span>
              </div>
              <h1 className="text-3xl font-space font-bold">Book Clubs</h1>
              <p className="text-muted-foreground text-sm mt-1">เข้าร่วมคลับ อ่านหนังสือ และพูดคุยกับคนที่ชอบเหมือนกัน</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent rounded-full">
                  <Plus className="w-4 h-4" /> สร้างคลับ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>สร้างคลับหนังสือใหม่</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="ชื่อคลับ..." />
                  <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="คำอธิบายคลับ..." rows={3} />
                  <Select value={form.genre_focus} onValueChange={v => setForm(f => ({...f, genre_focus: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => createClub.mutate()} disabled={!form.name.trim() || createClub.isPending} className="w-full">
                    {createClub.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} สร้างคลับ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Genre Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {['ทั้งหมด', ...GENRES].map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeGenre === genre
                  ? 'bg-primary text-white'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Clubs Grid */}
        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีคลับในหมวดนี้ สร้างเป็นคนแรกเลย!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((room, i) => {
                const isMember = room.members?.includes(user?.email);
                const gradientColor = GENRE_COLORS[room.genre_focus] || GENRE_COLORS['ทั่วไป'];
                return (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard hover={false} className="overflow-hidden p-0">
                      {/* Banner */}
                      <div className={`h-20 bg-gradient-to-br ${gradientColor} relative`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/60" />
                        </div>
                        {room.genre_focus && (
                          <Badge className="absolute top-3 left-3 bg-black/30 text-white border-0 text-xs">
                            {room.genre_focus}
                          </Badge>
                        )}
                        {isMember && (
                          <Badge className="absolute top-3 right-3 bg-green-500/80 text-white border-0 text-xs">
                            สมาชิก
                          </Badge>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold mb-1 line-clamp-1">{room.name}</h3>
                        {room.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{room.members?.length || 0} คน</span>
                          </div>
                          {isMember ? (
                            <Link to="/chat">
                              <Button size="sm" variant="outline" className="gap-1 rounded-full text-xs h-7">
                                <MessageCircle className="w-3 h-3" /> แชท
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-1 rounded-full text-xs h-7 bg-gradient-to-r from-primary to-accent"
                              onClick={() => joinClub.mutate(room)}
                              disabled={joinClub.isPending}
                            >
                              <Plus className="w-3 h-3" /> เข้าร่วม
                            </Button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}