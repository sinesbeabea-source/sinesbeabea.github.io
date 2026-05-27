import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, Heart, Users, BookOpen, Sparkles, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';

const iconMap = {
  message: MessageCircle,
  follower: Users,
  match: Heart,
  like: Heart,
  comment: MessageCircle,
  chapter_update: BookOpen,
  recommendation: Sparkles,
  system: Bell,
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 50),
    initialData: [],
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: (notif) => base44.entities.Notification.update(notif.id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-space font-bold">การแจ้งเตือน</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} ยังไม่ได้อ่าน</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="w-4 h-4" /> อ่านทั้งหมด
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <GlassCard
                  hover={!notif.read}
                  className={`flex items-start gap-3 p-4 ${!notif.read ? 'border-primary/30' : 'opacity-60'}`}
                  onClick={() => !notif.read && markRead.mutate(notif)}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-4 h-4 ${!notif.read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-medium' : ''}`}>{notif.title}</p>
                    {notif.message && <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>}
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </GlassCard>
              </motion.div>
            );
          })}
          {notifications.length === 0 && (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}