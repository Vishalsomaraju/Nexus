import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Lobby.css';

const MEETINGS = [
  { id: 'qns-224', title: 'Quantum Neural Sync',   time: '14:00 UTC', status: 'ready' },
  { id: 'gpr-448', title: 'Global Protocol Review', time: '16:30 UTC', status: 'active' },
];

const QUICK_ACCESS = [
  { icon: 'terminal',     label: 'System Log' },
  { icon: 'folder_lock',  label: 'Secure Files' },
  { icon: 'hub',          label: 'Neural Uplink' },
  { icon: 'account_tree', label: 'Network Map' },
];

const NAV_ITEMS = [
  { icon: 'home',      label: 'Home' },
  { icon: 'videocam',  label: 'Meetings' },
  { icon: 'contacts',  label: 'Contacts' },
  { icon: 'settings',  label: 'Settings' },
];

// --- Sub-components for Views ---

function HomeView({ user, roomId, setRoomId, handleCreate, handleJoin, navigate }) {
  return (
    <main className="lobby-main">
      <header className="lobby-header">
        <div>
          <p className="lobby-greeting-label">workspace</p>
          <h1 className="lobby-greeting">
            Good to see you, <span className="name">{user?.displayName || user?.username || 'User'}</span>
          </h1>
        </div>
        <span className="chip chip--ready">
          <span className="chip-dot chip-dot--cyan" />
          All systems nominal
        </span>
      </header>

      <section className="lobby-new-meeting">
        <div className="new-meeting-info">
          <div className="new-meeting-icon">
            <span className="material-symbols-outlined">video_call</span>
          </div>
          <div>
            <h2 className="new-meeting-title">Start a secure meeting</h2>
            <p className="new-meeting-sub">End-to-end encrypted · WebRTC · No limits</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          New Meeting
        </button>
      </section>

      <section className="lobby-join">
        <form className="join-form" onSubmit={handleJoin}>
          <div className="join-input-wrap">
            <span className="material-symbols-outlined join-input-icon">meeting_room</span>
            <input
              className="input-field join-input"
              type="text"
              placeholder="Enter Room ID…"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" type="submit">Join</button>
        </form>
      </section>

      <section className="lobby-section">
        <h2 className="lobby-section-title">
          <span className="material-symbols-outlined">event</span>
          Scheduled
        </h2>
        <div className="meetings-list">
          {MEETINGS.map((m) => (
            <div
              key={m.id}
              className="meeting-card"
              onClick={() => navigate(`/room/${m.id}`)}
            >
              <div className="meeting-card-left">
                <div className="meeting-card-icon">
                  <span className="material-symbols-outlined">videocam</span>
                </div>
                <div>
                  <p className="meeting-title">{m.title}</p>
                  <p className="meeting-time">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                    {m.time}
                  </p>
                </div>
              </div>
              <div className="meeting-card-right">
                <span className={`chip ${m.status === 'ready' ? 'chip--ready' : 'chip--active'}`}>
                  <span className={`chip-dot ${m.status === 'ready' ? 'chip-dot--cyan' : 'chip-dot--purple'}`} />
                  {m.status === 'ready' ? 'Ready' : 'Live'}
                </span>
                <span className="material-symbols-outlined meeting-arrow">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lobby-section">
        <h2 className="lobby-section-title">
          <span className="material-symbols-outlined">grid_view</span>
          Quick access
        </h2>
        <div className="quick-grid">
          {QUICK_ACCESS.map((item) => (
            <button key={item.label} className="quick-card">
              <span className="material-symbols-outlined quick-card-icon">{item.icon}</span>
              <span className="quick-card-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function MeetingsView({ navigate, handleCreate }) {
  // Expanded list of meetings for the dedicated view
  const allMeetings = [
    ...MEETINGS,
    { id: 'nxt-901', title: 'Security Audit Q3', time: 'Tomorrow, 09:00 UTC', status: 'upcoming' },
    { id: 'zen-112', title: 'Project Zenith Sync', time: 'Friday, 15:00 UTC', status: 'upcoming' },
  ];

  return (
    <main className="lobby-main view-meetings">
      <header className="lobby-header">
        <div>
          <h1 className="lobby-greeting">Meetings</h1>
          <p className="lobby-greeting-label" style={{ marginTop: '4px' }}>Manage your schedule and secure rooms</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Schedule
        </button>
      </header>

      <section className="lobby-section">
        <div className="meetings-list expanded-meetings">
          {allMeetings.map((m) => (
            <div
              key={m.id}
              className="meeting-card"
              onClick={() => navigate(`/room/${m.id}`)}
            >
              <div className="meeting-card-left">
                <div className="meeting-card-icon">
                  <span className="material-symbols-outlined">videocam</span>
                </div>
                <div>
                  <p className="meeting-title">{m.title}</p>
                  <p className="meeting-time">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                    {m.time}
                  </p>
                </div>
              </div>
              <div className="meeting-card-right">
                <span className={`chip ${m.status === 'ready' ? 'chip--ready' : m.status === 'active' ? 'chip--active' : 'chip--upcoming'}`}>
                  {m.status !== 'upcoming' && (
                    <span className={`chip-dot ${m.status === 'ready' ? 'chip-dot--cyan' : 'chip-dot--purple'}`} />
                  )}
                  {m.status === 'ready' ? 'Ready' : m.status === 'active' ? 'Live' : 'Upcoming'}
                </span>
                <span className="material-symbols-outlined meeting-arrow">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ContactsView({ token }) {
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContacts(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="lobby-main view-contacts">
      <header className="lobby-header">
        <div>
          <h1 className="lobby-greeting">Contacts</h1>
          <p className="lobby-greeting-label" style={{ marginTop: '4px' }}>Your secure network</p>
        </div>
        <div className="search-bar">
          <span className="material-symbols-outlined search-icon">search</span>
          <input type="text" className="input-field" placeholder="Search contacts..." />
        </div>
      </header>

      <section className="lobby-section">
        {loading ? (
          <p className="loading-text">Decrypting contact directory...</p>
        ) : (
          <div className="contacts-grid">
            {contacts.map(c => (
              <div key={c.id} className="contact-card">
                <div className="contact-avatar">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <p className="contact-name">{c.username}</p>
                  <p className="contact-status">
                    <span className="status-dot"></span> Offline
                  </p>
                </div>
                <div className="contact-actions">
                  <button className="btn-icon" title="Secure Call">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <button className="btn-icon" title="Encrypted Message">
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="loading-text">No contacts found.</p>}
          </div>
        )}
      </section>
    </main>
  );
}

function SettingsView({ user }) {
  return (
    <main className="lobby-main view-settings">
      <header className="lobby-header">
        <div>
          <h1 className="lobby-greeting">Settings</h1>
          <p className="lobby-greeting-label" style={{ marginTop: '4px' }}>System configuration</p>
        </div>
      </header>

      <section className="lobby-section settings-section">
        <h2 className="lobby-section-title">
          <span className="material-symbols-outlined">person</span>
          Profile
        </h2>
        <div className="settings-panel">
          <div className="setting-item">
            <span className="setting-label">Username</span>
            <span className="setting-value">{user?.username}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Clearance Level</span>
            <span className="setting-value secure-value">Alpha-Prime</span>
          </div>
        </div>
      </section>

      <section className="lobby-section settings-section">
        <h2 className="lobby-section-title">
          <span className="material-symbols-outlined">toggle_on</span>
          Preferences
        </h2>
        <div className="settings-panel">
          <div className="setting-item">
            <span className="setting-label">End-to-End Encryption</span>
            <div className="toggle active"></div>
          </div>
          <div className="setting-item">
            <span className="setting-label">Neural Noise Cancellation</span>
            <div className="toggle active"></div>
          </div>
          <div className="setting-item">
            <span className="setting-label">Haptic Feedback</span>
            <div className="toggle"></div>
          </div>
        </div>
      </section>
    </main>
  );
}

// --- Main Lobby Component ---

export default function Lobby() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [activeNav, setActiveNav] = useState('Home');

  const handleCreate = () => {
    const id = Math.random().toString(36).substring(2, 9).toUpperCase();
    navigate(`/room/${id}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) navigate(`/room/${roomId.trim()}`);
  };

  const displayName = user?.displayName || user?.username || 'User';

  return (
    <div className="lobby-page">
      {/* ── Sidebar ── */}
      <aside className="lobby-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <span className="sidebar-brand-name">NEXUS</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`sidebar-nav-item ${activeNav === item.label ? 'active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{displayName}</p>
            <p className="sidebar-user-role">verified</p>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out">
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main View Switcher ── */}
      {activeNav === 'Home' && (
        <HomeView
          user={user}
          roomId={roomId}
          setRoomId={setRoomId}
          handleCreate={handleCreate}
          handleJoin={handleJoin}
          navigate={navigate}
        />
      )}
      {activeNav === 'Meetings' && (
        <MeetingsView navigate={navigate} handleCreate={handleCreate} />
      )}
      {activeNav === 'Contacts' && (
        <ContactsView token={token} />
      )}
      {activeNav === 'Settings' && (
        <SettingsView user={user} />
      )}
    </div>
  );
}
