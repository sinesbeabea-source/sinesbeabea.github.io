import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, X, BookOpen, Users, Heart, Mic, Star, Coins, Sparkles, MessageCircle, Library, Zap } from 'lucide-react';
import PhoneMockupScreen from '@/components/presentation/PhoneMockupScreen';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    type: 'cover',
    title: 'BookMatch AI',
    subtitle: 'แพลตฟอร์มอ่านนิยายอัจฉริยะ\nที่จับคู่นักอ่านด้วย AI',
    emoji: '📚',
    gradient: 'from-[#FF85C2] via-[#c084fc] to-[#85FFD4]',
    bg: 'from-slate-950 via-purple-950 to-slate-900',
  },
  {
    id: 2,
    type: 'problem',
    title: 'ปัญหาของนักอ่าน',
    points: [
      { icon: '😔', text: 'อ่านหนังสือคนเดียว ไม่มีคนคุยด้วย' },
      { icon: '🔍', text: 'หาหนังสือที่ใช่ยาก ไม่รู้จะเริ่มอ่านอะไร' },
      { icon: '💬', text: 'ขาดชุมชนนักอ่านที่แชร์ความสนใจเดียวกัน' },
      { icon: '📖', text: 'ไม่มีระบบติดตามการอ่านที่สะดวก' },
    ],
    gradient: 'from-rose-500 to-orange-500',
    bg: 'from-slate-950 to-slate-900',
  },
  {
    id: 3,
    type: 'solution',
    title: 'BookMatch AI คือคำตอบ',
    subtitle: 'แพลตฟอร์มครบวงจรสำหรับนักอ่านยุคใหม่',
    features: [
      { icon: Heart, label: 'จับคู่นักอ่าน', desc: 'AI หาคู่อ่านที่ใช่สำหรับคุณ', color: 'text-pink-400' },
      { icon: BookOpen, label: 'ห้องสมุดดิจิทัล', desc: 'นิยายหลากหลายแนว', color: 'text-cyan-400' },
      { icon: MessageCircle, label: 'แชทเรียลไทม์', desc: 'คุยกับคู่อ่านได้ทันที', color: 'text-green-400' },
      { icon: Users, label: 'ชุมชนนักอ่าน', desc: 'รีวิว แชร์ ถกเถียง', color: 'text-purple-400' },
    ],
    gradient: 'from-[#FF85C2] to-[#85FFD4]',
    bg: 'from-slate-950 to-purple-950',
  },
  {
    id: 4,
    type: 'feature-detail',
    title: 'ระบบจับคู่อัจฉริยะ',
    subtitle: 'AI วิเคราะห์แนวหนังสือ อารมณ์ และสไตล์การอ่าน\nเพื่อหาคู่อ่านที่เข้ากันได้มากที่สุด',
    stats: [
      { value: '95%', label: 'ความแม่นยำการจับคู่' },
      { value: '<3s', label: 'เวลาในการหาคู่' },
      { value: '50+', label: 'แนวหนังสือ' },
    ],
    emoji: '💘',
    gradient: 'from-pink-500 to-rose-500',
    bg: 'from-slate-950 to-pink-950',
  },
  {
    id: 5,
    type: 'feature-detail',
    title: 'อ่านด้วยกัน (Read Together)',
    subtitle: 'ซิงค์บทอ่านกับคู่แบบเรียลไทม์\nคุยโทรหากันระหว่างอ่านได้เลย',
    stats: [
      { value: '🔄', label: 'Sync บทพร้อมกัน' },
      { value: '📞', label: 'Voice Call ในตัว' },
      { value: '💬', label: 'แชทระหว่างอ่าน' },
    ],
    emoji: '👥',
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'from-slate-950 to-blue-950',
  },
  {
    id: 6,
    type: 'feature-detail',
    title: 'เขียนนิยายของตัวเอง',
    subtitle: 'เครื่องมือเขียนนิยายพร้อม AI ช่วยเขียน\nสร้างรายได้จากนิยายของคุณด้วยระบบ Coin',
    stats: [
      { value: '✍️', label: 'Editor ในตัว' },
      { value: '🤖', label: 'AI ช่วยเขียน' },
      { value: '💰', label: 'ระบบ Premium' },
    ],
    emoji: '📝',
    gradient: 'from-yellow-500 to-orange-500',
    bg: 'from-slate-950 to-orange-950',
  },
  {
    id: 7,
    type: 'features-grid',
    title: 'ฟีเจอร์ครบครัน',
    items: [
      { icon: Library, label: 'ห้องสมุด', desc: 'จัดการรายการอ่าน' },
      { icon: Sparkles, label: 'AI แนะนำ', desc: 'แนะนำหนังสือส่วนตัว' },
      { icon: Star, label: 'รีวิว', desc: 'ให้คะแนนและวิจารณ์' },
      { icon: Coins, label: 'ระบบ Coin', desc: 'ซื้อบทพรีเมียม' },
      { icon: Mic, label: 'Text-to-Speech', desc: 'ฟังนิยายได้เลย' },
      { icon: Zap, label: 'Highlight', desc: 'บันทึกข้อความโปรด' },
    ],
    gradient: 'from-[#FF85C2] to-[#c084fc]',
    bg: 'from-slate-950 to-slate-900',
  },
  {
    id: 8,
    type: 'app-preview',
    screenId: 'home',
    title: 'หน้าแรก (Home)',
    subtitle: 'จุดเริ่มต้นของทุกประสบการณ์การอ่าน',
    color: '#FF85C2',
    gradient: 'from-[#FF85C2] to-[#c084fc]',
    bg: 'from-slate-950 to-purple-950',
    highlights: [
      { label: 'Featured Books', desc: 'หนังสือแนะนำของวัน คัดโดย AI' },
      { label: 'Trending Now', desc: 'กำลังฮิตในชุมชนนักอ่าน' },
      { label: 'Quick Match', desc: 'เริ่มหาคู่อ่านได้เลยจากหน้านี้' },
    ],
  },
  {
    id: 9,
    type: 'app-preview',
    screenId: 'matching',
    title: 'หน้าจับคู่ (Matching)',
    subtitle: 'เลือกหนังสือแล้วให้ AI หาคู่อ่านที่ใช่',
    color: '#c084fc',
    gradient: 'from-[#c084fc] to-[#FF85C2]',
    bg: 'from-slate-950 to-pink-950',
    highlights: [
      { label: 'เลือกหนังสือ', desc: 'เลือกเล่มที่กำลังอ่านอยู่' },
      { label: 'AI Match', desc: 'ระบบ AI หาคนที่ชอบเล่มเดียวกัน' },
      { label: 'Chat & Call', desc: 'แชทหรือโทรหากันได้ทันที' },
    ],
  },
  {
    id: 10,
    type: 'app-preview',
    screenId: 'reader',
    title: 'หน้าอ่านหนังสือ (Reader)',
    subtitle: 'อ่านนิยายอย่างเพลิดเพลินด้วย Reader ที่ปรับได้เต็มที่',
    color: '#60a5fa',
    gradient: 'from-[#60a5fa] to-[#85FFD4]',
    bg: 'from-slate-950 to-blue-950',
    highlights: [
      { label: 'ปรับ Font & Theme', desc: 'เลือก font, ขนาด, และสีพื้นหลัง' },
      { label: 'Highlight & Note', desc: 'ไฮไลต์ข้อความและจดโน้ตส่วนตัว' },
      { label: 'Text-to-Speech', desc: 'เปิดให้แอปอ่านออกเสียงได้เลย' },
    ],
  },
  {
    id: 11,
    type: 'page-tour',
    title: 'ฟีเจอร์อื่นๆ ในแอป',
    subtitle: 'แต่ละหน้าออกแบบมาเพื่อประสบการณ์นักอ่านที่ดีที่สุด',
    pages: [
      {
        emoji: '🔍',
        name: 'ค้นหา (Discover)',
        color: '#85FFD4',
        features: ['ค้นหาด้วย Keyword', 'Filter ตามแนว/อารมณ์', 'AI แนะนำส่วนตัว'],
      },
      {
        emoji: '✍️',
        name: 'เขียนนิยาย (Write)',
        color: '#fbbf24',
        features: ['Editor เขียนบทได้เลย', 'AI ช่วยสร้าง Content', 'ตั้งราคา Premium Chapter'],
      },
      {
        emoji: '👥',
        name: 'ชุมชน (Community)',
        color: '#34d399',
        features: ['โพสต์รีวิว/ถกเถียง', 'Follow นักอ่านคนอื่น', 'Book Clubs กลุ่มอ่านร่วม'],
      },
      {
        emoji: '📚',
        name: 'ห้องสมุด (Library)',
        color: '#60a5fa',
        features: ['บันทึกรายการอ่าน', 'ติดตาม Progress', 'จัดการ Bookmark'],
      },
      {
        emoji: '💰',
        name: 'ระบบ Coin',
        color: '#fbbf24',
        features: ['ซื้อบทพรีเมียม', 'Daily reward', 'รับ Coin จากการเขียน'],
      },
      {
        emoji: '👤',
        name: 'โปรไฟล์ (Profile)',
        color: '#FF85C2',
        features: ['สถิติการอ่าน', 'ผลงานนิยาย', 'ติดตาม/ผู้ติดตาม'],
      },
    ],
    gradient: 'from-[#FF85C2] to-[#c084fc]',
    bg: 'from-slate-950 to-purple-950',
  },
  {
    id: 12,
    type: 'cta',
    title: 'เริ่มต้นการอ่านที่ดีกว่า',
    subtitle: 'เข้าร่วม BookMatch AI วันนี้\nพบคู่อ่านและนิยายที่ใช่สำหรับคุณ',
    emoji: '🚀',
    gradient: 'from-[#FF85C2] via-[#c084fc] to-[#85FFD4]',
    bg: 'from-slate-950 via-purple-950 to-slate-900',
  },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 600 : -600, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -600 : 600, opacity: 0 }),
};

