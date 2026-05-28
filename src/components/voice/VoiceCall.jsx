import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * VoiceCall — WebRTC-based voice call between two matched users.
 * Props:
 *   matchId      — ID of the ReaderMatch record owned by current user
 *   buddyEmail   — email of the other person
 *   callStatus   — 'calling' | 'in_call' | 'idle'
 *   isIncoming   — bool: did the buddy initiate?
 *   onEnd        — callback when call ends
 */
export default function VoiceCall({ matchId, buddyEmail, callStatus, isIncoming, onEnd }) {
  const { user } = useAuth();
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('connecting'); // connecting | active | failed

  // WebRTC refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(new Audio());
  const signalPollRef = useRef(null);

  /* ── Timer ── */
  useEffect(() => {
    if (callStatus !== 'in_call') return;
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ── WebRTC Setup ── */
  useEffect(() => {
    if (callStatus !== 'in_call') return;
    startWebRTC();
    return () => cleanup();
  }, [callStatus]);

  const startWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
        setStatus('active');
      };

      // Collect ICE and batch into signaling
      const iceCandidates = [];
      pc.onicecandidate = (e) => { if (e.candidate) iceCandidates.push(e.candidate); };

      if (!isIncoming) {
        // Offer side
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await storeSignal('offer', { sdp: offer, ice: [] });

        // Poll for answer
        pollSignal('answer', async (data) => {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of (data.ice || [])) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          // Push our ICE
          await storeSignal('offer', { sdp: offer, ice: iceCandidates });
        });
      } else {
        // Answer side — poll for offer
        pollSignal('offer', async (data) => {
          if (pc.signalingState !== 'stable') return;
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of (data.ice || [])) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await storeSignal('answer', { sdp: answer, ice: iceCandidates });
        });
      }

      setStatus('active');
    } catch (err) {
      console.error('WebRTC error:', err);
      setStatus('failed');
    }
  };

  // Store SDP/ICE in match record using a simple JSON string field
  const signalKey = (type) => {
    const sorted = [user?.email, buddyEmail].sort().join('_');
    return `${sorted}_${type}`;
  };

  const storeSignal = async (type, data) => {
    await base44.entities.ReaderMatch.update(matchId, {
      [`sync_chapter_title`]: JSON.stringify({ _sig_type: type, _sig_key: signalKey(type), ...data }),
    });
  };

  const pollSignal = (type, callback) => {
    let seen = null;
    const poll = async () => {
      try {
        const records = await base44.entities.ReaderMatch.filter({
          user_email: buddyEmail,
          matched_email: user?.email,
        });
        const rec = records?.[0];
        if (!rec) return;
        let parsed;
        try { parsed = JSON.parse(rec.sync_chapter_title || 'null'); } catch { return; }
        if (!parsed || parsed._sig_type !== type) return;
        const key = JSON.stringify(parsed);
        if (key === seen) return;
        seen = key;
        clearInterval(signalPollRef.current);
        await callback(parsed);
      } catch {}
    };
    signalPollRef.current = setInterval(poll, 2000);
  };

  const cleanup = () => {
    clearInterval(signalPollRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    remoteAudioRef.current.srcObject = null;
  };

  /* ── Mute ── */
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  };

  /* ── Accept / Reject ── */
  const acceptCall = async () => {
    await base44.entities.ReaderMatch.update(matchId, { call_status: 'in_call' });
    const reverse = await base44.entities.ReaderMatch.filter({ user_email: buddyEmail, matched_email: user?.email });
    for (const r of reverse) await base44.entities.ReaderMatch.update(r.id, { call_status: 'in_call' });
  };

  const rejectCall = async () => {
    await base44.entities.ReaderMatch.update(matchId, { call_status: 'idle', call_initiated_by: null });
    const reverse = await base44.entities.ReaderMatch.filter({ user_email: buddyEmail, matched_email: user?.email });
    for (const r of reverse) await base44.entities.ReaderMatch.update(r.id, { call_status: 'idle', call_initiated_by: null });
    cleanup();
    onEnd();
  };

  const endCall = async () => {
    await base44.entities.ReaderMatch.update(matchId, { call_status: 'idle', call_initiated_by: null });
    const reverse = await base44.entities.ReaderMatch.filter({ user_email: buddyEmail, matched_email: user?.email });
    for (const r of reverse) await base44.entities.ReaderMatch.update(r.id, { call_status: 'idle', call_initiated_by: null });
    cleanup();
    onEnd();
  };

  const label =
    callStatus === 'in_call'
      ? fmt(duration)
      : isIncoming
      ? 'โทรเข้า... 📞'
      : 'กำลังโทร... 📡';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 bg-gradient-to-b from-slate-900/95 to-background/95 rounded-t-3xl sm:rounded-2xl flex flex-col items-center justify-center z-20 backdrop-blur-sm"
    >
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg"
        style={{ boxShadow: '0 0 48px hsl(330 100% 72% / 0.4)' }}
      >
        <span className="text-4xl font-bold text-white">{buddyEmail?.[0]?.toUpperCase()}</span>
      </div>

      <p className="font-bold text-xl mb-1">{buddyEmail?.split('@')[0]}</p>
      <div className="flex items-center gap-2 mb-10 text-sm text-muted-foreground">
        {callStatus === 'in_call' && status === 'connecting' && (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        <span>{label}</span>
      </div>

      {status === 'failed' && (
        <p className="text-destructive text-xs mb-4">ไม่สามารถเชื่อมต่อเสียงได้ — กรุณาอนุญาตไมค์</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6">
        {/* Incoming: show accept */}
        {isIncoming && callStatus === 'calling' && (
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-400 transition-all active:scale-90"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        )}

        {/* Mute — only during active call */}
        {callStatus === 'in_call' && (
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow transition-all active:scale-90 ${
              muted ? 'bg-destructive/80' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
        )}

        {/* End / reject */}
        <button
          onClick={callStatus === 'in_call' ? endCall : rejectCall}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-400 transition-all active:scale-90"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>

      {callStatus === 'in_call' && (
        <p className="text-xs text-muted-foreground mt-8 opacity-50">
          {muted ? '🔇 ปิดไมค์อยู่' : '🎤 ไมค์เปิดอยู่'}
        </p>
      )}
    </motion.div>
  );
}