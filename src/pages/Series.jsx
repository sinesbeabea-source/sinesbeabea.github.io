import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Loader2, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';

export default function SeriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data: seriesList, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.list('-created_date', 50),
    initialData: [],
  });

  const { data: myBooks } = useQuery({
    queryKey: ['my-books-series'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Book.filter({ created_by: me.email }, '-created_date', 100);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: allBooks } = useQuery({
    queryKey: ['all-books-series'],
    queryFn: () => base44.entities.Book.filter({ status: 'published' }, '-created_date', 200),
    initialData: [],
  });

  const bookMap = Object.fromEntries(allBooks.map(b => [b.id, b]));

  const createSeries = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await base44.entities.Series.create({ ...form, book_ids: [] });
    queryClient.invalidateQueries({ queryKey: ['series'] });
    setForm({ title: '', description: '' });
    setShowCreate(false);
    setSaving(false);
  };

  const statusColor = { ongoing: 'bg-green-500/20 text-green-400', completed: 'bg-blue-500/20 text-blue-400', hiatus: 'bg-yellow-500/20 text-yellow-400' };
  const statusLabel = { ongoing: 'กำลังดำเนินอยู่', completed: 'จบแล้ว', hiatus: 'หยุดพัก' };

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-space font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" /> ซีรีส์หนังสือ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">รวมหนังสือเป็นซีรีส์</p>
        </div>
        {user && (
          <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-full">
            <Plus className="w-4 h-4" /> สร้างซีรีส์
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {seriesList.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-space font-bold text-lg">{s.title}</h3>
                    {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                  </div>
                  <Badge className={`ml-2 text-xs ${statusColor[s.status] || statusColor.ongoing}`}>
                    {statusLabel[s.status] || 'กำลังดำเนินอยู่'}
                  </Badge>
                </div>

                {/* Books in series */}
                <div className="space-y-2">
                  {(s.book_ids || []).slice(0, 3).map((bid, idx) => {
                    const b = bookMap[bid];
                    if (!b) return null;
                    return (
                      <Link key={bid} to={`/book/${bid}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                          {b.cover_url && <img src={b.cover_url} className="w-6 h-8 object-cover rounded" alt="" />}
                          <span className="text-sm flex-1 truncate">{b.title}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                  {(s.book_ids || []).length > 3 && (
                    <p className="text-xs text-muted-foreground pl-6">+{s.book_ids.length - 3} เล่มอีก</p>
                  )}
                  {(s.book_ids || []).length === 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> ยังไม่มีหนังสือในซีรีส์นี้
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{(s.book_ids || []).length} เล่ม</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {seriesList.length === 0 && (
            <div className="md:col-span-2 text-center py-20 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มีซีรีส์ เป็นคนแรกที่สร้าง!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้างซีรีส์ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">ชื่อซีรีส์ *</label>
              <Input placeholder="เช่น ไตรภาค The Dark..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">คำอธิบาย</label>
              <Textarea placeholder="รายละเอียดซีรีส์..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-20" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={createSeries} disabled={saving || !form.title.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'สร้าง'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}