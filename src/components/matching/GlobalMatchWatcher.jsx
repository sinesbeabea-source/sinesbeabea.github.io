import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence } from 'framer-motion';
import MatchChatPopup from './MatchChatPopup';

/**
 * Polls every 5s for newly accepted matches (popup_opened=false).
 * Marks popup_opened=true once shown so it won't re-trigger.
 * Also watches if active match gets ended by buddy → closes popup.
 */
export default function GlobalMatchWatcher() {
  const { user } = useAuth();
  const [chatPopup, setChatPopup] = useState(null);
  const chatPopupRef = useRef(null); // mirror state in ref to avoid stale closure
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

        // 1) If popup is open, watch if buddy ended the match
        if (current) {
          const matches = await base44.entities.ReaderMatch.filter({
            user_email: user.email,
            matched_email: current.buddyEmail,
          });
          const live = matches.find(m => m.id === current.matchId);
          if (!live || live.status === 'ended' || live.status === 'rejected') {
            setChatPopup(null);
          }
          return;
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
        }
      } finally {
        processingRef.current = false;
      }
    };

    check();
    const interval = setInterval(check, 4000);
    return () => clearInterval(interval);
  }, [user?.email]); // ← no chatPopup dep, use ref instead

  return (
    <AnimatePresence>
      {chatPopup && (
        <MatchChatPopup
          matchId={chatPopup.matchId}
          buddyEmail={chatPopup.buddyEmail}
          bookTitle={chatPopup.bookTitle}
          onClose={() => setChatPopup(null)}
          onEnded={() => setChatPopup(null)}
        />
      )}
    </AnimatePresence>
  );
}