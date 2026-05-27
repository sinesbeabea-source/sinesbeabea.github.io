import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, LogOut, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';

export default function Settings() {
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ bio });
    setSaving(false);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-space font-bold mb-2">
            <SettingsIcon className="inline w-7 h-7 text-primary mr-2" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Manage your account and preferences</p>

          <Tabs defaultValue="profile">
            <TabsList className="glass mb-6">
              <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2"><Shield className="w-4 h-4" /> Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <GlassCard hover={false} className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Name</Label>
                  <Input value={user?.full_name || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </Button>
              </GlassCard>
            </TabsContent>

            <TabsContent value="notifications">
              <GlassCard hover={false} className="p-6 space-y-4">
                {['New messages', 'New followers', 'Match notifications', 'Book recommendations', 'Community updates'].map(item => (
                  <div key={item} className="flex items-center justify-between">
                    <Label className="text-sm">{item}</Label>
                    <Switch defaultChecked />
                  </div>
                ))}
              </GlassCard>
            </TabsContent>

            <TabsContent value="privacy">
              <GlassCard hover={false} className="p-6 space-y-4">
                {['Show reading activity', 'Show in reader matching', 'Allow direct messages', 'Show profile publicly'].map(item => (
                  <div key={item} className="flex items-center justify-between">
                    <Label className="text-sm">{item}</Label>
                    <Switch defaultChecked />
                  </div>
                ))}
              </GlassCard>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button variant="ghost" className="text-destructive gap-2" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}