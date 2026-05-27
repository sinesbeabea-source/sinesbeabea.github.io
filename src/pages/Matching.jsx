import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, X, MessageCircle, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';
import MatchNotificationPopup from '@/components/matching/MatchNotificationPopup';
import { useNavigate } from 'react-router-dom';

export default function Matching() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [newMatch, setNewMatch] = useState(null);

  const { data: myMatches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => base44.entities.ReaderMatch.filter({ user_email: user?.email, status: 'accepted' }, '-created_date', 20),
    initialData: [],
    enabled: !!user,
  });

  const generateMatches = async () => {
    setGenerating(true);
    const allUsers = await base44.entities.User.list('-created_date', 30);
    const otherUsers = allUsers.filter(u => u.email !== user?.email);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate reader match profiles for these users: ${JSON.stringify(otherUsers.map(u => ({ email: u.email, name: u.full_name })))}. For each user, create a fun reader personality profile with match_percent (60-98), personality_tags (3-4), shared_genres (2-3 from: Fantasy, Romance, Mystery, Sci-Fi, Horror, Thriller), and a fun bio.`,
      response_json_schema: {
        type: "object",
        properties: {
          profiles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
                match_percent: { type: "number" },
                personality_tags: { type: "array", items: { type: "string" } },
                shared_genres: { type: "array", items: { type: "string" } },
                bio: { type: "string" },
                reader_type: { type: "string" }
              }
            }
          }
        }
      }
    });
    setProfiles(result.profiles || []);
    setCurrentIndex(0);
    setGenerating(false);
  };

  const handleAction = async (action) => {
    const profile = profiles[currentIndex];
    if (!profile) return;

    const created = await base44.entities.ReaderMatch.create({
      user_email: user?.email,
      matched_email: profile.email,
      match_percent: profile.match_percent,
      shared_genres: profile.shared_genres,
      personality_tags: profile.personality_tags,
      status: action === 'like' ? 'accepted' : 'rejected',
    });

    if (action === 'like') {
      setNewMatch({ ...created, matched_email: profile.email, match_percent: profile.match_percent });
    }

    queryClient.invalidateQueries({ queryKey: ['my-matches'] });
    setCurrentIndex(prev => prev + 1);
  };

  const currentProfile = profiles[currentIndex];
  const hasMore = currentIndex < profiles.length;

  const handleStartChat = (match) => {
    navigate('/match-chat');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <MatchNotificationPopup
        match={newMatch}
        onClose={() => setNewMatch(null)}
        onStartChat={handleStartChat}
      />
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-space font-bold mb-2">
            <Users className="inline w-7 h-7 text-primary mr-2" />
            Reader <span className="gradient-text">Match</span>
          </h1>
          <p className="text-muted-foreground text-sm">หานักอ่านที่มีรสนิยมเดียวกับคุณ</p>
        </motion.div>

        {profiles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">พร้อมหาคู่อ่านหนังสือแล้วหรือยัง?</h2>
            <p className="text-sm text-muted-foreground mb-6">AI จะวิเคราะห์รสนิยมการอ่านและแนะนำนักอ่านที่เข้ากันได้</p>
            <Button onClick={generateMatches} disabled={generating} className="bg-gradient-to-r from-primary to-accent rounded-full px-8 gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              หาแมทช์
            </Button>
          </div>
        )}

        {/* Match Card */}
        <AnimatePresence mode="wait">
          {hasMore && currentProfile && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, x: 300, rotateY: 10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard hover={false} glow className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(currentProfile.name || currentProfile.email)?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-1">{currentProfile.name || currentProfile.email}</h2>
                <p className="text-sm text-primary mb-1">{currentProfile.reader_type}</p>
                <p className="text-xs text-muted-foreground mb-4">{currentProfile.bio}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">ความเข้ากัน</span>
                    <span className="font-bold text-primary">{currentProfile.match_percent}%</span>
                  </div>
                  <Progress value={currentProfile.match_percent} className="h-2" />
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {currentProfile.personality_tags?.map(t => (
                    <Badge key={t} className="bg-primary/10 text-primary border-primary/20 text-xs">{t}</Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                  {currentProfile.shared_genres?.map(g => (
                    <Badge key={g} variant="outline" className="text-xs border-accent/30 text-accent">{g}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="lg" className="rounded-full w-14 h-14 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction('skip')}>
                    <X className="w-6 h-6" />
                  </Button>
                  <Button size="lg" className="rounded-full w-16 h-16 bg-gradient-to-r from-primary to-accent" onClick={() => handleAction('like')}>
                    <Heart className="w-7 h-7" />
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full w-14 h-14 border-accent/30 text-accent hover:bg-accent/10">
                    <MessageCircle className="w-6 h-6" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4">{currentIndex + 1} / {profiles.length} คน</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {profiles.length > 0 && !hasMore && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">คุณดูครบทุกคนแล้ว!</p>
            <Button onClick={generateMatches} disabled={generating} variant="outline" className="rounded-full gap-2">
              <Sparkles className="w-4 h-4" /> หาเพิ่ม
            </Button>
          </div>
        )}

        {/* Accepted Matches */}
        {myMatches.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold mb-4">แมทช์ของคุณ ({myMatches.length})</h3>
            <div className="space-y-3">
              {myMatches.map(m => (
                <GlassCard key={m.id} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">{m.matched_email?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.matched_email}</p>
                    <div className="flex gap-1 mt-1">
                      {m.shared_genres?.slice(0, 2).map(g => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{m.match_percent}%</span>
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs border-primary/30 text-primary" onClick={() => navigate('/match-chat')}>
                      <MessageCircle className="w-3 h-3" /> แชท
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}