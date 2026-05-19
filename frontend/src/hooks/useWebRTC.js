/**
 * useWebRTC.js — NEXUS WebRTC Hook
 * Handles: multi-peer mesh, data channels (chat/whiteboard/files), screen share, mic/cam toggle
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

/**
 * @param {{ roomId: string, user: object }} options
 */
export function useWebRTC({ roomId, user }) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]); // Array<{ id, stream, displayName }>
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);

  const socketRef    = useRef(null);
  const peersRef     = useRef({});   // { socketId: RTCPeerConnection }
  const dataChannels = useRef({});   // { socketId: RTCDataChannel }
  const localRef     = useRef(null); // local MediaStream ref
  const screenRef    = useRef(null); // screen share stream ref

  /* ── Helper: create & register peer ── */
  const createPeer = useCallback((targetId, initiator) => {
    if (peersRef.current[targetId]) return peersRef.current[targetId];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // ICE
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { target: targetId, candidate });
      }
    };

    // Remote track → update peers state
    pc.ontrack = ({ streams }) => {
      setPeers(prev => {
        const existing = prev.find(p => p.id === targetId);
        if (existing) {
          return prev.map(p => p.id === targetId ? { ...p, stream: streams[0] } : p);
        }
        return [...prev, { id: targetId, stream: streams[0], displayName: targetId.slice(0, 6) }];
      });
    };

    // Add local tracks
    if (localRef.current) {
      localRef.current.getTracks().forEach(t => pc.addTrack(t, localRef.current));
    }

    // Data channel
    if (initiator) {
      const dc = pc.createDataChannel('nexus');
      setupDataChannel(dc, targetId);
      dataChannels.current[targetId] = dc;

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('offer', { target: targetId, offer: pc.localDescription });
        } catch (e) { console.error('onnegotiationneeded', e); }
      };
    } else {
      pc.ondatachannel = ({ channel }) => {
        setupDataChannel(channel, targetId);
        dataChannels.current[targetId] = channel;
      };
    }

    peersRef.current[targetId] = pc;
    return pc;
  }, []);

  /* ── Data channel setup ── */
  function setupDataChannel(channel, peerId) {
    channel.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'chat') setMessages(prev => [...prev, msg.payload]);
        if (msg.type === 'file') setFiles(prev => [...prev, msg.payload]);
        if (msg.type === 'whiteboard') {
          window.dispatchEvent(new CustomEvent('wb:draw', { detail: msg.payload }));
        }
      } catch {}
    };
  }

  /* ── Socket + Media setup ── */
  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem('nexus_token');
    socketRef.current = io(SOCKET_URL, { auth: { token } });
    const socket = socketRef.current;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localRef.current = stream;
        setLocalStream(stream);

        socket.emit('join-room', { roomId, displayName: user?.displayName || user?.username || 'Guest' });

        // Existing users in the room
        socket.on('room-users', (users) => {
          users.forEach(({ id: uid }) => {
            const pc = createPeer(uid, true);
            if (!peersRef.current[uid]) peersRef.current[uid] = pc;
            setPeers(prev => prev.find(p => p.id === uid) ? prev : [...prev, { id: uid, stream: null }]);
          });
        });

        // New user joined
        socket.on('user-connected', ({ userId, displayName: dn }) => {
          setPeers(prev => prev.find(p => p.id === userId) ? prev : [...prev, { id: userId, stream: null, displayName: dn || userId.slice(0, 6) }]);
          createPeer(userId, true);
        });

        // Offer received
        socket.on('offer', async ({ caller, offer, displayName: dn }) => {
          let pc = peersRef.current[caller];
          if (!pc) {
            pc = createPeer(caller, false);
            setPeers(prev => prev.find(p => p.id === caller) ? prev : [...prev, { id: caller, stream: null, displayName: dn || caller.slice(0, 6) }]);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { target: caller, answer: pc.localDescription });
        });

        // Answer received
        socket.on('answer', async ({ callee, answer }) => {
          const pc = peersRef.current[callee];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // ICE candidate
        socket.on('ice-candidate', async ({ peer: pid, candidate }) => {
          const pc = peersRef.current[pid];
          if (pc && candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
          }
        });

        // User left
        socket.on('user-disconnected', (userId) => {
          peersRef.current[userId]?.close();
          delete peersRef.current[userId];
          delete dataChannels.current[userId];
          setPeers(prev => prev.filter(p => p.id !== userId));
        });

      } catch (err) {
        console.error('useWebRTC init error:', err);
      }
    }

    init();

    return () => {
      socket.disconnect();
      localRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current?.getTracks().forEach(t => t.stop());
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      dataChannels.current = {};
    };
  }, [roomId, user, createPeer]);

  /* ── Controls ── */
  const toggleMic = useCallback(() => {
    localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const toggleCamera = useCallback(() => {
    localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const startScreenShare = useCallback(async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const track = screenStream.getVideoTracks()[0];
    screenRef.current = screenStream;

    Object.values(peersRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      sender?.replaceTrack(track);
    });

    const merged = new MediaStream([track, ...localRef.current.getAudioTracks()]);
    setLocalStream(merged);

    track.onended = () => stopScreenShare();
  }, []);

  const stopScreenShare = useCallback(() => {
    screenRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current = null;
    const cameraTrack = localRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(cameraTrack);
      });
    }
    setLocalStream(localRef.current);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect();
    localRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peersRef.current).forEach(pc => pc.close());
  }, []);

  /* ── Chat & Files ── */
  const sendMessage = useCallback((text) => {
    const msg = {
      text,
      sender: user?.displayName || user?.username || 'You',
      time: Date.now(),
    };
    setMessages(prev => [...prev, { ...msg, self: true }]);
    Object.values(dataChannels.current).forEach(dc => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify({ type: 'chat', payload: msg }));
      }
    });
  }, [user]);

  const sendFile = useCallback((file) => {
    const url = URL.createObjectURL(file);
    const payload = {
      name: file.name,
      size: file.size,
      url,
      sender: user?.displayName || user?.username || 'You',
    };
    setFiles(prev => [...prev, payload]);
    Object.values(dataChannels.current).forEach(dc => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify({ type: 'file', payload }));
      }
    });
  }, [user]);

  const broadcastWhiteboard = useCallback((data) => {
    Object.values(dataChannels.current).forEach(dc => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify({ type: 'whiteboard', payload: data }));
      }
    });
  }, []);

  return {
    localStream,
    peers,
    messages,
    files,
    sendMessage,
    sendFile,
    broadcastWhiteboard,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
  };
}
