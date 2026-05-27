import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, PenTool, Heart, Settings, LogOut, Library, Star, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import BookGrid from '@/components/books/BookGrid';

export default function Profile() {
  const { user } = useAuth();

  const { data: myBooks } = useQuery({
    queryKey: ['my-books'],
    queryFn: () => base44.entities.Book.filter({ created_by: user?.email }, '-created_date', 20),
    initialData: [],
    enabled: !!user,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-progress-all'],
    queryFn: () => base44.entities.ReadingProgress.filter({ created_by: user?.email }, '-updated_date', 50),
    initialData: [],
    enabled: !!user,
  });

  const { data: myMatches } = useQuery({
    queryKey: ['my-matches-count'],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, status: 'accepted' }),
    initialData: [],
    enabled: !!user,
  });

  const stats = [
    { label: 'Books Read', value: myProgress.filter(p => p.status === 'finished').length, icon: BookOpen },
    { label: 'Reading', value: myProgress.filter(p => p.status === 'reading').length, icon: Library },
    { label: 'Uploaded', value: myBooks.length, icon: PenTool },
    { label: 'Matches', value: myMatches.length, icon: Users },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} glow className="p-8 text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <h1 className="text-2xl font-space font-bold mb-1">{user?.full_name || 'Reader'}</h1>
            <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-primary/10 text-primary">Book Lover</Badge>
              <Badge className="bg-accent/10 text-accent">Explorer</Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'My Library', path: '/library', icon: Library },
            { label: 'Upload Book', path: '/upload', icon: BookOpen },
            { label: 'Write Novel', path: '/write', icon: PenTool },
            { label: 'Settings', path: '/settings', icon: Settings },
          ].map(link => (
            <Link key={link.path} to={link.path}>
              <GlassCard className="p-4 text-center">
                <link.icon className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{link.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* My Books */}
        {myBooks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-space font-bold mb-4">My Books</h2>
            <BookGrid books={myBooks} />
          </div>
        )}

        <div className="text-center">
          <Button variant="ghost" className="text-destructive gap-2" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}