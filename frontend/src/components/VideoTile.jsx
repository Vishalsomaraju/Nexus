import React, { useRef, useEffect } from 'react';

function VideoTile({ stream, isLocal, username }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', aspectRatio: '16/9' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={isLocal} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.6)',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        backdropFilter: 'blur(4px)'
      }}>
        {username} {isLocal && '(You)'}
      </div>
    </div>
  );
}

export default VideoTile;
