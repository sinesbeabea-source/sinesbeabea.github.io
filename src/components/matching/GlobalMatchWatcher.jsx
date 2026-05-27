import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence } from 'framer-motion';
import MatchChatPopup from './MatchChatPopup';

/**
 * Runs globally (in AppLayout) — polls every 5s to detect
 * when the current user has been mutually matched (status=accepted)
 * and opens the chat popup automatically.
 */
export default function GlobalMatchWatcher() {
  const { user } = useAuth();
  const [chatPopup, setChatPopup] = useState(null); // { matchId, buddyEmail, bookTitle }
  const seenMatchIds = useRef(new Set());

  useEffect(() => {
    if (!user?.email) return;

    const check = async () => {
      // Find my matches that just became accepted and I haven't shown popup for yet
      const accepted = await base44.entities.ReaderMatch.filter({
        user_email: user.email,
        status: 'accepted',
      });
      for (const m of accepted) {
        if (!seenMatchIds.current.has(m.id)) {
          seenMatchIds.current.add(m.id);
          // Only open if not already showing a popup
          setChatPopup(prev => prev ? prev : {
            matchId: m.id,
            buddyEmail: m.matched_email,
            bookTitle: m.book_title,
          });
        }
      }
    };

    // Run immediately, then every 5s
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

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