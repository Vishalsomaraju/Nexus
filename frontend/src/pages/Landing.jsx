import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  { icon: 'videocam',           title: 'Multi-User Video',       desc: 'Crystal-clear HD video with adaptive bitrate for any connection.' },
  { icon: 'lock',               title: 'End-to-End Encrypted',   desc: 'Every packet secured with DTLS-SRTP. No exceptions.' },
  { icon: 'draw',               title: 'Collaborative Canvas',   desc: 'Real-time whiteboard synced across every participant instantly.' },
  { icon: 'present_to_all',     title: 'Screen Sharing',         desc: 'Share your full screen, a window, or a single browser tab.' },
  { icon: 'folder_open',        title: 'File Transfer',          desc: 'Peer-to-peer file sharing with no server in the middle.' },
  { icon: 'chat_bubble',        title: 'In-Room Chat',           desc: 'Persistent encrypted chat that stays in your session.' },
];

const TERMINAL_LINES = [
  { type: 'cmd',  prompt: '›', text: 'nexus init --secure --region=auto' },
  { type: 'out',  cls: 'info', text: 'Initializing secure channel...' },
  { type: 'out',  cls: 'ok',   text: '✓  DTLS handshake complete' },
  { type: 'out',  cls: 'ok',   text: '✓  ICE candidates gathered (4)' },
  { type: 'out',  cls: 'ok',   text: '✓  Peer connection established' },
  { type: 'cmd',  prompt: '›', text: 'nexus status' },
  { type: 'out',  cls: 'info', text: 'Latency: 12ms · Jitter: 1ms · Packet loss: 0%' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [visibleLines, setVisibleLines] = useState(0);

  /* Typewriter terminal effect */
  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) return;
    const t = setTimeout(() => setVisibleLines(v => v + 1), visibleLines === 0 ? 400 : 420);
    return () => clearTimeout(t);
  }, [visibleLines]);

  /* Scroll reveal for feature cards */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.feature-card').forEach(el => {
      el.classList.add('reveal-item');
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing-page">

      {/* ── NAV ── */}
      <nav className="landing-nav glass-panel">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-mark">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <span className="brand-name">NEXUS</span>
          </div>
          <div className="nav-right">
            <button className="nav-link" onClick={() => navigate('/auth')}>Sign in</button>
            <button className="btn btn-primary hero-cta-primary" onClick={() => navigate('/auth')}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Protocol online — v2.4.1
          </div>

          <h1 className="hero-title">
            Communication built for<br />
            <span className="hero-title-accent">teams that move fast.</span>
          </h1>

          <p className="hero-sub">
            Encrypted video meetings, collaborative whiteboards, and
            instant file sharing — all in one private workspace.
          </p>

          <div className="hero-cta-row">
            <button className="btn btn-primary hero-cta-primary" onClick={() => navigate('/auth')}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>rocket_launch</span>
              Start a meeting
            </button>
            <button className="btn btn-ghost hero-cta-secondary" onClick={() => navigate('/auth')}>
              Sign in
            </button>
          </div>
        </div>

        {/* Terminal Mockup */}
        <div className="hero-terminal">
          <div className="terminal-bar">
            <div className="terminal-dots">
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="terminal-dot" />
            </div>
            <span className="terminal-title">nexus — secure channel</span>
          </div>
          <div className="terminal-body">
            {TERMINAL_LINES.slice(0, visibleLines).map((line, i) =>
              line.type === 'cmd' ? (
                <div key={i} className="terminal-line">
                  <span className="terminal-prompt">{line.prompt}</span>
                  <span className="terminal-cmd">{line.text}</span>
                </div>
              ) : (
                <div key={i} className={`terminal-out ${line.cls}`}>{line.text}</div>
              )
            )}
            {visibleLines >= TERMINAL_LINES.length && (
              <div className="terminal-line">
                <span className="terminal-prompt">›</span>
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">12ms</div>
            <div className="stat-label">Avg. latency</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">E2E</div>
            <div className="stat-label">Encrypted</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">∞</div>
            <div className="stat-label">Participants</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <p className="section-eyebrow">What's included</p>
        <h2 className="section-title">Everything you need, nothing you don't.</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon-wrap">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to start?</h2>
        <p className="cta-sub">No account needed for guests. Create a room in seconds.</p>
        <button className="btn btn-primary" style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }} onClick={() => navigate('/auth')}>
          Create free account
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-mark" style={{ width: 22, height: 22 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>hub</span>
            </div>
            <span className="footer-brand-name">NEXUS</span>
          </div>
          <p className="footer-copy">© 2025 Nexus Systems. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .reveal-item {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .reveal-item.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
