import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Wand2, Heart, Search, BookOpen, Rocket, Cat, MoreHorizontal } from 'lucide-react';

const CATS = [
  { icon: LayoutGrid, label: 'ทั้งหมด' },
  { icon: Wand2, label: 'แฟนตาซี' },
  { icon: Heart, label: 'โรแมนติก' },
  { icon: Search, label: 'สืบสวน' },
  { icon: BookOpen, label: 'พัฒนาตนเอง' },
  { icon: Rocket, label: 'ไซไฟ' },
  { icon: Cat, label: 'การ์ตูน/มังงะ' },
  { icon: MoreHorizontal, label: 'เพิ่มเติม' },
];

export default function CategoriesRow() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-heading font-bold mb-4">หมวดหมู่ยอดนิยม</h2>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {CATS.map((c) => (
          <Link key={c.label} to="/discover" className="shrink-0">
            <div className="flex flex-col items-center gap-1.5 w-20">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary hover:bg-primary/15 hover:-translate-y-0.5 transition-all">
                <c.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-muted-foreground text-center leading-tight">{c.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}