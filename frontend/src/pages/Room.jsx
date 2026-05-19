import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { useWebRTC } from '../hooks/useWebRTC';
import './Room.css';

const PANEL_CHAT  = 'chat';
const PANEL_BOARD = 'whiteboard';
const PANEL_FILES = 'files';

export default function Room() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activePanel,    setActivePanel]    = useState(null);
  const [isMicMuted,     setIsMicMuted]     = useState(false);
  const [isCamOff,       setIsCamOff]       = useState(false);
  const [isScreenSharing,setIsScreenSharing]= useState(false);

  const {
    localStream, peers,
    toggleMic, toggleCamera,
    startScreenShare, stopScreenShare,
    leaveRoom, sendFile, files,
    messages, sendMessage, broadcastWhiteboard,
  } = useWebRTC({ roomId, user });

  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleMic = useCallback(() => {
    toggleMic(); setIsMicMuted(v => !v);
  }, [toggleMic]);

  const handleToggleCam = useCallback(() => {
    toggleCamera(); setIsCamOff(v => !v);
  }, [toggleCamera]);

  const handleScreenShare = useCallback(async () => {
    if (isScreenSharing) { stopScreenShare(); setIsScreenSharing(false); }
    else { await startScreenShare(); setIsScreenSharing(true); }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const handleLeave = useCallback(() => {
    leaveRoom(); navigate('/lobby');
  }, [leaveRoom, navigate]);

  const togglePanel = (panel) => setActivePanel(p => p === panel ? null : panel);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) sendFile(f);
  };

  const displayName = user?.displayName || user?.username || 'You';

  return (
    <div className="room-page" onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}>

      {/* ── Header ── */}
      <header className="room-header">
        <div className="room-header-left">
          <div className="room-logo">
            <div className="room-logo-mark">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <span className="room-logo-name">NEXUS</span>
          </div>
          <div className="room-info">
            <div className="room-id-badge">
              <span className="material-symbols-outlined">lock</span>
              {roomId}
            </div>
            <span className="chip chip--ready">
              <span className="chip-dot chip-dot--cyan" />
              Encrypted
            </span>
          </div>
        </div>
        <div className="room-header-right">
          <span className="room-peer-count">
            <span className="material-symbols-outlined">group</span>
            {peers.length + 1} online
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="room-body">

        {/* Video area */}
        <div className="room-video-area">
          <div className={`video-grid video-grid--${Math.min(peers.length + 1, 4)}`}>
            {/* Local */}
            <div className="video-tile video-tile--local">
              <video ref={localVideoRef} autoPlay muted playsInline
                className={`video-el ${isCamOff ? 'video-el--off' : ''}`} />
              {isCamOff && (
                <div className="video-off-placeholder">
                  <span className="material-symbols-outlined">videocam_off</span>
                </div>
              )}
              <div className="video-label">
                <span className="material-symbols-outlined">{isMicMuted ? 'mic_off' : 'mic'}</span>
                {displayName} (You)
              </div>
              {isMicMuted && (
                <div className="video-mute-badge">
                  <span className="material-symbols-outlined">mic_off</span>
                </div>
              )}
            </div>

            {/* Remote peers */}
            {peers.map(peer => <PeerTile key={peer.id} peer={peer} />)}
          </div>

          {/* Controls pill */}
          <div className="room-controls">
            <div className="controls-group">
              <ControlBtn icon={isMicMuted ? 'mic_off' : 'mic'}
                label={isMicMuted ? 'Unmute' : 'Mute'}
                active={!isMicMuted} onClick={handleToggleMic} />
              <ControlBtn icon={isCamOff ? 'videocam_off' : 'videocam'}
                label={isCamOff ? 'Start Video' : 'Stop Video'}
                active={!isCamOff} onClick={handleToggleCam} />
              <ControlBtn icon={isScreenSharing ? 'stop_screen_share' : 'present_to_all'}
                label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
                active={isScreenSharing} onClick={handleScreenShare} />
            </div>

            <div className="controls-divider" />

            <div className="controls-group">
              <ControlBtn icon="chat" label="Chat"
                active={activePanel === PANEL_CHAT}
                onClick={() => togglePanel(PANEL_CHAT)} />
              <ControlBtn icon="draw" label="Whiteboard"
                active={activePanel === PANEL_BOARD}
                onClick={() => togglePanel(PANEL_BOARD)} />
              <ControlBtn icon="attach_file" label="Files"
                active={activePanel === PANEL_FILES}
                onClick={() => togglePanel(PANEL_FILES)} />
            </div>

            <div className="controls-divider" />

            <button className="btn-icon danger controls-end" onClick={handleLeave} title="Leave">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call_end</span>
            </button>
          </div>
        </div>

        {/* Side panel */}
        {activePanel && (
          <div className="room-panel">
            <div className="panel-header">
              <span className="panel-title">
                {activePanel === PANEL_CHAT  ? 'Chat'       :
                 activePanel === PANEL_BOARD ? 'Whiteboard' : 'Files'}
              </span>
              <button className="panel-close" onClick={() => setActivePanel(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>close</span>
              </button>
            </div>
            <div className="panel-body">
              {activePanel === PANEL_CHAT  && <Chat roomId={roomId} user={user} messages={messages} sendMessage={sendMessage} />}
              {activePanel === PANEL_BOARD && <Whiteboard roomId={roomId} broadcastWhiteboard={broadcastWhiteboard} />}
              {activePanel === PANEL_FILES && <FilesPanel files={files} onSend={sendFile} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PeerTile({ peer }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && peer.stream) videoRef.current.srcObject = peer.stream;
  }, [peer.stream]);
  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline className="video-el" />
      {!peer.stream && (
        <div className="video-off-placeholder">
          <span className="material-symbols-outlined">person</span>
        </div>
      )}
      <div className="video-label">
        <span className="material-symbols-outlined">mic</span>
        {peer.displayName || peer.id.slice(0, 6)}
      </div>
    </div>
  );
}

function ControlBtn({ icon, label, active, onClick }) {
  return (
    <button className={`btn-icon ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{icon}</span>
    </button>
  );
}

function FilesPanel({ files, onSend }) {
  const fileInputRef = useRef(null);
  return (
    <div className="files-panel">
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
        Send File
      </button>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onSend(e.target.files[0])} />
      <p className="files-hint">Or drag & drop anywhere in the room</p>
      {files.length === 0 ? (
        <div className="files-empty">
          <span className="material-symbols-outlined">folder_open</span>
          <p>No files shared yet</p>
        </div>
      ) : (
        <div className="files-list">
          {files.map((f, i) => (
            <a key={i} className="file-item" href={f.url} download={f.name} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>description</span>
              <div className="file-info">
                <p className="file-name">{f.name}</p>
                <p className="file-size">{f.sender}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--t4)' }}>download</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
