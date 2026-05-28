import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Highlighter, Trash2, StickyNote } from 'lucide-react';

const COLORS = {
  yellow: { bg: 'rgba(250,204,21,0.35)', border: '#fbbf24', btn: 'bg-yellow-400' },
  pink:   { bg: 'rgba(244,114,182,0.35)', border: '#f472b6', btn: 'bg-pink-400' },
  green:  { bg: 'rgba(52,211,153,0.35)', border: '#34d399', btn: 'bg-emerald-400' },
  blue:   { bg: 'rgba(96,165,250,0.35)', border: '#60a5fa', btn: 'bg-blue-400' },
};

export default function HighlightLayer({ user, bookId, chapterId, children }) {
  const queryClient = useQueryClient();
  const [popup, setPopup] = useState(null); // { x, y, text, start, end }
  const [noteText, setNoteText] = useState('');
  const [showNote, setShowNote] = useState(false);
  const contentRef = useRef(null);

  const { data: highlights } = useQuery({
    queryKey: ['highlights', user?.email, chapterId],
    queryFn: () => base44.entities.Highlight.filter({ user_email: user?.email, chapter_id: chapterId }),
    enabled: !!user && !!chapterId,
    initialData: [],
  });

  const handleMouseUp = () => {
    if (!user) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.toString().trim().length < 3) {
      setPopup(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopup({
      x: rect.left + rect.width / 2,
      y: rect.top - 10 + window.scrollY,
      text: sel.toString().trim(),
    });
    setNoteText('');
    setShowNote(false);
  };

  const saveHighlight = async (color) => {
    if (!popup) return;
    await base44.entities.Highlight.create({
      user_email: user.email,
      book_id: bookId,
      chapter_id: chapterId,
      selected_text: popup.text,
      color,
      note: noteText,
    });
    queryClient.invalidateQueries({ queryKey: ['highlights', user?.email, chapterId] });
    setPopup(null);
    window.getSelection()?.removeAllRanges();
  };

  const deleteHighlight = async (id) => {
    await base44.entities.Highlight.delete(id);
    queryClient.invalidateQueries({ queryKey: ['highlights', user?.email, chapterId] });
  };

  return (
    <div className="relative" ref={contentRef}>
      {/* Selection popup */}
      {popup && (
        <div
          className="fixed z-[200] glass border border-border/60 rounded-2xl p-2 shadow-2xl flex flex-col gap-2"
          style={{ left: Math.min(popup.x - 80, window.innerWidth - 180), top: popup.y - 70 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ไฮไลต์</span>
            <div className="flex gap-1 ml-1">
              {Object.entries(COLORS).map(([color, val]) => (
                <button key={color} onClick={() => saveHighlight(color)}
                  className={`w-5 h-5 rounded-full ${val.btn} hover:scale-110 transition-transform border-2 border-white/20`} />
              ))}
            </div>
            <button onClick={() => setShowNote(v => !v)}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ml-1 hover:bg-primary/20">
              <StickyNote className="w-3 h-3" />
            </button>
            <button onClick={() => setPopup(null)}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {showNote && (
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs bg-muted/60 rounded-lg px-2 py-1 outline-none border border-border/40"
                placeholder="เพิ่มโน้ต..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div onMouseUp={handleMouseUp} className="select-text">
        {children}
      </div>

      {/* Highlights panel */}
      {highlights.length > 0 && (
        <div className="mt-8 border-t border-border/30 pt-6">
          <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Highlighter className="w-4 h-4" /> ไฮไลต์ของคุณ ({highlights.length})
          </p>
          <div className="space-y-2">
            {highlights.map(h => (
              <div key={h.id} className="flex items-start gap-2 group">
                <div className="flex-1 text-sm p-2 rounded-lg" style={{ background: COLORS[h.color]?.bg || COLORS.yellow.bg, borderLeft: `3px solid ${COLORS[h.color]?.border || '#fbbf24'}` }}>
                  <p className="line-clamp-2">"{h.selected_text}"</p>
                  {h.note && <p className="text-xs text-muted-foreground mt-1 italic">📝 {h.note}</p>}
                </div>
                <button onClick={() => deleteHighlight(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}