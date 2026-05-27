import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DEFAULT_AVATARS = [
  { id: 'a1', emoji: '📚', bg: 'from-purple-500 to-indigo-500' },
  { id: 'a2', emoji: '🌟', bg: 'from-yellow-500 to-orange-500' },
  { id: 'a3', emoji: '🔮', bg: 'from-blue-500 to-cyan-500' },
  { id: 'a4', emoji: '🦋', bg: 'from-pink-500 to-rose-500' },
  { id: 'a5', emoji: '🌙', bg: 'from-indigo-600 to-purple-700' },
  { id: 'a6', emoji: '⚡', bg: 'from-yellow-400 to-red-500' },
  { id: 'a7', emoji: '🌸', bg: 'from-rose-400 to-pink-600' },
  { id: 'a8', emoji: '🎭', bg: 'from-green-500 to-teal-500' },
];

export default function AvatarEditor({ userEmail, userName, onClose }) {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDefault, setSelectedDefault] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const { data: avatars } = useQuery({
    queryKey: ['avatar', userEmail],
    queryFn: () => base44.entities.UserAvatar.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    initialData: [],
  });

  const currentAvatar = avatars[0];

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('ไฟล์ต้องมีขนาดไม่เกิน 5MB'); return; }
    setSelectedFile(file);
    setSelectedDefault(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const saveAvatar = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let avatarUrl = null;
      let avatarType = 'default';

      if (selectedFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
        avatarUrl = file_url;
        avatarType = 'uploaded';
      }

      const data = {
        user_email: userEmail,
        avatar_type: avatarType,
        avatar_url: avatarUrl,
        default_avatar_id: selectedDefault,
      };

      if (currentAvatar?.id) {
        await base44.entities.UserAvatar.update(currentAvatar.id, data);
      } else {
        await base44.entities.UserAvatar.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar', userEmail] });
      setUploading(false);
      onClose();
    },
    onError: () => setUploading(false),
  });

  const removeAvatar = useMutation({
    mutationFn: async () => {
      if (currentAvatar?.id) {
        await base44.entities.UserAvatar.update(currentAvatar.id, {
          avatar_url: null, avatar_type: 'default', default_avatar_id: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar', userEmail] });
      onClose();
    },
  });

  return (
    <DialogContent className="max-w-md glass border-border/50">
      <DialogHeader>
        <DialogTitle className="font-space">แก้ไขรูปโปรไฟล์</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="relative">
            <AvatarDisplay
              avatar={currentAvatar}
              preview={preview}
              selectedDefault={selectedDefault}
              userName={userName}
              size="lg"
            />
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">ลากหรือคลิกเพื่ออัปโหลดรูป</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG ขนาดไม่เกิน 5MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Default avatars */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">หรือเลือกอวาตาร์สำเร็จรูป</p>
          <div className="grid grid-cols-4 gap-2">
            {DEFAULT_AVATARS.map(av => (
              <motion.button
                key={av.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedDefault(av.id); setPreview(null); setSelectedFile(null); }}
                className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${av.bg} flex items-center justify-center text-2xl transition-all ${
                  selectedDefault === av.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
              >
                {av.emoji}
                {selectedDefault === av.id && (
                  <div className="absolute inset-0 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {currentAvatar?.avatar_url && (
            <Button variant="outline" className="gap-2 text-destructive border-destructive/30" onClick={() => removeAvatar.mutate()}>
              <X className="w-4 h-4" /> ลบรูป
            </Button>
          )}
          <Button
            className="flex-1 gap-2"
            onClick={() => saveAvatar.mutate()}
            disabled={(!selectedFile && !selectedDefault) || uploading || saveAvatar.isPending}
          >
            {uploading || saveAvatar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            บันทึก
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function AvatarDisplay({ avatar, preview, selectedDefault, userName, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-16 h-16 text-2xl';

  const selectedAv = selectedDefault ? DEFAULT_AVATARS.find(a => a.id === selectedDefault) : null;
  const currentDefault = avatar?.default_avatar_id ? DEFAULT_AVATARS.find(a => a.id === avatar.default_avatar_id) : null;

  if (preview) {
    return <img src={preview} alt="preview" className={`${sizeClass} rounded-full object-cover`} />;
  }
  if (selectedAv) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${selectedAv.bg} flex items-center justify-center`}>
        {selectedAv.emoji}
      </div>
    );
  }
  if (avatar?.avatar_url) {
    return <img src={avatar.avatar_url} alt="avatar" className={`${sizeClass} rounded-full object-cover`} />;
  }
  if (currentDefault) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${currentDefault.bg} flex items-center justify-center`}>
        {currentDefault.emoji}
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center`}>
      <span className="font-bold text-white">{userName?.[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}