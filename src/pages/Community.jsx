import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Plus, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';

export default function Community() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('discussion');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 30),
    initialData: [],
  });

  const { data: trending } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-like_count', 10),
    initialData: [],
  });

  const createPost = useMutation({
    mutationFn: () => base44.entities.CommunityPost.create({
      title: newTitle, content: newContent, post_type: newType,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewTitle(''); setNewContent(''); setDialogOpen(false);
    },
  });

  const likePost = useMutation({
    mutationFn: (post) => base44.entities.CommunityPost.update(post.id, { like_count: (post.like_count || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const typeColors = {
    discussion: 'bg-primary/10 text-primary',
    review: 'bg-accent/10 text-accent',
    quote: 'bg-yellow-500/10 text-yellow-500',
    recommendation: 'bg-green-500/10 text-green-500',
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-space font-bold">ชุมชนนักอ่าน</h1>
            <p className="text-muted-foreground text-sm">พูดคุยเรื่องหนังสือ แชร์คำคม และเขียนรีวิว</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent rounded-full">
                <Plus className="w-4 h-4" /> โพสต์ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>สร้างโพสต์</DialogTitle></DialogHeader>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussion">พูดคุย</SelectItem>
                  <SelectItem value="review">รีวิว</SelectItem>
                  <SelectItem value="quote">คำคม</SelectItem>
                  <SelectItem value="recommendation">แนะนำ</SelectItem>
                </SelectContent>
              </Select>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="หัวข้อ..." />
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="เขียนโพสต์ของคุณ..." rows={5} />
              <Button onClick={() => createPost.mutate()} disabled={!newTitle.trim() || createPost.isPending}>
                {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} โพสต์
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="latest">
          <TabsList className="glass mb-6">
            <TabsTrigger value="latest">ล่าสุด</TabsTrigger>
            <TabsTrigger value="trending">กำลังนิยม</TabsTrigger>
          </TabsList>

          <TabsContent value="latest">
            <PostList posts={posts} loading={isLoading} likePost={likePost} typeColors={typeColors} />
          </TabsContent>
          <TabsContent value="trending">
            <PostList posts={trending} loading={false} likePost={likePost} typeColors={typeColors} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PostList({ posts, loading, likePost, typeColors }) {
  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!posts?.length) return <p className="text-center text-muted-foreground py-8">ยังไม่มีโพสต์ เป็นคนแรกสิ!</p>;

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <GlassCard hover={false} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${typeColors[post.post_type] || typeColors.discussion} text-xs`}>{post.post_type}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{post.created_by}</span>
            </div>
            <h3 className="font-bold mb-2">{post.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.content}</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary" onClick={() => likePost.mutate(post)}>
                <Heart className="w-4 h-4" /> {post.like_count || 0}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <MessageSquare className="w-4 h-4" /> {post.comment_count || 0}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}