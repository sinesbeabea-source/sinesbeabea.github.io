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

  const toggleGenre = (g) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
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
            Upload Book
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Share your book with the community</p>

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
                    <p className="font-medium mb-1">Upload Cover Image</p>
                    <p className="text-sm text-muted-foreground">Recommended: 600x900px</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </label>
            </GlassCard>

            {/* Details */}
            <div className="space-y-4">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Book Title *" className="h-12" />
              <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author Name" className="h-12" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description / Synopsis" rows={4} />
            </div>

            {/* AI Assist */}
            <Button variant="outline" onClick={aiAssist} disabled={aiLoading} className="gap-2 rounded-full border-primary/30">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
              AI Auto-Fill
            </Button>

            {/* Genres */}
            <div>
              <label className="text-sm font-medium mb-2 block">Genres</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <Badge
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`cursor-pointer ${selectedGenres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/20'}`}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">AI Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => <Badge key={t} variant="outline" className="text-xs border-accent/30 text-accent">{t}</Badge>)}
                </div>
              </div>
            )}

            {/* Mood & Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mood</label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger><SelectValue placeholder="Select mood" /></SelectTrigger>
                  <SelectContent>
                    {['dark', 'emotional', 'relaxing', 'horror', 'action', 'psychological', 'romantic', 'mystery'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content Rating</label>
                <Select value={contentRating} onValueChange={setContentRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="teen">Teen (15+)</SelectItem>
                    <SelectItem value="mature">Mature (18+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="w-full h-12 bg-gradient-to-r from-primary to-accent rounded-xl text-lg gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
              Publish Book
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}