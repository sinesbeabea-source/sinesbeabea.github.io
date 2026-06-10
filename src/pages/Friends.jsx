import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, UserMinus, Search, Users, User, MessageCircle, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';

export default function Friends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('friends'); // 'friends' | 'search'

  // คนที่ฉันติดตาม
  const { data: myFollowing = [] } = useQuery({
    queryKey: ['my-following', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }, '-created_date', 200),
    enabled: !!user,
  });

  // คนที่ติดตามฉัน
  const { data: myFollowers = [] } = useQuery({
    queryKey: ['my-followers', user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user?.email }, '-created_date', 200),
    enabled: !!user,
  });

  // เพื่อน = ติดตามกันสองทาง
  const friendEmails = myFollowing
    .filter(f => myFollowers.some(r => r.follower_email === f.following_email))
    .map(f => f.following_email);

  // ค้นหาผู้ใช้จาก Follow ทั้งหมด (ผ่าน user list)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-list'],
    queryFn: () => base44.entities.User.list(),
    enabled: tab === 'search',
  });

  const searchResults = searchQuery.trim().length >= 2
    ? allUsers.filter(u =>
        u.email !== user?.email &&
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 20)
    : [];

  const followingEmails = new Set(myFollowing.map(f => f.following_email));

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const existing = myFollowing.find(f => f.following_email === targetEmail);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
      } else {
        await base44.entities.Follow.create({ follower_email: user?.email, following_email: targetEmail });
        await base44.entities.Notification.create({
          user_email: targetEmail,
          type: 'follower',
          title: `${user?.full_name || user?.email?.split('@')[0]} ติดตามคุณแล้ว`,
          message: 'มีเพื่อนใหม่ติดตามโปรไฟล์ของคุณ!',
          from_user: user?.email,
          link: `/user/${encodeURIComponent(user?.email)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-following', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['my-followers', user?.email] });
    },
  });

  const UserCard = ({ email, name, avatarUrl, isFriend }) => {
    const isFollowing = followingEmails.has(email);
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="flex items-center gap-3 p-4">
          <Link to={`/user/${encodeURIComponent(email)}`}>
            <Avatar className="w-11 h-11 border-2 border-primary/20 shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-bold text-primary">
                {(name || email)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/user/${encodeURIComponent(email)}`}>
              <p className="font-semibold text-sm truncate hover:text-primary transition-colors">{name || email.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground truncate">@{email.split('@')[0]}</p>
            </Link>
            {isFriend && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                <Heart className="w-2.5 h-2.5 fill-primary" /> เพื่อนกัน
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link to="/chat">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-accent" title="แชท">
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant={isFollowing ? 'outline' : 'default'}
              className={`rounded-full text-xs h-8 px-3 gap-1 ${!isFollowing ? 'bg-gradient-to-r from-primary to-accent' : ''}`}
              onClick={() => followMutation.mutate(email)}
              disabled={followMutation.isPending}
            >
              {isFollowing ? <><UserMinus className="w-3 h-3" /> เลิกติดตาม</> : <><UserPlus className="w-3 h-3" /> ติดตาม</>}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">ระบบเพื่อน</span>
          </div>
          <h1 className="text-3xl font-bold">เพื่อนของฉัน 💕</h1>
          <p className="text-muted-foreground text-sm mt-1">ติดตามและเชื่อมต่อกับนักอ่านคนอื่น</p>
        </motion.div>

        {/* Tab */}
        <div className="flex gap-2 mb-6 bg-muted/50 rounded-full p-1">
          {[
            { id: 'friends', label: `เพื่อน (${friendEmails.length})`, icon: Heart },
            { id: 'followers', label: `ผู้ติดตาม (${myFollowers.length})`, icon: Users },
            { id: 'search', label: 'ค้นหาเพื่อน', icon: Search },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* เพื่อน tab */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friendEmails.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">ยังไม่มีเพื่อน</p>
                <p className="text-sm mt-1">ไปค้นหาเพื่อนและติดตามกันเลย!</p>
                <Button className="mt-4 rounded-full bg-gradient-to-r from-primary to-accent" onClick={() => setTab('search')}>
                  <Search className="w-4 h-4 mr-2" /> ค้นหาเพื่อน
                </Button>
              </div>
            ) : (
              friendEmails.map(email => (
                <UserCard key={email} email={email} name={email.split('@')[0]} isFriend />
              ))
            )}
          </div>
        )}

        {/* ผู้ติดตาม tab */}
        {tab === 'followers' && (
          <div className="space-y-3">
            {myFollowers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ยังไม่มีผู้ติดตาม</p>
              </div>
            ) : (
              myFollowers.map(f => (
                <UserCard
                  key={f.id}
                  email={f.follower_email}
                  name={f.follower_email.split('@')[0]}
                  isFriend={friendEmails.includes(f.follower_email)}
                />
              ))
            )}
          </div>
        )}

        {/* ค้นหา tab */}
        {tab === 'search' && (
          <div>
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหรืออีเมล..."
                className="pl-9 rounded-full"
              />
            </div>
            <div className="space-y-3">
              {searchQuery.trim().length < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>พิมพ์ชื่อหรืออีเมลอย่างน้อย 2 ตัวอักษร</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>ไม่พบผู้ใช้ที่ค้นหา</p>
                </div>
              ) : (
                searchResults.map(u => (
                  <UserCard
                    key={u.id}
                    email={u.email}
                    name={u.full_name}
                    isFriend={friendEmails.includes(u.email)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}