const express = require('express');
const router = express.Router();
const { Message, Notification, User } = require('../models');
const authRouter = require('./auth');
const auth = authRouter.auth;

// GET /chats - Get all chat rooms for current user
router.get('/', auth, async (req, res) => {
  try {
    // Get distinct rooms involving this user
    const rooms = await Message.aggregate([
      { $match: {
          $or: [
            { sender: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) },
            { recipient: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$room',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate users
    const populated = await Promise.all(rooms.map(async r => {
      const msg = r.lastMessage;
      const otherId = msg.sender.toString() === req.user.id ? msg.recipient : msg.sender;
      const other = await User.findById(otherId).select('name profilePhoto trustScore avgRating');
      const unread = await Message.countDocuments({
        room: r._id, recipient: req.user.id, isRead: false
      });
      return { room: r._id, other, lastMessage: msg, unreadCount: unread };
    }));

    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /chats/:room - Get messages in a room
router.get('/:room', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('sender', 'name profilePhoto')
      .populate('recipient', 'name profilePhoto');

    // Mark as read
    await Message.updateMany(
      { room: req.params.room, recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json(messages.reverse());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /chats/send - Send a message (REST fallback, socket is primary)
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, content, type, bookingRef } = req.body;
    const room = [req.user.id, recipientId].sort().join('_');

    const message = await Message.create({
      room, sender: req.user.id, recipient: recipientId,
      content, type: type || 'text',
      bookingRef: bookingRef || null
    });

    await message.populate([
      { path: 'sender', select: 'name profilePhoto' },
      { path: 'recipient', select: 'name profilePhoto' }
    ]);

    // Create notification for recipient
    const sender = await User.findById(req.user.id).select('name');
    await Notification.create({
      user: recipientId, title: `New message from ${sender.name}`,
      body: content.length > 60 ? content.slice(0, 57) + '...' : content,
      type: 'chat', ref: room
    });

    res.status(201).json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /chats/notifications/all - Get all notifications for user
router.get('/notifications/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /chats/notifications/read-all - Mark all notifications read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
