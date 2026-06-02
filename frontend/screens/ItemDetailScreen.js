import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getItem, createBooking, toggleWishlist, submitReport, checkFraud } from '../utils/api';
import { Colors } from '../theme';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600';

function StarRating({ rating }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={14} color={Colors.accent} />
      ))}
    </View>
  );
}

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const { theme: { c, Colors: C, Radius } } = useTheme();
  const { user } = useAuth();

  const [item, setItem]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [imgIndex, setImgIndex]   = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [bookModal, setBookModal] = useState(false);
  const [rentalType, setRentalType] = useState('daily');
  const [duration, setDuration]   = useState('1');
  const [booking, setBooking]     = useState(false);
  const [fraudRisk, setFraudRisk] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getItem(itemId);
        setItem(res.data);
        // Run fraud check
        try {
          const fr = await checkFraud({ itemId });
          setFraudRisk(fr.data.riskLevel);
        } catch {}
      } catch {
        Alert.alert('Error', 'Could not load item');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  const handleWishlist = async () => {
    try {
      const res = await toggleWishlist(itemId);
      setWishlisted(res.data.wishlisted);
    } catch {}
  };

  const handleBook = async () => {
    if (!user) return Alert.alert('Login Required', 'Please log in to book items');
    const dur = parseInt(duration) || 1;
    const start = new Date();
    const end = new Date();
    if (rentalType === 'hourly') end.setHours(end.getHours() + dur);
    else end.setDate(end.getDate() + dur);

    setBooking(true);
    try {
      const res = await createBooking({
        itemId, rentalType, startTime: start.toISOString(), endTime: end.toISOString()
      });
      setBookModal(false);
      Alert.alert('✅ Booking Sent!',
        `Your request for "${item.title}" has been sent. Owner will respond shortly.`,
        [{ text: 'View Bookings', onPress: () => navigation.navigate('Bookings') }, { text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const price = rentalType === 'hourly' ? item.hourlyRate : item.dailyRate;
  const dur = parseInt(duration) || 1;
  const total = (price * dur) + item.securityDeposit;
  const imgs = item.images?.length ? item.images : [PLACEHOLDER];

  const riskColor = { Low: Colors.success, Medium: Colors.warning, High: Colors.error };
  const riskIcon  = { Low: 'shield-checkmark', Medium: 'warning', High: 'alert-circle' };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image Gallery */}
        <View style={s.imgWrap}>
          <Image source={{ uri: imgs[imgIndex] }} style={s.heroImg} resizeMode="cover" />
          <LinearGradient colors={['#00000055', 'transparent', 'transparent', '#000000AA']}
            style={StyleSheet.absoluteFill} />
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          {/* Wishlist */}
          <TouchableOpacity onPress={handleWishlist} style={s.wishBtn}>
            <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={22} color={wishlisted ? Colors.error : '#FFF'} />
          </TouchableOpacity>
          {/* Image dots */}
          {imgs.length > 1 && (
            <View style={s.imgDots}>
              {imgs.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setImgIndex(i)}>
                  <View style={[s.dot, i === imgIndex && s.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Category badge */}
          <View style={[s.catBadge, { backgroundColor: (Colors.categories[item.category] || '#888') + 'CC' }]}>
            <Text style={s.catBadgeText}>{item.category}</Text>
          </View>
        </View>

        <View style={[s.body, { backgroundColor: c.bg }]}>

          {/* Fraud Risk Banner */}
          {fraudRisk && fraudRisk !== 'Low' && (
            <View style={[s.riskBanner, { backgroundColor: riskColor[fraudRisk] + '18', borderColor: riskColor[fraudRisk] + '44' }]}>
              <Ionicons name={riskIcon[fraudRisk]} size={16} color={riskColor[fraudRisk]} />
              <Text style={[s.riskText, { color: riskColor[fraudRisk] }]}>
                AI Risk Assessment: {fraudRisk} Risk — Proceed with caution
              </Text>
            </View>
          )}

          {/* Title + Rating */}
          <Text style={[s.title, { color: c.text }]}>{item.title}</Text>
          <View style={s.ratingRow}>
            <StarRating rating={item.avgRating || 5} />
            <Text style={[s.ratingText, { color: c.textSub }]}>
              {item.avgRating?.toFixed(1) || '5.0'} ({item.totalRatings || 0} reviews)
            </Text>
            <View style={[s.condBadge, { backgroundColor: Colors.info + '22' }]}>
              <Text style={{ color: Colors.info, fontSize: 11, fontWeight: '600' }}>{item.condition}</Text>
            </View>
          </View>

          {/* Price cards */}
          <View style={s.priceRow}>
            <View style={[s.priceCard, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '33' }]}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Per Hour</Text>
              <Text style={[s.priceVal, { color: Colors.primary }]}>₹{item.hourlyRate}</Text>
            </View>
            <View style={[s.priceCard, { backgroundColor: Colors.secondary + '18', borderColor: Colors.secondary + '33' }]}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Per Day</Text>
              <Text style={[s.priceVal, { color: Colors.secondary }]}>₹{item.dailyRate}</Text>
            </View>
            <View style={[s.priceCard, { backgroundColor: Colors.accent + '18', borderColor: Colors.accent + '33' }]}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Deposit</Text>
              <Text style={[s.priceVal, { color: Colors.accent }]}>₹{item.securityDeposit}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={[s.section, { borderTopColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Description</Text>
            <Text style={[s.desc, { color: c.textSub }]}>{item.description || 'No description provided.'}</Text>
          </View>

          {/* Owner Card */}
          {item.owner && (
            <View style={[s.ownerCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[s.ownerAvatar, { backgroundColor: Colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 18 }}>
                  {item.owner.name?.[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.ownerName, { color: c.text }]}>{item.owner.name}</Text>
                  {item.owner.isIdVerified && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>
                    Trust Score: {Math.round(item.owner.trustScore || 60)}%
                  </Text>
                </View>
                <StarRating rating={item.owner.avgRating || 5} />
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Chat', {
                  recipientId: item.owner._id,
                  recipientName: item.owner.name,
                  itemId: item._id
                })}
                style={[s.msgBtn, { backgroundColor: Colors.primary }]}>
                <Ionicons name="chatbubble" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Availability */}
          <View style={[s.section, { borderTopColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Availability</Text>
            <View style={[s.availRow, { backgroundColor: item.isAvailable ? Colors.success + '18' : Colors.error + '18' }]}>
              <Ionicons name={item.isAvailable ? 'checkmark-circle' : 'close-circle'} size={20}
                color={item.isAvailable ? Colors.success : Colors.error} />
              <Text style={{ color: item.isAvailable ? Colors.success : Colors.error, fontWeight: '600', marginLeft: 8 }}>
                {item.isAvailable ? 'Available Now' : 'Currently Rented'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { label: 'Total Rentals', value: item.totalRentals || 0, icon: 'repeat' },
              { label: 'Views', value: item.viewCount || 0, icon: 'eye' },
              { label: 'Avg Rating', value: (item.avgRating || 5).toFixed(1), icon: 'star' },
            ].map(stat => (
              <View key={stat.label} style={[s.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                <Ionicons name={stat.icon} size={18} color={Colors.primary} />
                <Text style={[s.statValue, { color: c.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* Book Now CTA */}
      {item.isAvailable && item.owner?._id !== user?._id && item.owner?._id !== user?.id && (
        <View style={[s.cta, { backgroundColor: c.bg, borderTopColor: c.border }]}>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Starting from</Text>
            <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: '800' }}>
              ₹{Math.min(item.hourlyRate || 999, item.dailyRate || 999)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setBookModal(true)} style={{ flex: 1, marginLeft: 16 }}>
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.bookBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="calendar" size={18} color="#FFF" />
              <Text style={s.bookBtnText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Modal */}
      <Modal visible={bookModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[s.modalTitle, { color: c.text }]}>Book: {item?.title}</Text>

            {/* Rental Type */}
            <Text style={[s.label, { color: c.textSub }]}>Rental Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['hourly', 'daily'].map(t => (
                <TouchableOpacity key={t} onPress={() => setRentalType(t)}
                  style={[s.typeBtn, rentalType === t && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                    { borderColor: c.border }]}>
                  <Ionicons name={t === 'hourly' ? 'time' : 'calendar'} size={16} color={rentalType === t ? '#FFF' : c.textSub} />
                  <Text style={{ color: rentalType === t ? '#FFF' : c.textSub, fontWeight: '600', fontSize: 14 }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text style={[s.label, { color: c.textSub }]}>Duration ({rentalType === 'hourly' ? 'hours' : 'days'})</Text>
            <TextInput
              style={[s.durInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={duration} onChangeText={setDuration}
              keyboardType="numeric" placeholder="1"
              placeholderTextColor={c.textMuted}
            />

            {/* Price breakdown */}
            <View style={[s.priceBreak, { backgroundColor: c.bg, borderColor: c.border }]}>
              <View style={s.priceBreakRow}>
                <Text style={{ color: c.textSub }}>Rental ({dur} {rentalType === 'hourly' ? 'hrs' : 'days'})</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>₹{price * dur}</Text>
              </View>
              <View style={s.priceBreakRow}>
                <Text style={{ color: c.textSub }}>Security Deposit</Text>
                <Text style={{ color: Colors.accent, fontWeight: '600' }}>₹{item.securityDeposit}</Text>
              </View>
              <View style={[s.priceBreakRow, { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10, marginTop: 6 }]}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Total</Text>
                <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 18 }}>₹{total}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleBook} disabled={booking}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.confirmBtn}>
                {booking ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={s.confirmBtnText}>Send Booking Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBookModal(false)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: c.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgWrap:       { height: 300, position: 'relative' },
  heroImg:       { width: '100%', height: '100%' },
  backBtn:       { position: 'absolute', top: 48, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
  wishBtn:       { position: 'absolute', top: 48, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
  imgDots:       { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF55' },
  dotActive:     { backgroundColor: '#FFF', width: 20 },
  catBadge:      { position: 'absolute', bottom: 16, left: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catBadgeText:  { color: '#FFF', fontSize: 12, fontWeight: '700' },
  body:          { padding: 20, paddingBottom: 120 },
  riskBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 14 },
  riskText:      { fontSize: 13, fontWeight: '600', flex: 1 },
  title:         { fontSize: 24, fontWeight: '800', marginBottom: 8, lineHeight: 30 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingText:    { fontSize: 13 },
  condBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priceRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  priceCard:     { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  priceVal:      { fontSize: 18, fontWeight: '800', marginTop: 4 },
  section:       { borderTopWidth: 1, paddingTop: 16, marginBottom: 16 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  desc:          { fontSize: 14, lineHeight: 22 },
  ownerCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  ownerAvatar:   { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  ownerName:     { fontSize: 15, fontWeight: '700' },
  msgBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  availRow:      { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12 },
  statsRow:      { flexDirection: 'row', gap: 10 },
  statCard:      { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  statValue:     { fontSize: 18, fontWeight: '800' },
  statLabel:     { fontSize: 11, textAlign: 'center' },
  cta:           { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1 },
  bookBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  bookBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay:  { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard:     { borderRadius: 24, borderWidth: 1, margin: 12, padding: 24 },
  modalTitle:    { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label:         { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  durInput:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, textAlign: 'center', marginBottom: 16 },
  priceBreak:    { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16, gap: 8 },
  priceBreakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn:    { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnText:{ color: '#FFF', fontSize: 16, fontWeight: '700' },
});
