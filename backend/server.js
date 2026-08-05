require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Serve Frontend Static Build ──────────────────────────────────────────────
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
app.use(express.static(FRONTEND_DIST));

// ─── Database Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentnest';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 RentNest Backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌐 Health: http://localhost:${PORT}/health`);
    });

  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1); // IMPORTANT: stop server if DB fails
  });

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RentNest Backend',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── Models ───────────────────────────────────────────────────────────────────
const models = require('./models');
const Message = models.Message;
const Notification = models.Notification;

// ─── Socket.io Real-Time ──────────────────────────────────────────────────────

// Map of userId → socketId
const userSockets = {};

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Register user
  socket.on('register', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId;
      console.log(`👤 User ${userId} registered on socket ${socket.id}`);
    }
  });

  // Join a chat room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`💬 Socket ${socket.id} joined room ${room}`);
  });

  // Leave a chat room
  socket.on('leave_room', (room) => {
    socket.leave(room);
  });

  // Send a message
  socket.on('send_message', async (data) => {
    try {
      // 🔥 DB safety check
      if (mongoose.connection.readyState !== 1) {
        return socket.emit('error', { message: 'Database not connected' });
      }

      const { senderId, recipientId, content, type, bookingRef } = data;
      const room = [senderId, recipientId].sort().join('_');

      const msg = await Message.create({
        room,
        sender: senderId,
        recipient: recipientId,
        content,
        type: type || 'text',
        bookingRef: bookingRef || null
      });

      await msg.populate([
        { path: 'sender', select: 'name profilePhoto' },
        { path: 'recipient', select: 'name profilePhoto' }
      ]);

      // Emit to both users in the room
      io.to(room).emit('new_message', msg);

      // Notification logic
      const recipientSocketId = userSockets[recipientId];

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification', {
          type: 'chat',
          title: `Message from ${msg.sender.name}`,
          body: content.length > 60 ? content.slice(0, 57) + '...' : content,
          ref: room
        });
      } else {
        await Notification.create({
          user: recipientId,
          title: `Message from ${msg.sender.name}`,
          body: content.length > 60 ? content.slice(0, 57) + '...' : content,
          type: 'chat',
          ref: room
        });
      }

    } catch (err) {
      console.error('❌ send_message error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  // Typing indicator
  socket.on('typing', ({ room, userId, isTyping }) => {
    socket.to(room).emit('user_typing', { userId, isTyping });
  });

  // Booking status update
  socket.on('booking_update', async ({ bookingId, status, ownerId, renterId }) => {
    const ownerSocket = userSockets[ownerId];
    const renterSocket = userSockets[renterId];

    const payload = { bookingId, status };

    if (ownerSocket) io.to(ownerSocket).emit('booking_status_changed', payload);
    if (renterSocket) io.to(renterSocket).emit('booking_status_changed', payload);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) delete userSockets[socket.userId];
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── SPA Catch-All (must be AFTER API routes) ─────────────────────────────────
// Serves index.html for any non-API route so React Navigation works on refresh
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ status: 'ok', message: 'RentNest API is running' });
    }
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});