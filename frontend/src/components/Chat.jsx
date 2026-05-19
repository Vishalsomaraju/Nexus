import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

export default function Chat({ user, messages = [], sendMessage }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const selfId = user?.id || user?.email || 'self';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage?.(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Group consecutive messages by same sender */
  const groups = [];
  messages.forEach((msg) => {
    const last = groups[groups.length - 1];
    const isSelf = msg.senderId === selfId || msg.from === selfId;
    if (last && last.isSelf === isSelf && last.author === (msg.displayName || msg.from)) {
      last.items.push(msg);
    } else {
      groups.push({ isSelf, author: msg.displayName || msg.from || 'Unknown', items: [msg] });
    }
  });

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {groups.length === 0 ? (
          <div className="chat-empty">
            <span className="material-symbols-outlined">chat_bubble</span>
            <p>No messages yet</p>
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={gi} className={`msg-group msg-group--${g.isSelf ? 'self' : 'other'}`}>
              <div className="msg-meta">
                <span className="msg-author">{g.isSelf ? 'You' : g.author}</span>
                <span className="msg-time">
                  {new Date(g.items[0].timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {g.items.map((msg, mi) => (
                <div key={mi} className={`msg-bubble msg-bubble--${g.isSelf ? 'self' : 'other'}`}>
                  {msg.text || msg.message}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="Send a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!text.trim()}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}
