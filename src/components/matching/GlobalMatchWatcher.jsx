import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import MatchChatPopup from './MatchChatPopup';
import { MessageCircleHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Polls every 4s for newly accepted matches (popup_opened=false).
 * Marks popup_opened=true once shown so it won't re-trigger.
 * Also watches if active match gets ended by buddy → closes popup.
 * Supports minimizing to a floating bubble instead of fully closing.
 */
export default function GlobalMatchWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatPopup, setChatPopup] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const chatPopupRef = useRef(null);
  const processingRef = useRef(false);
  const lastSyncRef = useRef(null);

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

        // Single query: fetch all my accepted matches
        const allAccepted = await base44.entities.ReaderMatch.filter({
          user_email: user.email,
          status: 'accepted',
        });

        // 1) If we have an active popup, verify it's still alive
        if (current) {
          const live = allAccepted.find(m => m.id === current.matchId);
          if (!live) {
            setChatPopup(null);
            setMinimized(false);
          }
          return;
        }

        // 2) New match not yet shown
        const newMatch = allAccepted.find(m => !m.popup_opened);
        if (newMatch) {
          await base44.entities.ReaderMatch.update(newMatch.id, { popup_opened: true });
          setChatPopup({ matchId: newMatch.id, buddyEmail: newMatch.matched_email, bookTitle: newMatch.book_title });
          setMinimized(false);
          return;
        }

        // 3) Check for sync_active — buddy wants to read together
        const syncMatch = allAccepted.find(m => m.sync_active && m.sync_chapter_id);
        if (syncMatch && lastSyncRef.current !== syncMatch.sync_chapter_id) {
          lastSyncRef.current = syncMatch.sync_chapter_id;
          navigate(`/read/${syncMatch.sync_book_id}/${syncMatch.sync_chapter_id}`);
          return;
        }

        // 4) Restore popup after page refresh
        const existing = allAccepted.find(m => m.popup_opened);
        if (existing) {
          setChatPopup({ matchId: existing.id, buddyEmail: existing.matched_email, bookTitle: existing.book_title });
          setMinimized(true);
        }
      } catch (err) {
        // Silently ignore rate limit errors — next interval will retry
        if (!err?.message?.includes('Rate limit')) {
          console.error('GlobalMatchWatcher error:', err);
        }
      } finally {
        processingRef.current = false;
      }
    };

    check();
    const interval = setInterval(check, 60000);
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