const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Booking, Item, User, Notification, Transaction, Review } = require('../models');
const authRouter = require('./auth');
const auth = authRouter.auth;

// Helper: create notification
async function notify(userId, title, body, type, ref = '') {
  try {
    await Notification.create({ user: userId, title, body, type, ref });
  } catch {}
}

// POST /bookings - Create booking request
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, rentalType, startTime, endTime, notes } = req.body;

    const item = await Item.findById(itemId).populate('owner');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.isAvailable) return res.status(400).json({ error: 'Item is not available' });
    if (item.owner._id.toString() === req.user.id)
      return res.status(400).json({ error: 'You cannot rent your own item' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    if (diffMs <= 0) return res.status(400).json({ error: 'Invalid time range' });

    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let rentalPrice = 0;
    if (rentalType === 'hourly') {
      rentalPrice = Math.ceil(diffHours) * (item.hourlyRate || 0);
    } else {
      rentalPrice = Math.ceil(diffDays) * (item.dailyRate || 0);
    }

    const totalAmount = rentalPrice + (item.securityDeposit || 0);

    // Check for conflicting bookings
    const conflict = await Booking.findOne({
      item: itemId,
      status: { $in: ['pending', 'approved', 'active'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });
    if (conflict) return res.status(400).json({ error: 'Item already booked for this period' });

    // Generate QR codes
    const pickupToken = uuidv4();
    const returnToken = uuidv4();
    const qrPickup = await QRCode.toDataURL(`RENTNEST:PICKUP:${pickupToken}`);
    const qrReturn = await QRCode.toDataURL(`RENTNEST:RETURN:${returnToken}`);

    const booking = await Booking.create({
      item: itemId, renter: req.user.id, owner: item.owner._id,
      rentalType, startTime: start, endTime: end,
      durationHours: Math.ceil(diffHours), durationDays: Math.ceil(diffDays),
      rentalPrice, securityDeposit: item.securityDeposit || 0,
      totalAmount, notes: notes || '',
      qrPickupCode: qrPickup, qrReturnCode: qrReturn
    });

    await booking.populate([
      { path: 'item', select: 'title images category hourlyRate dailyRate' },
      { path: 'renter', select: 'name profilePhoto trustScore' },
      { path: 'owner', select: 'name profilePhoto trustScore' }
    ]);

    // Notify owner
    await notify(item.owner._id, 'New Booking Request!',
      `${booking.renter.name} wants to rent your "${item.title}"`,
      'booking_request', booking._id.toString());

    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /bookings - Get current user's bookings (as renter or owner)
router.get('/', auth, async (req, res) => {
  try {
    const { role = 'renter', status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role === 'owner') query.owner = req.user.id;
    else query.renter = req.user.id;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('item', 'title images category hourlyRate dailyRate location')
      .populate('renter', 'name profilePhoto trustScore avgRating')
      .populate('owner', 'name profilePhoto trustScore avgRating');

    const total = await Booking.countDocuments(query);
    res.json({ bookings, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('item', 'title images category hourlyRate dailyRate securityDeposit description')
      .populate('renter', 'name profilePhoto trustScore avgRating phone isEmailVerified')
      .populate('owner', 'name profilePhoto trustScore avgRating phone isEmailVerified');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const uid = req.user.id;
    if (booking.renter._id.toString() !== uid && booking.owner._id.toString() !== uid && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/approve
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item renter owner');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner._id.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking not pending' });

    booking.status = 'approved';
    await booking.save();

    await notify(booking.renter._id, 'Booking Approved! 🎉',
      `Your request for "${booking.item.title}" has been approved. Proceed to payment.`,
      'booking_approved', booking._id.toString());

    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/reject
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item renter');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    booking.status = 'rejected';
    booking.cancellationReason = req.body.reason || '';
    await booking.save();

    await notify(booking.renter._id, 'Booking Rejected',
      `Your request for "${booking.item.title}" was not approved.`,
      'booking_rejected', booking._id.toString());

    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/pay - Simulate payment
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item owner renter');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter._id.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (booking.status !== 'approved') return res.status(400).json({ error: 'Booking must be approved first' });

    const fakePid = `RN_PAY_${uuidv4().split('-')[0].toUpperCase()}`;
    booking.paymentStatus = 'paid';
    booking.paymentId = fakePid;
    booking.status = 'active';
    await booking.save();

    await Transaction.create({
      booking: booking._id, payer: req.user.id, payee: booking.owner._id,
      amount: booking.totalAmount, type: 'rental', status: 'success',
      paymentId: fakePid
    });

    await Item.findByIdAndUpdate(booking.item._id, { isAvailable: false });

    await notify(booking.owner._id, 'Payment Received! 💰',
      `${booking.renter.name} paid ₹${booking.totalAmount} for "${booking.item.title}"`,
      'payment_received', booking._id.toString());

    res.json({ booking, paymentId: fakePid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/pickup-confirm - QR code pickup confirmation
router.put('/:id/pickup-confirm', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item owner renter');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.pickupConfirmed = true;
    await booking.save();
    res.json({ message: 'Pickup confirmed', booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/return-confirm - Return and complete
router.put('/:id/return-confirm', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item owner renter');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.returnConfirmed = true;
    booking.status = 'completed';
    await booking.save();

    // Make item available again
    await Item.findByIdAndUpdate(booking.item._id, { isAvailable: true, $inc: { totalRentals: 1 } });

    // Update renter booking stats
    await User.findByIdAndUpdate(booking.renter._id, { $inc: { completedCount: 1 } });

    await notify(booking.renter._id, 'Rental Completed!',
      `Your rental of "${booking.item.title}" is complete. Please leave a review!`,
      'system', booking._id.toString());

    res.json({ message: 'Return confirmed. Rental completed.', booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/cancel
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!['pending', 'approved'].includes(booking.status))
      return res.status(400).json({ error: 'Cannot cancel this booking' });

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || '';
    await booking.save();

    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
      await booking.save();
      await Item.findByIdAndUpdate(booking.item._id, { isAvailable: true });
    }

    const otherId = booking.renter.toString() === req.user.id ? booking.owner : booking.renter;
    await notify(otherId, 'Booking Cancelled',
      `A booking for "${booking.item.title}" was cancelled.`,
      'booking_cancelled', booking._id.toString());

    res.json({ message: 'Booking cancelled', booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /bookings/:id/review - Submit review after completion
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id).populate('item owner renter');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Booking not completed' });

    const isRenter = booking.renter._id.toString() === req.user.id;
    const isOwner  = booking.owner._id.toString() === req.user.id;
    if (!isRenter && !isOwner) return res.status(403).json({ error: 'Unauthorized' });

    const reviewType = isRenter ? 'renter_to_owner' : 'owner_to_renter';
    const reviewedUser = isRenter ? booking.owner._id : booking.renter._id;

    await Review.create({
      booking: booking._id, reviewer: req.user.id, reviewed: reviewedUser,
      item: booking.item._id, rating, comment: comment || '', type: reviewType
    });

    // Update reviewed user's rating
    const reviewed = await User.findById(reviewedUser);
    reviewed.ratingSum += rating;
    reviewed.totalRatings += 1;
    reviewed.avgRating = reviewed.ratingSum / reviewed.totalRatings;
    await reviewed.save();

    // Also update item rating if renter is reviewing
    if (isRenter) {
      const item = await Item.findById(booking.item._id);
      item.ratingSum = (item.ratingSum || 0) + rating;
      item.totalRatings += 1;
      item.avgRating = item.ratingSum / item.totalRatings;
      await item.save();
    }

    res.json({ message: 'Review submitted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id/dispute
router.put('/:id/dispute', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.status = 'disputed';
    booking.disputeReason = req.body.reason || '';
    booking.damageReported = req.body.damageReported || false;
    booking.damageDescription = req.body.damageDescription || '';
    await booking.save();
    res.json({ message: 'Dispute filed', booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
