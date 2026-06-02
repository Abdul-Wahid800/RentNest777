const mongoose = require('mongoose');

// ─── USER MODEL ────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  password:          { type: String, required: true },
  phone:             { type: String, default: '' },
  profilePhoto:      { type: String, default: '' },
  bio:               { type: String, default: '' },
  address:           { type: String, default: '' },
  location: {
    type:            { type: String, enum: ['Point'], default: 'Point' },
    coordinates:     { type: [Number], default: [0, 0] } // [lng, lat]
  },
  isEmailVerified:   { type: Boolean, default: false },
  isPhoneVerified:   { type: Boolean, default: false },
  isIdVerified:      { type: Boolean, default: false },
  governmentId:      { type: String, default: '' },
  otpCode:           { type: String, default: '' },
  otpExpiry:         { type: Date, default: null },
  trustScore:        { type: Number, default: 60, min: 0, max: 100 },
  totalRatings:      { type: Number, default: 0 },
  ratingSum:         { type: Number, default: 0 },
  avgRating:         { type: Number, default: 0 },
  bookingCount:      { type: Number, default: 0 },
  completedCount:    { type: Number, default: 0 },
  cancelledCount:    { type: Number, default: 0 },
  disputeCount:      { type: Number, default: 0 },
  responseTimeMin:   { type: Number, default: 60 },
  walletBalance:     { type: Number, default: 0 },
  wishlist:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  favorites:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  role:              { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive:          { type: Boolean, default: true },
  isBanned:          { type: Boolean, default: false },
  fcmToken:          { type: String, default: '' },
  createdAt:         { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// ─── ITEM MODEL ────────────────────────────────────────────────────────────────
const itemSchema = new mongoose.Schema({
  owner:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:             { type: String, required: true, trim: true },
  description:       { type: String, default: '' },
  category:          { type: String, enum: [
    'Tools', 'Kitchen', 'Electronics', 'Furniture', 'Sports', 'Garden', 
    'Clothing', 'Books', 'Toys', 'Cleaning', 'Party', 'Other'
  ], required: true },
  images:            [{ type: String }],
  hourlyRate:        { type: Number, default: 0 },
  dailyRate:         { type: Number, default: 0 },
  securityDeposit:   { type: Number, default: 0 },
  condition:         { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
  isAvailable:       { type: Boolean, default: true },
  isActive:          { type: Boolean, default: true },
  isFlagged:         { type: Boolean, default: false },
  fraudRisk:         { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  location: {
    type:            { type: String, enum: ['Point'], default: 'Point' },
    coordinates:     { type: [Number], default: [0, 0] }
  },
  address:           { type: String, default: '' },
  avgRating:         { type: Number, default: 0 },
  totalRatings:      { type: Number, default: 0 },
  ratingSum:         { type: Number, default: 0 },
  totalRentals:      { type: Number, default: 0 },
  viewCount:         { type: Number, default: 0 },
  unavailableDates:  [{ type: String }],
  tags:              [{ type: String }],
  createdAt:         { type: Date, default: Date.now }
}, { timestamps: true });

itemSchema.index({ location: '2dsphere' });

// ─── BOOKING MODEL ─────────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  item:              { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  renter:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rentalType:        { type: String, enum: ['hourly', 'daily'], required: true },
  startTime:         { type: Date, required: true },
  endTime:           { type: Date, required: true },
  durationHours:     { type: Number, default: 0 },
  durationDays:      { type: Number, default: 0 },
  rentalPrice:       { type: Number, required: true },
  securityDeposit:   { type: Number, default: 0 },
  totalAmount:       { type: Number, required: true },
  status:            { type: String, enum: [
    'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'disputed'
  ], default: 'pending' },
  paymentStatus:     { type: String, enum: ['unpaid', 'paid', 'refunded', 'partial'], default: 'unpaid' },
  paymentId:         { type: String, default: '' },
  qrPickupCode:      { type: String, default: '' },
  qrReturnCode:      { type: String, default: '' },
  pickupConfirmed:   { type: Boolean, default: false },
  returnConfirmed:   { type: Boolean, default: false },
  ownerRating:       { type: Number, default: 0 },
  ownerReview:       { type: String, default: '' },
  renterRating:      { type: Number, default: 0 },
  renterReview:      { type: String, default: '' },
  damageReported:    { type: Boolean, default: false },
  damageDescription: { type: String, default: '' },
  disputeReason:     { type: String, default: '' },
  disputeResolution: { type: String, default: '' },
  cancellationReason:{ type: String, default: '' },
  extensionRequested:{ type: Boolean, default: false },
  extensionHours:    { type: Number, default: 0 },
  notes:             { type: String, default: '' },
  createdAt:         { type: Date, default: Date.now }
}, { timestamps: true });

// ─── MESSAGE MODEL ─────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  room:       { type: String, required: true, index: true },
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, required: true },
  type:       { type: String, enum: ['text', 'system', 'booking'], default: 'text' },
  isRead:     { type: Boolean, default: false },
  bookingRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  createdAt:  { type: Date, default: Date.now }
}, { timestamps: true });

// ─── NOTIFICATION MODEL ────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  type:      { type: String, enum: [
    'booking_request', 'booking_approved', 'booking_rejected', 'booking_cancelled',
    'payment_received', 'return_reminder', 'new_item_nearby', 'chat', 'review', 'system'
  ], default: 'system' },
  isRead:    { type: Boolean, default: false },
  ref:       { type: String, default: '' },
  refModel:  { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ─── REVIEW MODEL ──────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item:     { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, default: '' },
  type:     { type: String, enum: ['owner_to_renter', 'renter_to_owner'], required: true },
  createdAt:{ type: Date, default: Date.now }
}, { timestamps: true });

// ─── REPORT MODEL ─────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['user', 'item'], required: true },
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  reason:     { type: String, required: true },
  details:    { type: String, default: '' },
  status:     { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  adminNote:  { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now }
}, { timestamps: true });

// ─── TRANSACTION MODEL ─────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  payer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:    { type: Number, required: true },
  type:      { type: String, enum: ['rental', 'deposit', 'refund', 'penalty'], default: 'rental' },
  status:    { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  paymentGateway: { type: String, default: 'simulated' },
  paymentId: { type: String, default: '' },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  User:        mongoose.model('User',        userSchema),
  Item:        mongoose.model('Item',        itemSchema),
  Booking:     mongoose.model('Booking',     bookingSchema),
  Message:     mongoose.model('Message',     messageSchema),
  Notification:mongoose.model('Notification',notificationSchema),
  Review:      mongoose.model('Review',      reviewSchema),
  Report:      mongoose.model('Report',      reportSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
};
