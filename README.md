# NEXUS — Real-Time Communication Platform

A full-stack video conferencing and collaboration app built with WebRTC, Socket.io, React, and Node.js.

## Features

- 🎥 **Multi-user video calling** — WebRTC mesh topology (up to 6 participants)
- 🖥️ **Screen sharing** — Switch between camera and screen mid-call
- 💬 **Encrypted chat** — End-to-end via WebRTC Data Channels
- 📁 **File sharing** — Direct P2P file transfer (no server relay)
- 🎨 **Collaborative whiteboard** — Real-time synchronized drawing canvas
- 🔐 **JWT authentication** — Secure login/signup with bcrypt-hashed passwords

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Frontend        | React 18 + Vite                        |
| Styling         | Vanilla CSS (glassmorphism, dark mode) |
| Real-time Media | WebRTC (native browser API)            |
| Signaling       | Socket.io                              |
| Backend         | Node.js + Express                      |
| Database        | SQLite via Prisma ORM                  |
| Auth            | JWT + bcrypt                           |

## Project Structure

```
realTimeCommunication/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # VideoTile, Whiteboard, Chat, FileShare, ControlBar
    │   ├── context/        # AuthContext
    │   ├── hooks/          # useWebRTC
    │   ├── pages/          # Landing, Auth, Lobby, Room
    │   └── styles/         # global.css
    ├── index.html
    └── package.json
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env          # Edit JWT_SECRET
npx prisma migrate dev --name init
npx prisma generate
npm run dev
# Server starts on http://localhost:3001
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

### 3. Test Multi-User Video

1. Open two different browser profiles (or one normal + one incognito)
2. Register two separate accounts
3. In the Lobby, both users create/join the same Room ID
4. Grant camera/microphone permissions
5. Verify bidirectional video ✅, chat ✅, whiteboard ✅, file sharing ✅

## Architecture: WebRTC Signaling Flow

```
User A joins room → Server notifies existing peers
Existing peer B → creates RTCPeerConnection → sends Offer via Socket.io
User A → receives Offer → creates Answer → sends back via Socket.io
Both → exchange ICE candidates via Socket.io
Connection established → P2P media streams directly between browsers
```

Data channels (chat, whiteboard, files) are layered on top of the P2P connection — fully end-to-end encrypted, zero server relay.

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWTs expire in 7 days
- Socket.io connections require a valid JWT
- WebRTC Data Channels are encrypted by DTLS (spec-mandated)
- STUN servers used for NAT traversal (no TURN = no relay overhead)
