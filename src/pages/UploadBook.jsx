import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Loader2, Image, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const GENRES = ['Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 'Horror', 'Thriller', 'Adventure', 'Drama', 'Comedy', 'Action'];
const GENRE_LABELS = {
  Fantasy: 'แฟนตาซี', Romance: 'โรแมนติก', Mystery: 'สืบสวน', 'Sci-Fi': 'ไซไฟ', Horror: 'สยองขวัญ',
  Thriller: 'ระทึกขวัญ', Adventure: 'ผจญภัย', Drama: 'ชีวิต', Comedy: 'ตลก', Action: 'แอ็กชัน',
};
const MOOD_LABELS = {
  dark: 'มืดหม่น', emotional: 'เร้าอารมณ์', relaxing: 'ผ่อนคลาย', horror: 'สยองขวัญ', action: 'แอ็กชัน',
  psychological: 'จิตวิทยา', romantic: 'โรแมนติก', mystery: 'ลึกลับ', adventure: 'ผจญภัย', comedy: 'ตลก',
};

export default function UploadBook() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('');
  const [contentRating, setContentRating] = useState('general');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [customGenre, setCustomGenre] = useState('');

  const toggleGenre = (g) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const addCustomGenre = () => {
    const g = customGenre.trim();
    if (g && !selectedGenres.includes(g)) {
      setSelectedGenres(prev => [...prev, g]);
    }
    setCustomGenre('');
  };

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const aiAssist = async () => {
    if (!title && !description) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Book title: "${title}". Description: "${description}". Suggest: genres (from ${GENRES.join(',')}), mood (from dark,emotional,relaxing,horror,action,psychological,romantic,mystery,adventure,comedy), 5 smart tags, and an improved description if the current one is short.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_genres: { type: "array", items: { type: "string" } },
          suggested_mood: { type: "string" },
          suggested_tags: { type: "array", items: { type: "string" } },
          improved_description: { type: "string" }
        }
      }
    });
    if (result.suggested_genres?.length) setSelectedGenres(result.suggested_genres);
    if (result.suggested_mood) setMood(result.suggested_mood);
    if (result.suggested_tags?.length) setTags(result.suggested_tags);
    if (result.improved_description && !description) setDescription(result.improved_description);
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    let cover_url = '';
    if (coverFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coverFile });
      cover_url = file_url;
    }
    await base44.entities.Book.create({
      title, author, description, cover_url,
      genres: selectedGenres, tags, mood,
      content_rating: contentRating,
      book_type: 'uploaded',
      status: 'published',
    });
    setSaving(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-space font-bold mb-2">
            <Upload className="inline w-7 h-7 text-primary mr-2" />
            อัปโหลดหนังสือ
          </h1>
          <p className="text-muted-foreground text-sm mb-8">แชร์หนังสือของคุณกับชุมชนนักอ่าน</p>

          <div className="space-y-6">
            {/* Cover */}
            <GlassCard hover={false} className="p-6">
              <label className="block cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-28 aspect-[2/3] rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium mb-1">อัปโหลดรูปปกหนังสือ</p>
                    <p className="text-sm text-muted-foreground">ขนาดแนะนำ: 600x900px</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </label>
            </GlassCard>

            {/* Details */}
            <div className="space-y-4">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="ชื่อเรื่อง *" className="h-12" />
              <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="ชื่อผู้แต่ง" className="h-12" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="คำโปรย / เรื่องย่อ" rows={4} />
            </div>

            {/* AI Assist */}
            <Button variant="outline" onClick={aiAssist} disabled={aiLoading} className="gap-2 rounded-full border-primary/30">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
              ให้ AI ช่วยกรอก
            </Button>

            {/* Genres */}
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <Badge
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`cursor-pointer ${selectedGenres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/20'}`}
                  >
                    {GENRE_LABELS[g] || g}
                  </Badge>
                ))}
                {selectedGenres.filter(g => !GENRES.includes(g)).map(g => (
                  <Badge
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className="cursor-pointer bg-accent text-accent-foreground"
                  >
                    {g} ✕
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  value={customGenre}
                  onChange={e => setCustomGenre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomGenre())}
                  placeholder="ใส่หมวดหมู่เอง เช่น กีฬา อาหาร ประวัติศาสตร์"
                  className="h-10"
                />
                <Button type="button" variant="outline" onClick={addCustomGenre} className="shrink-0">เพิ่ม</Button>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">แท็กจาก AI</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => <Badge key={t} variant="outline" className="text-xs border-accent/30 text-accent">{t}</Badge>)}
                </div>
              </div>
            )}

            {/* Mood & Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">อารมณ์เรื่อง</label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger><SelectValue placeholder="เลือกอารมณ์เรื่อง" /></SelectTrigger>
                  <SelectContent>
                    {['dark', 'emotional', 'relaxing', 'horror', 'action', 'psychological', 'romantic', 'mystery'].map(m => (
                      <SelectItem key={m} value={m}>{MOOD_LABELS[m] || m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">เรตติ้งเนื้อหา</label>
                <Select value={contentRating} onValueChange={setContentRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">ทั่วไป</SelectItem>
                    <SelectItem value="teen">วัยรุ่น (15+)</SelectItem>
                    <SelectItem value="mature">ผู้ใหญ่ (18+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="w-full h-12 bg-gradient-to-r from-primary to-accent rounded-xl text-lg gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
              เผยแพร่หนังสือ
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}