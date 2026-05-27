import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Users, Hash } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import GroupChat from '@/components/chat/GroupChat';
import MatchChatPanel from '@/components/chat/MatchChatPanel';

export default function Chat() {
  const location = useLocation();
  const defaultTab = location.state?.tab || 'group';
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Tab Bar */}
      <div className="flex border-b border-border/30 shrink-0">
        <button
          onClick={() => setTab('group')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
            tab === 'group' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>แชทห้อง</span>
          {tab === 'group' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setTab('match')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
            tab === 'match' ? 'text-rose-400' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className={`w-4 h-4 ${tab === 'match' ? 'fill-rose-400' : ''}`} />
          <span>แมทช์แชท</span>
          {tab === 'match' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Panel */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'group' ? (
            <motion.div key="group" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full">
              <GroupChat />
            </motion.div>
          ) : (
            <motion.div key="match" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="h-full">
              <MatchChatPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}