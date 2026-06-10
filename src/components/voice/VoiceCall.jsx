import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Phone, Loader2, Volume2, VolumeX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * VoiceCall — WebRTC-based voice call between two matched users.
 * Signaling is done via a dedicated ChatMessage record (room_id = matchSignal_<sorted>)
 * so it never collides with actual entity fields.
 */
export default function VoiceCall({ matchId, buddyEmail, callStatus, isIncoming, onEnd }) {
  const { user } = useAuth();
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('connecting');

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pollRef = useRef(null);
  const audioRef = useRef(null); // DOM <audio> element via ref

  /* ── Timer ── */
  useEffect(() => {
    if (callStatus !== 'in_call') return;
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ── WebRTC ── */
  useEffect(() => {
    if (callStatus !== 'in_call') return;
    startWebRTC();
    return () => cleanup();
  }, [callStatus]);

  // Signal room key: deterministic from both emails
  const sigRoom = () => {
    const sorted = [user?.email, buddyEmail].sort().join('__');
    return `matchSignal_${sorted}`;
  };

  const storeSignal = async (type, payload) => {
    await base44.entities.ChatMessage.create({
      room_id: sigRoom(),
      sender_email: user?.email,
      sender_name: type,
      content: JSON.stringify(payload),
      message_type: 'system',
    });
  };

  // Poll for a specific signal type from the buddy (not from ourselves)
  const pollSignal = (type, callback) => {
    let handled = false;
    const poll = async () => {
      if (handled) return;
      try {
        const msgs = await base44.entities.ChatMessage.filter({ room_id: sigRoom() });
        // Only signals from the other person
        const found = msgs.find(m => m.sender_name === type && m.sender_email !== user?.email);
        if (found) {
          let parsed;
          try { parsed = JSON.parse(found.content); } catch { return; }
          handled = true;
          clearInterval(pollRef.current);
          await callback(parsed);
        }
      } catch {}
    };
    pollRef.current = setInterval(poll, 1000);
    poll();
  };

  const startWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
          audioRef.current.play().catch(console.warn);
        }
        setStatus('active');
      };

      pc.oniceconnectionstatechange = () => {
        if (['connected', 'completed'].includes(pc.iceConnectionState)) setStatus('active');
        if (['failed', 'disconnected'].includes(pc.iceConnectionState)) setStatus('failed');
      };

      // Collect ICE candidates incrementally
      const iceCandidates = [];
      pc.onicecandidate = (e) => {
        if (e.candidate) iceCandidates.push(e.candidate.toJSON());
      };

      if (!isIncoming) {
        // ── Caller ──
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);

        // Wait for ICE to finish (max 4s)
        await new Promise(resolve => {
          const t = setTimeout(resolve, 4000);
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
          };
        });

        await storeSignal('offer', { sdp: pc.localDescription, ice: iceCandidates });

        // Poll for answer + remote ICE
        pollSignal('answer', async (data) => {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of (data.ice || [])) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        });

      } else {
        // ── Callee ──
        pollSignal('offer', async (data) => {
          if (pc.signalingState !== 'stable') return;
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of (data.ice || [])) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // Wait for ICE before sending answer
          await new Promise(resolve => {
            const t = setTimeout(resolve, 4000);
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
            };
            if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
          });

          await storeSignal('answer', { sdp: pc.localDescription, ice: iceCandidates });
        });
      }

    } catch (err) {
      console.error('WebRTC error:', err);
      setStatus('failed');
    }
  };

  const cleanup = () => {
    clearInterval(pollRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  };

  /* ── Mute mic ── */
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  /* ── Speaker ── */
  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.muted = !speakerOff;
    }
    setSpeakerOff(s => !s);
  };

  /* ── Call controls ── */
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
    // Cleanup signal messages
    try {
      const sigs = await base44.entities.ChatMessage.filter({ room_id: sigRoom() });
      for (const s of sigs) await base44.entities.ChatMessage.delete(s.id);
    } catch {}
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
      {/* Hidden audio element — must be in DOM for autoplay to work */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Avatar */}
      <div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg"
        style={{ boxShadow: '0 0 48px hsl(330 100% 72% / 0.4)' }}
      >
        <span className="text-4xl font-bold text-white">{buddyEmail?.[0]?.toUpperCase()}</span>
      </div>

      <p className="font-bold text-xl mb-1">{buddyEmail?.split('@')[0]}</p>
      <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
        {callStatus === 'in_call' && status === 'connecting' && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>{label}</span>
      </div>

      {status === 'failed' && (
        <p className="text-destructive text-xs mb-4 text-center px-4">
          ❌ ไม่สามารถเชื่อมต่อเสียงได้ — กรุณาอนุญาตไมค์
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-5">
        {/* Accept (incoming only) */}
        {isIncoming && callStatus === 'calling' && (
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-400 transition-all active:scale-90"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        )}

        {/* Mute mic */}
        {callStatus === 'in_call' && (
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow transition-all active:scale-90 ${
              muted ? 'bg-destructive/80' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={muted ? 'เปิดไมค์' : 'ปิดไมค์'}
          >
            {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
        )}

        {/* Speaker */}
        {callStatus === 'in_call' && (
          <button
            onClick={toggleSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow transition-all active:scale-90 ${
              speakerOff ? 'bg-amber-600/80' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={speakerOff ? 'เปิดลำโพง' : 'ปิดลำโพง'}
          >
            {speakerOff ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
          </button>
        )}

        {/* End / Reject */}
        <button
          onClick={callStatus === 'in_call' ? endCall : rejectCall}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-400 transition-all active:scale-90"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Status hints */}
      {callStatus === 'in_call' && (
        <div className="flex gap-4 mt-6 text-xs text-muted-foreground">
          <span>{muted ? '🔇 ปิดไมค์' : '🎤 เปิดไมค์'}</span>
          <span>{speakerOff ? '🔕 ปิดลำโพง' : '🔊 เปิดลำโพง'}</span>
        </div>
      )}
    </motion.div>
  );
}