export default function Presentation() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [exporting, setExporting] = useState(false);
  const presentRef = useRef(null);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const prev = () => current > 0 && goTo(current - 1);
  const next = () => current < slides.length - 1 && goTo(current + 1);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });

      // Create an off-screen container for rendering each slide
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;height:540px;overflow:hidden;z-index:-1;';
      document.body.appendChild(container);

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        // Build a plain static HTML version of the slide with inline styles
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `width:960px;height:540px;display:flex;align-items:center;justify-content:center;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;`;
        wrapper.setAttribute('data-slide-id', s.id);

        // Resolve gradient to actual colors for background
        const bgColors = {
          'from-slate-950 via-purple-950 to-slate-900': '#0b0a1a, #1e0a3c, #0f172a',
          'from-slate-950 to-slate-900': '#0b0a1a, #0f172a',
          'from-slate-950 to-purple-950': '#0b0a1a, #1e0a3c',
          'from-slate-950 to-pink-950': '#0b0a1a, #2d0a1a',
          'from-slate-950 to-blue-950': '#0b0a1a, #0a0a2d',
          'from-slate-950 to-orange-950': '#0b0a1a, #1a0d00',
        };
        const bg = bgColors[s.bg] || '#0b0a1a, #0f172a';
        wrapper.style.background = `linear-gradient(135deg, ${bg})`;

        // Render slide content as plain HTML strings
        wrapper.innerHTML = getStaticSlideHTML(s);
        container.appendChild(wrapper);

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(container, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#0b0a1a',
          width: 960,
          height: 540,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 960, 540);
      }

      document.body.removeChild(container);
      pdf.save('BookMatch-AI-Presentation.pdf');
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  // Returns static HTML string for a slide (no Tailwind, inline styles only)
  const getStaticSlideHTML = (s) => {
    const gradientMap = {
      'from-[#FF85C2] via-[#c084fc] to-[#85FFD4]': 'linear-gradient(135deg,#FF85C2,#c084fc,#85FFD4)',
      'from-rose-500 to-orange-500': 'linear-gradient(135deg,#f43f5e,#f97316)',
      'from-[#FF85C2] to-[#85FFD4]': 'linear-gradient(135deg,#FF85C2,#85FFD4)',
      'from-pink-500 to-rose-500': 'linear-gradient(135deg,#ec4899,#f43f5e)',
      'from-cyan-500 to-blue-500': 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      'from-yellow-500 to-orange-500': 'linear-gradient(135deg,#eab308,#f97316)',
      'from-[#FF85C2] to-[#c084fc]': 'linear-gradient(135deg,#FF85C2,#c084fc)',
    };
    const grad = gradientMap[s.gradient] || 'linear-gradient(135deg,#FF85C2,#85FFD4)';
    const textGrad = (text) => `<span style="background:${grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${text}</span>`;

    if (s.type === 'cover') return `
      <div style="text-align:center;">
        <div style="font-size:80px;margin-bottom:16px;">${s.emoji}</div>
        <h1 style="font-size:64px;font-weight:900;margin:0 0 12px;">${textGrad(s.title)}</h1>
        <p style="font-size:20px;color:rgba(255,255,255,0.7);white-space:pre-line;">${s.subtitle}</p>
      </div>`;

    if (s.type === 'problem') return `
      <div style="width:100%;">
        <h2 style="font-size:40px;font-weight:900;text-align:center;margin:0 0 32px;">${textGrad(s.title)}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${s.points.map(p => `
            <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:20px;">
              <span style="font-size:32px;">${p.icon}</span>
              <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;">${p.text}</p>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'solution') return `
      <div style="width:100%;text-align:center;">
        <h2 style="font-size:40px;font-weight:900;margin:0 0 8px;">${textGrad(s.title)}</h2>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 32px;font-size:14px;">${s.subtitle}</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${s.features.map(f => `
            <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:8px;">
              <div style="font-size:28px;">⭐</div>
              <p style="font-weight:700;color:#fff;font-size:14px;margin:0;">${f.label}</p>
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">${f.desc}</p>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'feature-detail') return `
      <div style="text-align:center;">
        <div style="font-size:64px;margin-bottom:16px;">${s.emoji}</div>
        <h2 style="font-size:40px;font-weight:900;margin:0 0 12px;">${textGrad(s.title)}</h2>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 32px;white-space:pre-line;font-size:14px;">${s.subtitle}</p>
        <div style="display:flex;justify-content:center;gap:24px;">
          ${s.stats.map(st => `
            <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:24px 40px;">
              <div style="font-size:32px;font-weight:900;color:#fff;margin-bottom:4px;">${st.value}</div>
              <div style="color:rgba(255,255,255,0.5);font-size:12px;">${st.label}</div>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'features-grid') return `
      <div style="width:100%;">
        <h2 style="font-size:40px;font-weight:900;text-align:center;margin:0 0 24px;">${textGrad(s.title)}</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          ${s.items.map(item => `
            <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:18px;">
              <div style="font-size:24px;">✨</div>
              <div>
                <p style="font-weight:700;color:#fff;font-size:14px;margin:0;">${item.label}</p>
                <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">${item.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'app-preview') return `
      <div style="width:100%;display:flex;gap:40px;align-items:center;">
        <div style="flex-shrink:0;">
          <div style="width:160px;height:290px;border-radius:24px;border:3px solid rgba(255,255,255,0.2);overflow:hidden;background:#0f172a;box-shadow:0 0 40px ${s.color}44;">
            <div style="background:#1e293b;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:rgba(255,255,255,0.5);font-size:8px;">9:41</span>
            </div>
            <div style="padding:10px;height:100%;">
              ${s.screenId === 'home' ? `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                  <div style="width:20px;height:20px;border-radius:50%;background:${s.color};opacity:0.8;"></div>
                  <span style="color:#fff;font-size:9px;font-weight:700;">BookMatch AI</span>
                </div>
                <div style="background:${s.color}33;border-radius:10px;padding:8px;margin-bottom:6px;">
                  <div style="width:60%;height:6px;background:${s.color};border-radius:4px;margin-bottom:4px;"></div>
                  <div style="width:80%;height:6px;background:rgba(255,255,255,0.2);border-radius:4px;"></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">
                  ${[1,2,3,4].map(_ => `<div style="background:rgba(255,255,255,0.07);border-radius:8px;height:40px;"></div>`).join('')}
                </div>
                <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
              ` : s.screenId === 'matching' ? `
                <div style="text-align:center;padding:6px 0;">
                  <div style="font-size:20px;margin-bottom:4px;">💘</div>
                  <div style="width:70%;height:5px;background:${s.color};border-radius:4px;margin:0 auto 8px;"></div>
                </div>
                <div style="background:${s.color}22;border-radius:10px;padding:8px;margin-bottom:6px;display:flex;gap:6px;align-items:center;">
                  <div style="width:30px;height:42px;background:rgba(255,255,255,0.15);border-radius:6px;"></div>
                  <div>
                    <div style="width:60px;height:5px;background:rgba(255,255,255,0.5);border-radius:4px;margin-bottom:3px;"></div>
                    <div style="width:40px;height:4px;background:rgba(255,255,255,0.2);border-radius:4px;"></div>
                  </div>
                </div>
                <div style="text-align:center;">
                  <div style="display:inline-block;padding:5px 14px;border-radius:20px;background:${s.color};color:#1a1033;font-size:8px;font-weight:700;">หาคู่อ่าน ❤️</div>
                </div>
              ` : `
                <div style="background:#1e1b4b;padding:8px;border-radius:8px;height:85%;">
                  <div style="width:80%;height:4px;background:rgba(255,255,255,0.15);border-radius:4px;margin-bottom:4px;"></div>
                  <div style="width:95%;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-bottom:4px;"></div>
                  <div style="width:70%;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-bottom:4px;"></div>
                  <div style="width:90%;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-bottom:4px;"></div>
                  <div style="width:60%;height:4px;background:${s.color};border-radius:4px;margin-bottom:4px;opacity:0.6;"></div>
                  <div style="width:85%;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
                </div>
              `}
            </div>
          </div>
        </div>
        <div style="flex:1;">
          <h2 style="font-size:28px;font-weight:900;margin:0 0 8px;">${textGrad(s.title)}</h2>
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 20px;">${s.subtitle}</p>
          ${s.highlights.map(h => `
            <div style="display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px;margin-bottom:8px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${s.color};margin-top:3px;flex-shrink:0;"></div>
              <div>
                <p style="font-weight:700;color:#fff;font-size:12px;margin:0;">${h.label}</p>
                <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">${h.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'page-tour') return `
      <div style="width:100%;">
        <h2 style="font-size:32px;font-weight:900;text-align:center;margin:0 0 4px;">${textGrad(s.title)}</h2>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;text-align:center;margin:0 0 20px;">${s.subtitle}</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          ${s.pages.map(p => `
            <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-top:3px solid ${p.color};border-radius:16px;padding:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span style="font-size:22px;">${p.emoji}</span>
                <span style="font-weight:700;color:#fff;font-size:13px;">${p.name}</span>
              </div>
              <ul style="list-style:none;padding:0;margin:0;">
                ${p.features.map(f => `<li style="color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:4px;"><span style="color:${p.color};">▸</span> ${f}</li>`).join('')}
              </ul>
            </div>`).join('')}
        </div>
      </div>`;

    if (s.type === 'cta') return `
      <div style="text-align:center;">
        <div style="font-size:80px;margin-bottom:20px;">${s.emoji}</div>
        <h2 style="font-size:52px;font-weight:900;margin:0 0 16px;">${textGrad(s.title)}</h2>
        <p style="color:rgba(255,255,255,0.7);font-size:18px;white-space:pre-line;margin:0 0 32px;">${s.subtitle}</p>
        <div style="display:inline-block;padding:14px 40px;border-radius:999px;background:${grad};color:#1a1033;font-weight:900;font-size:20px;">BookMatch AI ✨</div>
      </div>`;

    return '';
  };

  const slide = slides[current];

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={presentRef}
    >
      {/* Top bar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <a href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
          <X className="w-4 h-4" /> ปิด
        </a>
        <span className="text-xs text-muted-foreground">{current + 1} / {slides.length}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={exportPDF}
          disabled={exporting}
          className="gap-2 text-xs"
        >
          <Download className="w-3 h-3" />
          {exporting ? 'กำลัง Export...' : 'Export PDF'}
        </Button>
      </div>

      {/* Slide */}
      <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 0 60px hsl(330 100% 72% / 0.2)' }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            id="slide-content"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-center p-10 overflow-hidden`}
          >
            {/* Background decoration */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-5`} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
              style={{ background: 'hsl(330 100% 72%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10"
              style={{ background: 'hsl(160 80% 60%)' }} />

            <SlideContent slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-3 opacity-50">กด ← → หรือคลิกลูกศรเพื่อเปลี่ยนสไลด์</p>
    </div>
  );
}

function SlideContent({ slide }) {
  if (slide.type === 'cover') return (
    <div className="relative z-10 text-center">
      <div className="text-7xl mb-4 kawaii-bounce inline-block">{slide.emoji}</div>
      <h1 className={`text-6xl font-black mb-3 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h1>
      <p className="text-xl text-white/70 whitespace-pre-line leading-relaxed">{slide.subtitle}</p>
    </div>
  );

  if (slide.type === 'problem') return (
    <div className="relative z-10 w-full">
      <h2 className={`text-4xl font-black mb-8 text-center bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {slide.points.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <span className="text-3xl">{p.icon}</span>
            <p className="text-white/80 text-sm leading-snug">{p.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.type === 'solution') return (
    <div className="relative z-10 w-full text-center">
      <h2 className={`text-4xl font-black mb-2 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <p className="text-white/60 mb-8 text-sm">{slide.subtitle}</p>
      <div className="grid grid-cols-4 gap-4">
        {slide.features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center gap-2"
            >
              <Icon className={`w-8 h-8 ${f.color}`} />
              <p className="font-bold text-white text-sm">{f.label}</p>
              <p className="text-white/50 text-xs">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  if (slide.type === 'feature-detail') return (
    <div className="relative z-10 text-center">
      <div className="text-6xl mb-4">{slide.emoji}</div>
      <h2 className={`text-4xl font-black mb-3 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <p className="text-white/60 mb-8 whitespace-pre-line text-sm leading-relaxed">{slide.subtitle}</p>
      <div className="flex justify-center gap-8">
        {slide.stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="bg-white/5 rounded-2xl px-8 py-5 border border-white/10"
          >
            <div className="text-3xl font-black text-white mb-1">{s.value}</div>
            <div className="text-white/50 text-xs">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.type === 'features-grid') return (
    <div className="relative z-10 w-full">
      <h2 className={`text-4xl font-black mb-6 text-center bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {slide.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <Icon className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">{item.label}</p>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  if (slide.type === 'app-preview') return (
    <div className="relative z-10 w-full flex gap-8 items-center">
      {/* Phone mockup */}
      <div className="shrink-0">
        <div className="w-44 h-80 rounded-3xl border-4 border-white/20 overflow-hidden bg-slate-900 shadow-2xl relative"
          style={{ boxShadow: `0 0 40px ${slide.color}44` }}>
          {/* Status bar */}
          <div className="bg-slate-800 px-3 py-1.5 flex justify-between items-center">
            <span className="text-white/60 text-[8px]">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm"/>
              <div className="w-1 h-1.5 bg-white/40 rounded-sm"/>
            </div>
          </div>
          <PhoneMockupScreen screenId={slide.screenId} color={slide.color} />
        </div>
      </div>
      {/* Description */}
      <div className="flex-1">
        <h2 className={`text-3xl font-black mb-2 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
          {slide.title}
        </h2>
        <p className="text-white/50 text-sm mb-6">{slide.subtitle}</p>
        <div className="space-y-3">
          {slide.highlights.map((h, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: slide.color }} />
              <div>
                <p className="font-bold text-white text-sm">{h.label}</p>
                <p className="text-white/50 text-xs">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  if (slide.type === 'page-tour') return (
    <div className="relative z-10 w-full">
      <h2 className={`text-3xl font-black mb-1 text-center bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <p className="text-white/50 text-xs text-center mb-5">{slide.subtitle}</p>
      <div className="grid grid-cols-3 gap-3">
        {slide.pages.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
            style={{ borderTop: `3px solid ${p.color}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-bold text-white text-sm">{p.name}</span>
            </div>
            <ul className="space-y-1">
              {p.features.map((f, j) => (
                <li key={j} className="text-white/60 text-xs flex items-start gap-1.5">
                  <span style={{ color: p.color }} className="mt-0.5 shrink-0">▸</span>
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.type === 'cta') return (
    <div className="relative z-10 text-center">
      <div className="text-7xl mb-5 kawaii-bounce inline-block">{slide.emoji}</div>
      <h2 className={`text-5xl font-black mb-4 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
        {slide.title}
      </h2>
      <p className="text-white/70 text-lg whitespace-pre-line leading-relaxed mb-8">{slide.subtitle}</p>
      <div className={`inline-block px-8 py-3 rounded-full bg-gradient-to-r ${slide.gradient} text-slate-900 font-black text-lg shadow-lg`}>
        BookMatch AI ✨
      </div>
    </div>
  );

  return null;
}