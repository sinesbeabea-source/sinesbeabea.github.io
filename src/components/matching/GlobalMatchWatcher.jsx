import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import MatchChatPopup from './MatchChatPopup';
import { MessageCircleHeart } from 'lucide-react';

/**
 * Polls every 4s for newly accepted matches (popup_opened=false).
 * Marks popup_opened=true once shown so it won't re-trigger.
 * Also watches if active match gets ended by buddy → closes popup.
 * Supports minimizing to a floating bubble instead of fully closing.
 */
export default function GlobalMatchWatcher() {
  const { user } = useAuth();
  const [chatPopup, setChatPopup] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const chatPopupRef = useRef(null);
  const processingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    chatPopupRef.current = chatPopup;
  }, [chatPopup]);

  useEffect(() => {
    if (!user?.email) return;

    const check = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const current = chatPopupRef.current;

        // 1) If we have an active match (full or minimized), watch if buddy ended it
        if (current) {
          const matches = await base44.entities.ReaderMatch.filter({
            user_email: user.email,
            matched_email: current.buddyEmail,
          });
          const live = matches.find(m => m.id === current.matchId);
          if (!live || live.status === 'ended' || live.status === 'rejected') {
            setChatPopup(null);
            setMinimized(false);
          }
          return; // don't look for new matches while one is active
        }

        // 2) Look for newly accepted match not yet shown as popup
        const accepted = await base44.entities.ReaderMatch.filter({
          user_email: user.email,
          status: 'accepted',
          popup_opened: false,
        });
        if (accepted.length > 0) {
          const m = accepted[0];
          await base44.entities.ReaderMatch.update(m.id, { popup_opened: true });
          setChatPopup({
            matchId: m.id,
            buddyEmail: m.matched_email,
            bookTitle: m.book_title,
          });
          setMinimized(false);
          return;
        }

        // 3) Also re-open if there's an accepted+popup_opened match that we lost track of
        //    (e.g. page refresh while popup was open)
        const openMatch = await base44.entities.ReaderMatch.filter({
          user_email: user.email,
          status: 'accepted',
          popup_opened: true,
        });
        if (openMatch.length > 0) {
          const m = openMatch[0];
          setChatPopup({
            matchId: m.id,
            buddyEmail: m.matched_email,
            bookTitle: m.book_title,
          });
          setMinimized(true); // restore minimized so it doesn't jump in their face
        }
      } finally {
        processingRef.current = false;
      }
    };

    check();
    const interval = setInterval(check, 4000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const handleMinimize = () => setMinimized(true);
  const handleEnded = () => { setChatPopup(null); setMinimized(false); };

  return (
    <>
      {/* Full chat popup */}
      <AnimatePresence>
        {chatPopup && !minimized && (
          <MatchChatPopup
            matchId={chatPopup.matchId}
            buddyEmail={chatPopup.buddyEmail}
            bookTitle={chatPopup.bookTitle}
            onClose={handleMinimize}
            onEnded={handleEnded}
          />
        )}
      </AnimatePresence>

      {/* Minimized floating bubble */}
      <AnimatePresence>
        {chatPopup && minimized && (
          <motion.button
            key="match-bubble"
            initial={{ scale: 0, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={() => setMinimized(false)}
            className="fixed bottom-20 right-4 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-primary shadow-lg neon-glow flex items-center justify-center group"
            title={`แชทกับ ${chatPopup.buddyEmail?.split('@')[0]}`}
          >
            {/* Avatar letter */}
            <span className="text-white font-bold text-lg leading-none">
              {chatPopup.buddyEmail?.[0]?.toUpperCase()}
            </span>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            {/* Chat icon badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow">
              <MessageCircleHeart className="w-3 h-3 text-accent-foreground" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}