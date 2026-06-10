import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, LogOut, Save, Loader2, AtSign, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const isValidUsername = /^[a-z0-9_]{3,20}$/.test(username);

  const handleSave = async () => {
    if (username && username !== user?.username) {
      if (!isValidUsername) { setUsernameError('ใช้ตัวอักษรเล็ก, ตัวเลข หรือ _ (3-20 ตัว)'); return; }
      const all = await base44.entities.User.list();
      const taken = all.some(u => u.username === username && u.id !== user?.id);
      if (taken) { setUsernameError('username นี้ถูกใช้แล้ว'); return; }
    }
    setSaving(true);
    await base44.auth.updateMe({ bio, username: username || undefined, full_name: fullName || undefined });
    setSaving(false);
    setUsernameError('');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-space font-bold mb-2">
            <SettingsIcon className="inline w-7 h-7 text-primary mr-2" />
            ตั้งค่า
          </h1>
          <p className="text-muted-foreground text-sm mb-8">จัดการบัญชีและการตั้งค่าของคุณ</p>

          <Tabs defaultValue="profile">
            <TabsList className="glass mb-6">
              <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> โปรไฟล์</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> การแจ้งเตือน</TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2"><Shield className="w-4 h-4" /> ความเป็นส่วนตัว</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <GlassCard hover={false} className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">อีเมล</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">ชื่อ</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="ชื่อของคุณ" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                    <Input
                      value={username}
                      onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setUsernameError(''); }}
                      placeholder="bookworm123"
                      className="pl-7"
                      maxLength={20}
                    />
                    {username.length >= 3 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isValidUsername ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-destructive" />}
                      </span>
                    )}
                  </div>
                  {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
                  <p className="text-xs text-muted-foreground mt-1">ตัวอักษรเล็ก, ตัวเลข, _ เท่านั้น (3-20 ตัว)</p>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">แนะนำตัว</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="เล่าเกี่ยวกับตัวคุณให้คนอื่นรู้จัก..." rows={3} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึก
                </Button>
              </GlassCard>
            </TabsContent>

            <TabsContent value="notifications">
              <GlassCard hover={false} className="p-6 space-y-4">
                {['ข้อความใหม่', 'ผู้ติดตามใหม่', 'การแจ้งเตือนแมทช์', 'แนะนำหนังสือ', 'อัปเดตชุมชน'].map(item => (
                  <div key={item} className="flex items-center justify-between">
                    <Label className="text-sm">{item}</Label>
                    <Switch defaultChecked />
                  </div>
                ))}
              </GlassCard>
            </TabsContent>

            <TabsContent value="privacy">
              <GlassCard hover={false} className="p-6 space-y-4">
                {['แสดงกิจกรรมการอ่าน', 'แสดงในระบบจับคู่นักอ่าน', 'อนุญาตข้อความส่วนตัว', 'แสดงโปรไฟล์แบบสาธารณะ'].map(item => (
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
              <LogOut className="w-4 h-4" /> ออกจากระบบ
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}