import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';

export default function TTSButton({ text, onClick }) {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการอ่านออกเสียง');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Strip HTML tags
    const plain = text?.replace(/<[^>]*>/g, '') || '';
    if (!plain.trim()) return;

    const utter = new SpeechSynthesisUtterance(plain);
    utter.lang = 'th-TH';
    utter.rate = 0.9;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;

    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? 'หยุดอ่าน' : 'ฟังเสียงอ่าน'}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border ${
        speaking
          ? 'bg-accent/20 border-accent/50 text-accent animate-pulse'
          : 'bg-muted/60 border-border/40 text-muted-foreground hover:text-accent hover:bg-accent/10'
      }`}
    >
      {speaking ? <Square className="w-3.5 h-3.5 fill-accent" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}