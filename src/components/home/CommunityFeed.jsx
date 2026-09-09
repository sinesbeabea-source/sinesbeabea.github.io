import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_STYLES = {
  discussion: 'bg-primary/10 text-primary',
  review: 'bg-accent/10 text-accent',
  quote: 'bg-amber-500/10 text-amber-600',
  recommendation: 'bg-emerald-500/10 text-emerald-600',
};

export default function CommunityFeed({ posts }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-bold">ชุมชนล่าสุด</h2>
        <Link to="/community">
          <Button variant="ghost" size="sm" className="gap-1 text-primary">ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" /></Button>
        </Link>
      </div>
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">ยังไม่มีโพสต์ — เริ่มพูดคุยในชุมชนได้เลย</p>
          </div>
        )}
        {posts.map(p => (
          <Link key={p.id} to="/community">
            <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_STYLES[p.post_type] || 'bg-muted text-muted-foreground'}`}>
                    {p.post_type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.created_date ? moment(p.created_date).fromNow() : ''}
                  </span>
                </div>
                <p className="text-sm font-semibold line-clamp-1">{p.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{p.like_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{p.comment_count || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}