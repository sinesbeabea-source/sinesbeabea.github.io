import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { AtSign, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Modal shown when user has no username yet
export default function UsernameSetup({ onDone }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = /^[a-z0-9_]{3,20}$/.test(value);

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');

    // Check uniqueness via backend (has service role access)
    const res = await base44.functions.invoke('checkUsername', { username: value });
    const taken = res.data?.taken;
    if (taken) {
      setError('username นี้ถูกใช้แล้ว ลองใหม่นะครับ');
      setLoading(false);
      return;
    }

    await base44.auth.updateMe({ username: value });
    setLoading(false);
    onDone(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <AtSign className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-space font-bold mb-2">ตั้ง Username ของคุณ</h2>
        <p className="text-sm text-muted-foreground mb-6">
          ใช้ตัวอักษรเล็ก, ตัวเลข หรือ _ เท่านั้น (3-20 ตัว)
        </p>

        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
          <Input
            value={value}
            onChange={e => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(''); }}
            placeholder="bookworm123"
            className="pl-7 text-center"
            maxLength={20}
          />
          {value.length >= 3 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-destructive" />}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={!isValid || loading}
          className="w-full bg-gradient-to-r from-primary to-accent border-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          ยืนยัน
        </Button>
      </motion.div>
    </div>
  );
}