import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, BookOpen, Users, UserPlus, UserMinus, MessageCircle, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserProfile() {
  const { email } = useParams();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const targetEmail = decodeURIComponent(email);
  const isMe = me?.email === targetEmail;

  const { data: targetUser } = useQuery({
    queryKey: ['user-profile', targetEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter ? 
        await base44.entities.User.list() : [];
      return users.find(u => u.email === targetEmail) || { email: targetEmail, full_name: targetEmail.split('@')[0] };
    },
    initialData: { email: targetEmail, full_name: targetEmail.split('@')[0] },
  });

  const { data: avatar } = useQuery({
    queryKey: ['avatar', targetEmail],
    queryFn: () => base44.entities.UserAvatar.filter({ user_email: targetEmail }, '-created_date', 1),
    initialData: [],
  });

  const { data: books } = useQuery({
    queryKey: ['user-books', targetEmail],
    queryFn: () => base44.entities.Book.filter({ created_by: targetEmail, status: 'published' }, '-created_date', 20),
    initialData: [],
  });

  const { data: posts } = useQuery({
    queryKey: ['user-posts', targetEmail],
    queryFn: () => base44.entities.CommunityPost.filter({ created_by: targetEmail }, '-created_date', 10),
    initialData: [],
  });

  const { data: followers } = useQuery({
    queryKey: ['followers', targetEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: targetEmail }, '-created_date', 100),
    initialData: [],
  });

  const { data: following } = useQuery({
    queryKey: ['following', targetEmail],
    queryFn: () => base44.entities.Follow.filter({ follower_email: targetEmail }, '-created_date', 100),
    initialData: [],
  });

  const { data: myFollows } = useQuery({
    queryKey: ['my-follows', me?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: me?.email }, '-created_date', 200),
    initialData: [],
    enabled: !!me,
  });

  const isFollowing = myFollows.some(f => f.following_email === targetEmail);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const follow = myFollows.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(follow.id);
      } else {
        await base44.entities.Follow.create({ follower_email: me?.email, following_email: targetEmail });
        await base44.entities.Notification.create({
          user_email: targetEmail, type: 'follower',
          title: `${me?.full_name || me?.email?.split('@')[0]} ติดตามคุณ`,
          message: 'มีคนติดตามโปรไฟล์ของคุณ', from_user: me?.email, link: `/user/${encodeURIComponent(me?.email)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetEmail] });
    },
  });

  const avatarUrl = avatar?.[0]?.avatar_url;
  const displayName = targetUser?.full_name || targetEmail.split('@')[0];
  const username = targetEmail.split('@')[0];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} className="p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <Avatar className="w-24 h-24 border-4 border-primary/30 shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-space font-bold mb-1">{displayName}</h1>
                <p className="text-muted-foreground text-sm mb-4">@{username}</p>

                {/* Stats */}
                <div className="flex gap-6 justify-center sm:justify-start mb-4">
                  <div className="text-center">
                    <p className="font-bold text-lg">{books.length}</p>
                    <p className="text-xs text-muted-foreground">หนังสือ</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{followers.length}</p>
                    <p className="text-xs text-muted-foreground">ผู้ติดตาม</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{following.length}</p>
                    <p className="text-xs text-muted-foreground">กำลังติดตาม</p>
                  </div>
                </div>

                {!isMe && me && (
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      variant={isFollowing ? 'outline' : 'default'}
                      className={`gap-2 rounded-full ${!isFollowing ? 'bg-gradient-to-r from-primary to-accent' : ''}`}
                    >
                      {isFollowing ? <><UserMinus className="w-4 h-4" /> เลิกติดตาม</> : <><UserPlus className="w-4 h-4" /> ติดตาม</>}
                    </Button>
                    <Link to="/chat">
                      <Button variant="outline" className="gap-2 rounded-full">
                        <MessageCircle className="w-4 h-4" /> ส่งข้อความ
                      </Button>
                    </Link>
                  </div>
                )}
                {isMe && (
                  <Link to="/profile">
                    <Button variant="outline" className="rounded-full gap-2">
                      <User className="w-4 h-4" /> แก้ไขโปรไฟล์
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Books */}
        {books.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl font-space font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> หนังสือของ {displayName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {books.map(book => (
                <Link key={book.id} to={`/book/${book.id}`}>
                  <GlassCard className="p-3">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      <img src={book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop'} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{book.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-muted-foreground">{book.rating?.toFixed(1) || '–'}</span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-space font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> โพสต์ชุมชน
            </h2>
            <div className="space-y-3">
              {posts.map(post => (
                <GlassCard key={post.id} hover={false} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{post.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm ml-4">
                      <Heart className="w-4 h-4" /> {post.like_count || 0}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {books.length === 0 && posts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีกิจกรรมในโปรไฟล์นี้</p>
          </div>
        )}
      </div>
    </div>
  );
}