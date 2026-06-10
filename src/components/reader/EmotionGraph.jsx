import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// Emotion → color mapping
const EMOTION_COLORS = {
  joy:       { line: '#f9a8d4', fill: '#f9a8d430', label: '😊 ปีติ',     bg: 'from-rose-500/20 to-pink-400/10' },
  sadness:   { line: '#93c5fd', fill: '#93c5fd30', label: '😢 เศร้า',    bg: 'from-blue-500/20 to-indigo-400/10' },
  fear:      { line: '#a78bfa', fill: '#a78bfa30', label: '😨 กลัว',     bg: 'from-purple-600/20 to-violet-400/10' },
  anger:     { line: '#f87171', fill: '#f8717130', label: '😠 โกรธ',     bg: 'from-red-500/20 to-orange-400/10' },
  surprise:  { line: '#fbbf24', fill: '#fbbf2430', label: '😲 ตื่นเต้น', bg: 'from-yellow-400/20 to-amber-300/10' },
  romance:   { line: '#fb7185', fill: '#fb718530', label: '💕 โรแมนติก', bg: 'from-pink-500/20 to-rose-300/10' },
  tension:   { line: '#34d399', fill: '#34d39930', label: '⚡ เครียด',   bg: 'from-emerald-500/20 to-teal-400/10' },
  mystery:   { line: '#818cf8', fill: '#818cf830', label: '🔮 ลึกลับ',   bg: 'from-indigo-500/20 to-purple-400/10' },
  neutral:   { line: '#94a3b8', fill: '#94a3b830', label: '😐 เป็นกลาง', bg: 'from-slate-400/20 to-slate-300/10' },
};

// Strip HTML tags
const stripHtml = (html) => html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';

// Split text into N chunks
const splitChunks = (text, n = 8) => {
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const size = Math.max(1, Math.floor(words.length / n));
  const chunks = [];
  for (let i = 0; i < n; i++) {
    chunks.push(words.slice(i * size, (i + 1) * size).join(' '));
  }
  return chunks.filter(c => c.length > 0);
};

// Analyze emotion of each chunk via LLM
const analyzeEmotion = async (chunks) => {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `วิเคราะห์อารมณ์ในแต่ละชิ้นส่วนของข้อความนิยายภาษาไทยต่อไปนี้ ตอบเป็น JSON array เท่านั้น ไม่ต้องอธิบายเพิ่มเติม

ตัวเลือกอารมณ์: joy, sadness, fear, anger, surprise, romance, tension, mystery, neutral

สำหรับแต่ละชิ้นส่วนให้ตอบ: {"emotion": "<emotion>", "intensity": <0.1-1.0>}

ชิ้นส่วนทั้งหมด:
${chunks.map((c, i) => `[${i + 1}] ${c.slice(0, 200)}`).join('\n')}

ตอบเป็น JSON array เท่านั้น เช่น: [{"emotion":"joy","intensity":0.8},...]`,
    response_json_schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          emotion: { type: 'string' },
          intensity: { type: 'number' },
        },
      },
    },
  });
  return res;
};

export default function EmotionGraph({ chapterId, content }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState('neutral');
  const analyzeRef = useRef(null);

  useEffect(() => {
    if (!content || !chapterId) return;

    // Debounce: cancel if chapter changes before analysis finishes
    clearTimeout(analyzeRef.current);
    analyzeRef.current = setTimeout(async () => {
      setLoading(true);
      setData([]);
      try {
        const plain = stripHtml(content);
        if (plain.length < 50) { setLoading(false); return; }

        const chunks = splitChunks(plain, 8);
        const results = await analyzeEmotion(chunks);

        const parsed = Array.isArray(results) ? results : [];
        const chartData = parsed.map((item, i) => ({
          name: `ช่วง ${i + 1}`,
          intensity: Math.round((item.intensity || 0.5) * 100),
          emotion: item.emotion || 'neutral',
          label: EMOTION_COLORS[item.emotion]?.label || item.emotion,
        }));

        setData(chartData);

        // Find dominant emotion
        const freq = {};
        chartData.forEach(d => { freq[d.emotion] = (freq[d.emotion] || 0) + d.intensity; });
        const dom = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        setDominantEmotion(dom);
      } catch (e) {
        console.error('EmotionGraph error:', e);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(analyzeRef.current);
  }, [chapterId, content]);

  const emotion = EMOTION_COLORS[dominantEmotion] || EMOTION_COLORS.neutral;

  // Current reading position emotion (last data point highlighted)
  const currentEmotion = data.length > 0 ? EMOTION_COLORS[data[data.length - 1].emotion] || EMOTION_COLORS.neutral : emotion;

  if (!content || data.length === 0 && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3`}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`rounded-2xl border border-white/10 bg-gradient-to-br ${currentEmotion.bg} backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-700`}
        style={{ boxShadow: `0 4px 32px ${currentEmotion.line}40` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: currentEmotion.line }} />
            <span className="text-xs font-semibold text-white/80">วิเคราะห์อารมณ์บท</span>
            {!loading && data.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: currentEmotion.line + '30', color: currentEmotion.line }}
              >
                {currentEmotion.label}
              </span>
            )}
            {loading && <Loader2 className="w-3 h-3 animate-spin text-white/50" />}
          </div>
          <button className="text-white/40 hover:text-white/70 transition-colors">
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Chart */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 110, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center h-[110px]">
                  <div className="text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" style={{ color: currentEmotion.line }} />
                    <p className="text-[10px] text-white/40">กำลังวิเคราะห์อารมณ์...</p>
                  </div>
                </div>
              ) : (
                <div className="px-2 pb-2">
                  <ResponsiveContainer width="100%" height={90}>
                    <AreaChart data={data} margin={{ top: 5, right: 8, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="emotionGrad" x1="0" y1="0" x2="1" y2="0">
                          {data.map((d, i) => {
                            const c = EMOTION_COLORS[d.emotion] || EMOTION_COLORS.neutral;
                            return (
                              <stop
                                key={i}
                                offset={`${(i / Math.max(data.length - 1, 1)) * 100}%`}
                                stopColor={c.line}
                                stopOpacity={0.9}
                              />
                            );
                          })}
                        </linearGradient>
                        <linearGradient id="emotionFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={currentEmotion.line} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={currentEmotion.line} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#ffffff50' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#ffffff40' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: `1px solid ${currentEmotion.line}50`,
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#fff',
                          padding: '6px 10px',
                        }}
                        formatter={(val, _, props) => [
                          `${val}% · ${EMOTION_COLORS[props.payload?.emotion]?.label || props.payload?.emotion}`,
                          'ความเข้มข้น'
                        ]}
                        labelStyle={{ color: '#ffffff80', marginBottom: 2 }}
                        cursor={{ stroke: currentEmotion.line + '60', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="monotoneX"
                        dataKey="intensity"
                        stroke="url(#emotionGrad)"
                        strokeWidth={2}
                        fill="url(#emotionFill)"
                        dot={(props) => {
                          const c = EMOTION_COLORS[props.payload?.emotion] || EMOTION_COLORS.neutral;
                          return (
                            <circle
                              key={props.key}
                              cx={props.cx}
                              cy={props.cy}
                              r={3}
                              fill={c.line}
                              stroke="#000"
                              strokeWidth={1}
                            />
                          );
                        }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}