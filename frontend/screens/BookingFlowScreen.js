import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Image, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getBookings, approveBooking, rejectBooking, payBooking,
  cancelBooking, confirmPickup, confirmReturn, submitReview, fileDispute
} from '../utils/api';
import { Colors } from '../theme';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600';

export default function BookingFlowScreen({ navigation }) {
  const { theme: { c } } = useTheme();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState('renter'); // renter or owner

  // Modals state
  const [activeBooking, setActiveBooking] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrType, setQrType] = useState('pickup'); // pickup or return
  const [reviewModal, setReviewModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);

  // Form Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [damageReported, setDamageReported] = useState(false);
  const [damageDetails, setDamageDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserBookings = async (showPulse = true) => {
    if (showPulse) setLoading(true);
    try {
      const res = await getBookings({ role });
      setBookings(res.data.bookings || []);
    } catch (e) {
      console.warn('Error fetching bookings:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [role]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserBookings(false);
  };

  // State Transition Actions
  const handleApprove = async (id) => {
    Alert.alert('Approve Request', 'Are you sure you want to approve this rental request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveBooking(id);
            Alert.alert('Approved', 'Rental approved successfully!');
            fetchUserBookings(false);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to approve booking');
          }
        }
      }
    ]);
  };

  const handleReject = async (id) => {
    Alert.prompt(
      'Reject Request',
      'Please provide a reason for rejecting this request:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            try {
              await rejectBooking(id, { reason: reason || 'Not available' });
              Alert.alert('Rejected', 'Request rejected.');
              fetchUserBookings(false);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || 'Failed to reject booking');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleSimulatePayment = async () => {
    if (!cardNumber || !cardExpiry || !cardCvv) {
      return Alert.alert('Invalid Card Details', 'Please fill in all card details.');
    }
    setActionLoading(true);
    try {
      await payBooking(activeBooking._id);
      setPaymentModal(false);
      Alert.alert('🎉 Payment Successful!', 'The security deposit and booking cost have been paid securely.');
      fetchUserBookings(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHandoffVerify = async (bookingId, type) => {
    try {
      if (type === 'pickup') {
        await confirmPickup(bookingId);
        Alert.alert('Handoff Verified', 'Pickup has been successfully checked in!');
      } else {
        await confirmReturn(bookingId);
        Alert.alert('Return Checked In', 'Item returned! Booking completed successfully.');
      }
      fetchUserBookings(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Verification failed');
    }
  };

  const handleCancel = async (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(id, { reason: 'Cancelled by user' });
            Alert.alert('Cancelled', 'Booking cancelled successfully.');
            fetchUserBookings(false);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to cancel booking');
          }
        }
      }
    ]);
  };

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) return Alert.alert('Review Required', 'Please leave a brief comment.');
    setActionLoading(true);
    try {
      await submitReview(activeBooking._id, { rating, comment: reviewComment });
      setReviewModal(false);
      setReviewComment('');
      setRating(5);
      Alert.alert('Thank You!', 'Your review has been saved. The system is updating AI trust levels.');
      fetchUserBookings(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to save review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) return Alert.alert('Reason Required', 'Please explain the issue.');
    setActionLoading(true);
    try {
      await fileDispute(activeBooking._id, {
        reason: disputeReason,
        damageReported,
        damageDescription: damageDetails
      });
      setDisputeModal(false);
      setDisputeReason('');
      setDamageReported(false);
      setDamageDetails('');
      Alert.alert('Dispute Filed', 'A ticket has been opened. Our trust team will review this transaction.');
      fetchUserBookings(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to file dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status, paymentStatus) => {
    let bg = '#777';
    let text = status.toUpperCase();

    if (status === 'pending') {
      bg = Colors.warning;
      text = 'Awaiting Approval';
    } else if (status === 'approved') {
      if (paymentStatus === 'paid') {
        bg = Colors.info;
        text = 'Ready for Pickup';
      } else {
        bg = Colors.primary;
        text = 'Approved / Unpaid';
      }
    } else if (status === 'active') {
      bg = Colors.success;
      text = 'Renting Now';
    } else if (status === 'completed') {
      bg = '#64748B';
      text = 'Completed';
    } else if (status === 'rejected') {
      bg = Colors.error;
      text = 'Rejected';
    } else if (status === 'cancelled') {
      bg = Colors.error;
      text = 'Cancelled';
    } else if (status === 'disputed') {
      bg = '#F43F5E';
      text = 'Disputed';
    }

    return (
      <View style={[s.badge, { backgroundColor: bg + '22', borderColor: bg }]}>
        <Text style={{ color: bg, fontSize: 10, fontWeight: '700' }}>{text}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isOwner = role === 'owner';
    const otherParty = isOwner ? item.renter : item.owner;
    const itemTitle = item.item?.title || 'Unknown Item';
    const itemImg = item.item?.images?.[0] || PLACEHOLDER;
    const dateStr = new Date(item.startTime).toLocaleDateString() + ' - ' + new Date(item.endTime).toLocaleDateString();

    return (
      <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        {/* Header */}
        <View style={s.cardHeader}>
          <Image source={{ uri: itemImg }} style={s.itemThumb} />
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: c.text }]}>{itemTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="person-circle" size={14} color={Colors.primary} />
              <Text style={{ color: c.textSub, fontSize: 12 }}>
                {isOwner ? 'Renter: ' : 'Owner: '}
                <Text style={{ color: c.text, fontWeight: '600' }}>{otherParty?.name || 'N/A'}</Text>
              </Text>
              {otherParty?.trustScore && (
                <View style={s.miniTrust}>
                  <Text style={s.miniTrustText}>{Math.round(otherParty.trustScore)}% Trust</Text>
                </View>
              )}
            </View>
          </View>
          {renderStatusBadge(item.status, item.paymentStatus)}
        </View>

        {/* Date / Time */}
        <View style={[s.detailsRow, { borderBottomColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
            <Text style={{ color: c.textSub, fontSize: 12 }}>{dateStr}</Text>
          </View>
          <View>
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 15 }}>₹{item.totalAmount}</Text>
            <Text style={{ color: c.textMuted, fontSize: 9 }}>incl. ₹{item.securityDeposit} deposit</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          {/* Owner view */}
          {isOwner && item.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
              <TouchableOpacity onPress={() => handleReject(item._id)} style={[s.btn, { flex: 1, borderColor: Colors.error }]}>
                <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 13 }}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleApprove(item._id)} style={[s.btn, { flex: 1, backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          {isOwner && item.status === 'approved' && item.paymentStatus === 'paid' && !item.pickupConfirmed && (
            <TouchableOpacity
              onPress={() => {
                setActiveBooking(item);
                setQrType('pickup');
                setQrModal(true);
              }}
              style={[s.btnWide, { backgroundColor: Colors.primary }]}>
              <Ionicons name="qr-code-outline" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Verify Pickup Handoff</Text>
            </TouchableOpacity>
          )}

          {isOwner && item.status === 'active' && !item.returnConfirmed && (
            <TouchableOpacity
              onPress={() => {
                setActiveBooking(item);
                setQrType('return');
                setQrModal(true);
              }}
              style={[s.btnWide, { backgroundColor: Colors.secondary }]}>
              <Ionicons name="cube-outline" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm Return Handover</Text>
            </TouchableOpacity>
          )}

          {/* Renter view */}
          {!isOwner && item.status === 'approved' && item.paymentStatus !== 'paid' && (
            <TouchableOpacity
              onPress={() => {
                setActiveBooking(item);
                setCardNumber('');
                setCardExpiry('');
                setCardCvv('');
                setPaymentModal(true);
              }}
              style={[s.btnWide, { backgroundColor: Colors.primary }]}>
              <Ionicons name="card-outline" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Pay Securely ₹{item.totalAmount}</Text>
            </TouchableOpacity>
          )}

          {!isOwner && item.status === 'approved' && item.paymentStatus === 'paid' && !item.pickupConfirmed && (
            <View style={s.awaitCard}>
              <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
              <Text style={{ color: Colors.warning, fontWeight: '600', fontSize: 12 }}>
                Show QR Code to Owner during Pickup
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveBooking(item);
                  setQrType('pickup');
                  setQrModal(true);
                }}
                style={[s.btnMini, { backgroundColor: Colors.primary }]}>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Show QR</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isOwner && item.status === 'active' && !item.returnConfirmed && (
            <View style={s.awaitCard}>
              <Ionicons name="refresh-circle-outline" size={18} color={Colors.secondary} />
              <Text style={{ color: Colors.secondary, fontWeight: '600', fontSize: 12 }}>
                Returning this item? Show Return QR
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveBooking(item);
                  setQrType('return');
                  setQrModal(true);
                }}
                style={[s.btnMini, { backgroundColor: Colors.secondary }]}>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Show QR</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'completed' && (
            <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
              <TouchableOpacity
                onPress={() => {
                  setActiveBooking(item);
                  setDisputeReason('');
                  setDamageReported(false);
                  setDamageDetails('');
                  setDisputeModal(true);
                }}
                style={[s.btn, { flex: 1, borderColor: '#FDA4AF' }]}>
                <Ionicons name="alert-triangle-outline" size={14} color="#F43F5E" />
                <Text style={{ color: '#F43F5E', fontWeight: '600', fontSize: 12 }}>Dispute</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveBooking(item);
                  setRating(5);
                  setReviewComment('');
                  setReviewModal(true);
                }}
                style={[s.btn, { flex: 1, backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                <Ionicons name="star" size={14} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Leave Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancellation Option (pending/approved) */}
          {['pending', 'approved'].includes(item.status) && (
            <TouchableOpacity onPress={() => handleCancel(item._id)} style={s.cancelBtn}>
              <Text style={{ color: c.textMuted, fontSize: 11 }}>Cancel booking</Text>
            </TouchableOpacity>
          )}

          {/* Dispute ticket pending */}
          {item.status === 'disputed' && (
            <View style={[s.disputeBanner, { backgroundColor: '#F43F5E12', borderColor: '#F43F5E55' }]}>
              <Ionicons name="warning" size={14} color="#F43F5E" />
              <Text style={{ color: '#F43F5E', fontSize: 11, fontWeight: '600' }}>
                Dispute open: {item.disputeReason || 'Awaiting resolution'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header Tabs */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        {['renter', 'owner'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setRole(t)}
            style={[s.tab, role === t && [s.tabActive, { borderBottomColor: Colors.primary }]]}
          >
            <Ionicons
              name={t === 'renter' ? 'basket-outline' : 'share-social-outline'}
              size={18}
              color={role === t ? Colors.primary : c.textSub}
            />
            <Text style={[s.tabText, { color: role === t ? Colors.primary : c.textSub }]}>
              {t === 'renter' ? 'My Borrowings' : 'My Lendings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={[s.center, { marginTop: 60 }]}>
              <Ionicons name="journal-outline" size={48} color={c.textMuted} />
              <Text style={[s.emptyText, { color: c.textSub }]}>No bookings found</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                {role === 'renter'
                  ? 'Rent tools, electronics, kitchen utilities in your neighborhood!'
                  : 'List an item to start making extra income from underutilized items!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Simulated Checkout Modal */}
      <Modal visible={paymentModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.modalTitle, { color: c.text }]}>Secure Payment Sheet</Text>
              <TouchableOpacity onPress={() => setPaymentModal(false)}>
                <Ionicons name="close" size={24} color={c.textSub} />
              </TouchableOpacity>
            </View>

            <View style={s.shield}>
              <Ionicons name="shield-checkmark" size={28} color={Colors.success} />
              <View>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>Hyperlocal Escrow Trust</Text>
                <Text style={{ color: c.textSub, fontSize: 11 }}>Funds are held securely until return checkout.</Text>
              </View>
            </View>

            <Text style={[s.label, { color: c.textSub, marginTop: 12 }]}>Card Number</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="4111 2222 3333 4444"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={19}
              placeholderTextColor={c.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: c.textSub }]}>Expiry</Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: c.textSub }]}>CVV</Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  placeholder="123"
                  secureTextEntry
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <View style={[s.priceSum, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={{ color: c.textSub }}>Escrow amount due:</Text>
              <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 18 }}>
                ₹{activeBooking?.totalAmount}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSimulatePayment} disabled={actionLoading}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnPrimary}>
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="logo-usd" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm Escrow Payment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code / Checkout PIN Handoff Modal */}
      <Modal visible={qrModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border, alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => setQrModal(false)} style={{ alignSelf: 'flex-end' }}>
              <Ionicons name="close" size={24} color={c.textSub} />
            </TouchableOpacity>

            <Text style={[s.modalTitle, { color: c.text }]}>
              {qrType === 'pickup' ? 'Pickup Handoff Checkout' : 'Return Checkout'}
            </Text>
            <Text style={{ color: c.textSub, textAlign: 'center', marginBottom: 20, fontSize: 13 }}>
              Scan QR code or click the manual confirmation bypass code below to confirm physical handover.
            </Text>

            {/* Visual Simulated QR Box */}
            <View style={[s.qrBox, { borderColor: Colors.primary, backgroundColor: c.bg }]}>
              <View style={s.qrMock}>
                {/* Visual Representation of QR Code */}
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
                    {[...Array(6)].map((_, j) => (
                      <View
                        key={j}
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: (i + j) % 2 === 0 ? Colors.primary : 'transparent',
                          borderRadius: 4
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View style={{ backgroundColor: c.bg, padding: 12, borderRadius: 10, marginTop: 16 }}>
              <Text style={{ color: c.textMuted, fontSize: 10, textAlign: 'center' }}>Secure Token Code</Text>
              <Text style={{ color: Colors.secondary, fontWeight: '800', fontSize: 16, marginTop: 2 }}>
                RENTNEST-{activeBooking?._id?.slice(-8).toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setQrModal(false);
                handleHandoffVerify(activeBooking._id, qrType);
              }}
              style={[s.btnPrimary, { width: '100%', marginTop: 24 }]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm Verification Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.modalTitle, { color: c.text }]}>Rate & Review</Text>
              <TouchableOpacity onPress={() => setReviewModal(false)}>
                <Ionicons name="close" size={24} color={c.textSub} />
              </TouchableOpacity>
            </View>

            {/* Stars rating selection */}
            <Text style={[s.label, { color: c.textSub, textAlign: 'center' }]}>Trust & Experience Rating</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={Colors.accent}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { color: c.textSub, marginTop: 12 }]}>Share Details (Comment)</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border, height: 80 }]}
              multiline
              numberOfLines={3}
              placeholder="Excellent communication, tool was in mint condition, highly reliable..."
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholderTextColor={c.textMuted}
            />

            <TouchableOpacity onPress={handleReviewSubmit} disabled={actionLoading} style={{ marginTop: 20 }}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnPrimary}>
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Submit Review</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={disputeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.modalTitle, { color: c.text }]}>Open Dispute ticket</Text>
              <TouchableOpacity onPress={() => setDisputeModal(false)}>
                <Ionicons name="close" size={24} color={c.textSub} />
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: c.textSub }]}>Dispute Description</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Item was dirty or damaged on arrival..."
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholderTextColor={c.textMuted}
            />

            <TouchableOpacity
              onPress={() => setDamageReported(prev => !prev)}
              style={s.checkboxRow}
            >
              <Ionicons
                name={damageReported ? 'checkbox' : 'square-outline'}
                size={20}
                color={Colors.primary}
              />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                Item Damage or Lost Incident
              </Text>
            </TouchableOpacity>

            {damageReported && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.label, { color: c.textSub }]}>Damage Details</Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border, height: 60 }]}
                  multiline
                  placeholder="Scratches on casing, battery doesn't charge..."
                  value={damageDetails}
                  onChangeText={setDamageDetails}
                  placeholderTextColor={c.textMuted}
                />
              </View>
            )}

            <TouchableOpacity onPress={handleDisputeSubmit} disabled={actionLoading} style={{ marginTop: 24 }}>
              <LinearGradient colors={['#EF4444', '#B91C1C']} style={s.btnPrimary}>
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Submit Dispute Ticket</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  tabActive: { borderBottomWidth: 3 },
  tabText: { fontWeight: '700', fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#444' },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  miniTrust: { backgroundColor: Colors.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniTrustText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnWide: { flex: 1, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnMini: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  awaitCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FCD34D12', borderColor: '#FCD34D44', borderWidth: 1, borderRadius: 10, padding: 8, justifyContent: 'space-between' },
  disputeBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, padding: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  shield: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.success + '12', borderRadius: 12, padding: 12, marginTop: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  priceSum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginVertical: 16 },
  btnPrimary: { borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  qrBox: { width: 180, height: 180, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', padding: 10 },
  qrMock: { flexWrap: 'wrap', width: 156, height: 156, justifyContent: 'center', alignContent: 'center', gap: 6 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
});
