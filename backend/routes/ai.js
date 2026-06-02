const express = require('express');
const router = express.Router();
const axios = require('axios');
const { User, Item, Booking, Report, Transaction } = require('../models');
const authRouter = require('./auth');
const auth = authRouter.auth;

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// POST /ai/trust/:userId - Recalculate and update trust score
router.post('/trust/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const completionRate = user.bookingCount > 0
      ? user.completedCount / user.bookingCount : 1.0;
    const disputeRate = user.bookingCount > 0
      ? user.disputeCount / user.bookingCount : 0.0;
    const cancellationRate = user.bookingCount > 0
      ? user.cancelledCount / user.bookingCount : 0.0;

    const payload = {
      rating_avg: user.avgRating || 5.0,
      rating_count: user.totalRatings || 0,
      booking_completion_rate: completionRate,
      dispute_rate: disputeRate,
      avg_response_time_min: user.responseTimeMin || 60.0,
      cancellation_rate: cancellationRate,
      id_verified: user.isIdVerified ? 1 : 0
    };

    let trustScore = user.trustScore;
    let reliabilityTier = 'Medium';
    try {
      const aiRes = await axios.post(`${AI_SERVICE_URL}/predict_trust`, payload, { timeout: 5000 });
      trustScore = aiRes.data.trust_score;
      reliabilityTier = aiRes.data.reliability_tier;
    } catch {
      // fallback local calculation
      trustScore = Math.min(100, Math.max(0,
        60 + (user.avgRating - 3) * 10 + (user.isIdVerified ? 15 : 0)
        + completionRate * 20 - disputeRate * 80 - cancellationRate * 30
      ));
    }

    await User.findByIdAndUpdate(req.params.userId, { trustScore });
    res.json({ trustScore, reliabilityTier });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /ai/fraud-check - Evaluate fraud risk on item listing
router.post('/fraud-check', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await Item.findById(itemId).populate('owner');
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const medianCategoryRate = 200; // placeholder ₹/day median
    const priceDeviation = item.dailyRate > 0
      ? item.dailyRate / medianCategoryRate : 1.0;
    const depositRatio = item.dailyRate > 0
      ? item.securityDeposit / item.dailyRate : 1.0;
    const owner = item.owner;
    const isNew = (Date.now() - new Date(owner.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

    const payload = {
      price_deviation_ratio: priceDeviation,
      owner_trust_score: owner.trustScore || 60.0,
      deposit_to_price_ratio: depositRatio,
      is_new_account: isNew ? 1 : 0,
      owner_verification_status: owner.isIdVerified ? 1 : 0,
      description_length: item.description.length
    };

    let riskLevel = 'Low', probabilities = { Low: 0.8, Medium: 0.15, High: 0.05 };
    try {
      const aiRes = await axios.post(`${AI_SERVICE_URL}/predict_fraud`, payload, { timeout: 5000 });
      riskLevel = aiRes.data.risk_level;
      probabilities = aiRes.data.probabilities;
    } catch {}

    await Item.findByIdAndUpdate(itemId, { fraudRisk: riskLevel, isFlagged: riskLevel === 'High' });
    res.json({ itemId, riskLevel, probabilities });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /ai/recommendations - Get personalized item ranking
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 20 } = req.body;
    const items = await Item.find({ isActive: true, isAvailable: true })
      .populate('owner', 'trustScore').limit(100);

    const payload = {
      lat: lat || 0, lng: lng || 0,
      items: items.map(i => ({
        _id: i._id,
        lat: i.location.coordinates[1] || 0,
        lng: i.location.coordinates[0] || 0,
        price: i.dailyRate || 0,
        rating: i.avgRating || 5,
        owner_trust: i.owner?.trustScore || 60
      }))
    };

    let ranked = items.slice(0, limit);
    try {
      const aiRes = await axios.post(`${AI_SERVICE_URL}/recommendations`, payload, { timeout: 5000 });
      const rankedIds = aiRes.data.items.slice(0, limit).map(x => x._id.toString());
      ranked = rankedIds.map(id => items.find(i => i._id.toString() === id)).filter(Boolean);
    } catch {}

    await Item.populate(ranked, { path: 'owner', select: 'name profilePhoto trustScore avgRating isIdVerified' });
    res.json(ranked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /ai/dynamic-price - Get pricing suggestion for item
router.post('/dynamic-price', auth, async (req, res) => {
  try {
    const { category, condition, radius = 5 } = req.body;
    const similar = await Item.find({ category, isActive: true }).limit(50);
    if (!similar.length) return res.json({ suggestedHourly: 50, suggestedDaily: 300 });

    const dailyRates = similar.map(i => i.dailyRate).filter(r => r > 0);
    const hourlyRates = similar.map(i => i.hourlyRate).filter(r => r > 0);

    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const conditionMultiplier = { Excellent: 1.15, Good: 1.0, Fair: 0.85, Poor: 0.7 };
    const mult = conditionMultiplier[condition] || 1.0;

    res.json({
      suggestedHourly: Math.round(avg(hourlyRates) * mult) || 50,
      suggestedDaily: Math.round(avg(dailyRates) * mult) || 300,
      basedOn: similar.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /ai/analytics - Admin analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const [totalUsers, totalItems, totalBookings, completedBookings] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' })
    ]);

    const revenue = await Transaction.aggregate([
      { $match: { status: 'success', type: 'rental' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$avgRating' } } },
      { $sort: { count: -1 } }
    ]);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate('item', 'title category')
      .populate('renter', 'name')
      .populate('owner', 'name');

    res.json({
      totalUsers, totalItems, totalBookings, completedBookings,
      totalRevenue: revenue[0]?.total || 0,
      categoryStats, recentBookings
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /ai/report - Report user or item
router.post('/report', auth, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const report = await Report.create({
      reporter: req.user.id, targetType, targetId, reason, details: details || ''
    });
    res.status(201).json({ message: 'Report submitted', report });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
