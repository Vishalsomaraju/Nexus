const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, displayName }
    });

    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, displayName: user.displayName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, displayName: user.displayName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Express Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, displayName: true, createdAt: true }
    });
    // Filter out the current user if desired, but frontend can do that too
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update display name
app.put('/api/user/display-name', authenticateToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName) return res.status(400).json({ error: 'Display name required' });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { displayName }
    });

    const token = jwt.sign({ id: updatedUser.id, username: updatedUser.username, displayName: updatedUser.displayName }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: updatedUser.username, displayName: updatedUser.displayName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware for Socket.io authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

// Socket.io signaling
const rooms = new Map(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    const roomUsers = rooms.get(roomId);
    roomUsers.add(socket.id);

    // Notify others in room
    socket.to(roomId).emit('user-connected', { userId: socket.id, username: socket.user.username });
    
    // Send list of existing users in room to the new user
    const otherUsers = Array.from(roomUsers).filter(id => id !== socket.id);
    socket.emit('room-users', otherUsers);

    socket.on('disconnect', () => {
      roomUsers.delete(socket.id);
      if (roomUsers.size === 0) {
        rooms.delete(roomId);
      }
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', {
      caller: socket.id,
      offer: data.offer,
      username: socket.user.username
    });
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', {
      callee: socket.id,
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', {
      peer: socket.id,
      candidate: data.candidate
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
