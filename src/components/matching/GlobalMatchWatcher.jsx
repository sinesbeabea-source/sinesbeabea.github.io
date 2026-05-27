import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence } from 'framer-motion';
import MatchChatPopup from './MatchChatPopup';

/**
 * Polls every 5s for newly accepted matches (popup_opened=false).
 * Marks popup_opened=true once shown so it won't re-trigger.
 */
export default function GlobalMatchWatcher() {
  const { user } = useAuth();
  const [chatPopup, setChatPopup] = useState(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!user?.email) return;

    const check = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const accepted = await base44.entities.ReaderMatch.filter({
          user_email: user.email,
          status: 'accepted',
          popup_opened: false,
        });
        if (accepted.length > 0 && !chatPopup) {
          const m = accepted[0];
          // Mark as popup shown before opening to prevent double-open
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
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [user?.email, chatPopup]);

  return (
    <AnimatePresence>
      {chatPopup && (
        <MatchChatPopup
          matchId={chatPopup.matchId}
          buddyEmail={chatPopup.buddyEmail}
          bookTitle={chatPopup.bookTitle}
          onClose={() => setChatPopup(null)}
        />
      )}
    </AnimatePresence>
  );
}