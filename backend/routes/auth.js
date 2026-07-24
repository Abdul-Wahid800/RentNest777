const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'rentnest_secret_2024';

// Middleware: verify JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
module.exports.auth = auth;

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name, email, and password must be strings' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate mock OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name, email, password: hashed,
      phone: phone || '',
      otpCode: otp,
      otpExpiry: expiry,
    });

    // In production: send OTP via email/SMS
    console.log(`[OTP] ${email}: ${otp}`);

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registered. OTP sent (check console for dev mode).',
      token,
      otp_dev: otp, // expose for dev/demo only
      user: { id: user._id, name: user.name, email: user.email, trustScore: user.trustScore }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.otpCode !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired' });

    user.isEmailVerified = true;
    user.otpCode = '';
    await user.save();

    res.json({ message: 'Email verified successfully', isEmailVerified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Account banned' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        profilePhoto: user.profilePhoto, trustScore: user.trustScore,
        avgRating: user.avgRating, isEmailVerified: user.isEmailVerified,
        isIdVerified: user.isIdVerified, role: user.role
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otpCode');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, bio, address, location, profilePhoto, fcmToken } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (bio) update.bio = bio;
    if (address) update.address = address;
    if (location) update.location = location;
    if (profilePhoto) update.profilePhoto = profilePhoto;
    if (fcmToken) update.fcmToken = fcmToken;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password -otpCode');
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/resend-otp
router.post('/resend-otp', auth, async (req, res) => {
  try {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(req.user.id, { otpCode: otp, otpExpiry: expiry });
    console.log(`[OTP Resent] ${req.user.email}: ${otp}`);
    res.json({ message: 'OTP resent', otp_dev: otp });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Incorrect current password' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.auth = auth;
