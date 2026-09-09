import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BottomBanner() {
  return (
    <section className="mt-4 mb-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10 text-center shadow-sm">
        <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #5D5FEF, #EC4899)' }} />
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">อยากหาเพื่อนอ่านหนังสือด้วยกันไหม?</h2>
          <p className="text-sm text-muted-foreground mb-6">เข้าสู่ชุมชนของเรา — แชร์รีวิว แลกเปลี่ยนมุมมอง และจับคู่เพื่อนที่ชอบหนังสือแนวเดียวกัน</p>
          <Link to="/community">
            <Button size="lg" className="rounded-full px-8 gap-2"><Users className="w-4 h-4" /> เข้าสู่ชุมชน</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}