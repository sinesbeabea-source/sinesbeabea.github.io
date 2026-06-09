import React from 'react';

export default function PhoneMockupScreen({ screenId, color }) {
  if (screenId === 'home') return (
    <div className="p-2 space-y-2 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-4 h-4 rounded-full shrink-0" style={{ background: color, opacity: 0.8 }} />
        <span className="text-white text-[8px] font-bold">BookMatch AI</span>
      </div>
      <div className="rounded-lg p-2" style={{ background: `${color}33` }}>
        <div className="w-16 h-2 rounded mb-1" style={{ background: color }} />
        <div className="w-20 h-1.5 rounded bg-white/20" />
      </div>
      <p className="text-white/40 text-[7px]">Trending Now</p>
      <div className="grid grid-cols-2 gap-1">
        {[color, '#85FFD4', '#c084fc', '#60a5fa'].map((c, i) => (
          <div key={i} className="h-12 rounded-lg" style={{ background: `${c}30`, border: `1px solid ${c}40` }} />
        ))}
      </div>
      <div className="rounded-full py-1 text-center text-[7px] font-bold"
        style={{ background: color, color: '#1a1033' }}>
        💘 หาคู่อ่าน
      </div>
    </div>
  );

  if (screenId === 'matching') return (
    <div className="p-2 flex flex-col items-center space-y-2 overflow-hidden">
      <div className="text-2xl">💘</div>
      <div className="w-16 h-1.5 rounded" style={{ background: color }} />
      <p className="text-white/50 text-[7px]">กำลังอ่านอยู่</p>
      <div className="w-full rounded-lg p-1.5 flex gap-1.5 items-center" style={{ background: `${color}22` }}>
        <div className="w-8 h-10 rounded-md" style={{ background: `${color}60` }} />
        <div className="flex-1">
          <div className="w-full h-1.5 rounded bg-white/50 mb-1" />
          <div className="w-3/4 h-1 rounded bg-white/20" />
        </div>
      </div>
      <div className="rounded-full px-4 py-1 text-[7px] font-bold"
        style={{ background: color, color: '#1a1033' }}>
        ❤️ หาคู่เลย
      </div>
      <div className="w-full rounded-lg p-1.5 bg-white/5 border border-white/10 flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full" style={{ background: '#c084fc' }} />
        <div className="flex-1">
          <div className="w-12 h-1.5 rounded bg-white/40 mb-0.5" />
          <div className="w-8 h-1 rounded bg-white/20" />
        </div>
        <div className="text-[6px]" style={{ color }}>💬</div>
      </div>
    </div>
  );

  if (screenId === 'reader') return (
    <div className="h-full bg-indigo-950 p-2 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="w-8 h-1.5 rounded bg-white/30" />
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-white/10" />
          <div className="w-3 h-3 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {[90, 100, 75, 100, 85, 60, 100, 90, 70].map((w, i) => (
          <div key={i} className="h-1.5 rounded"
            style={{ width: `${w}%`, background: i === 4 ? color : 'rgba(255,255,255,0.3)', opacity: i === 4 ? 1 : 0.3 }} />
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        <div className="flex-1 h-5 rounded bg-white/5 border border-white/10" />
        <div className="w-5 h-5 rounded flex items-center justify-center text-[8px]"
          style={{ background: color }}>🔊</div>
      </div>
    </div>
  );

  return null;
}