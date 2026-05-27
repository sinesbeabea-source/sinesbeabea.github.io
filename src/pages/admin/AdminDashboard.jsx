import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, BookOpen, MessageSquare, Shield, TrendingUp, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    initialData: [],
  });

  const { data: books } = useQuery({
    queryKey: ['admin-books'],
    queryFn: () => base44.entities.Book.list('-created_date', 200),
    initialData: [],
  });

  const { data: posts } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 100),
    initialData: [],
  });

  const { data: chatRooms } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => base44.entities.ChatRoom.list('-created_date', 50),
    initialData: [],
  });

  const stats = [
    { title: 'Total Users', value: users.length, icon: Users, color: 'from-violet-500 to-purple-600' },
    { title: 'Total Books', value: books.length, icon: BookOpen, color: 'from-cyan-500 to-blue-600' },
    { title: 'Community Posts', value: posts.length, icon: MessageSquare, color: 'from-pink-500 to-rose-600' },
    { title: 'Chat Rooms', value: chatRooms.length, icon: MessageSquare, color: 'from-amber-500 to-orange-600' },
  ];

  // Genre distribution
  const genreCounts = {};
  books.forEach(b => b.genres?.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
  const genreData = Object.entries(genreCounts).slice(0, 6).map(([name, value]) => ({ name, value }));
  
  const statusData = [
    { name: 'Published', value: books.filter(b => b.status === 'published').length },
    { name: 'Draft', value: books.filter(b => b.status === 'draft').length },
    { name: 'Pending', value: books.filter(b => b.status === 'pending_review').length },
  ];

  const COLORS = ['hsl(250,90%,65%)', 'hsl(195,100%,50%)', 'hsl(280,80%,60%)', 'hsl(330,80%,60%)', 'hsl(160,70%,50%)', 'hsl(43,74%,66%)'];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <Shield className="inline w-7 h-7 text-primary mr-2" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Platform overview and management</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover={false} className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <GlassCard hover={false} className="p-6">
            <h3 className="font-bold mb-4">Genre Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={genreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,20%,18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220,15%,55%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(220,15%,55%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(230,25%,10%)', border: '1px solid hsl(230,20%,18%)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="hsl(250,90%,65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h3 className="font-bold mb-4">Book Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(230,25%,10%)', border: '1px solid hsl(230,20%,18%)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {statusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <h3 className="font-bold mb-4">Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Manage Users', path: '/admin/users', icon: Users },
            { label: 'Manage Books', path: '/admin/books', icon: BookOpen },
            { label: 'Reports', path: '/admin/reports', icon: Flag },
            { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
          ].map(link => (
            <Link key={link.path} to={link.path}>
              <GlassCard className="p-4 text-center">
                <link.icon className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{link.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Recent Books */}
        <h3 className="font-bold mb-4">Recent Books</h3>
        <div className="space-y-2">
          {books.slice(0, 10).map(b => (
            <GlassCard key={b.id} hover={false} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.author} · {b.status}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{b.created_by}</span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}