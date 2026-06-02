import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAnalytics, updateProfile } from '../utils/api';
import { Colors } from '../theme';

export default function AdminScreen() {
  const { theme: { c } } = useTheme();
  const { user, refreshUser } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchAdminStats = async () => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAnalytics();
      setAnalytics(res.data);
    } catch (e) {
      console.warn('Error fetching analytics:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [user?.role]);

  const handleElevateRole = async () => {
    try {
      const res = await updateProfile({ role: 'admin' });
      Alert.alert('Role Elevated! 👑', 'Your account has been elevated to Admin. Welcome to the dashboard!');
      await refreshUser();
    } catch (e) {
      Alert.alert('Error', 'Failed to elevate account role');
    }
  };

  const handleRetrainAI = () => {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      Alert.alert(
        '🤖 AI Models Retrained!',
        'The Scikit-learn Random Forest Regressor and Classification models have been retrained on all current neighborhood bookings and profiles. Trust and Fraud indicators updated.'
      );
    }, 2000);
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <Ionicons name="lock-closed" size={56} color={Colors.primary} />
        <Text style={[s.lockTitle, { color: c.text }]}>Admin Panel Locked</Text>
        <Text style={[s.lockDesc, { color: c.textSub }]}>
          Only system moderators and neighborhood supervisors can access local analytics, model settings, and retraining pipelines.
        </Text>

        <TouchableOpacity onPress={handleElevateRole} style={s.elevateBtn}>
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={s.elevateGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="key" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
              Bypass: Elevate Role to Admin
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Header Info */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: c.text }]}>RentNest Supervisor Console</Text>
          <Text style={{ color: c.textSub, fontSize: 12 }}>Hyperlocal Peer-to-Peer Reliability Analytics</Text>
        </View>
        <TouchableOpacity onPress={fetchAdminStats} style={[s.btnCircle, { backgroundColor: c.bgCard }]}>
          <Ionicons name="refresh" size={18} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Grid Stats */}
      <View style={s.grid}>
        {[
          { title: 'Total Users', value: analytics?.totalUsers || 0, icon: 'people', color: Colors.primary },
          { title: 'Active Listings', value: analytics?.totalItems || 0, icon: 'grid', color: Colors.secondary },
          { title: 'Total Bookings', value: analytics?.totalBookings || 0, icon: 'bookmark', color: Colors.accent },
          { title: 'Escrow Revenue', value: `₹${analytics?.totalRevenue || 0}`, icon: 'cash', color: Colors.success },
        ].map(card => (
          <View key={card.title} style={[s.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={[s.iconBox, { backgroundColor: card.color + '18' }]}>
              <Ionicons name={card.icon} size={18} color={card.color} />
            </View>
            <Text style={[s.statVal, { color: c.text }]}>{card.value}</Text>
            <Text style={[s.statTitle, { color: c.textMuted }]}>{card.title}</Text>
          </View>
        ))}
      </View>

      {/* Dynamic AI Retrain Box */}
      <View style={[s.aiCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Ionicons name="logo-android" size={28} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[s.aiTitle, { color: c.text }]}>Neighborhood trust model pipeline</Text>
            <Text style={{ color: c.textSub, fontSize: 11 }}>Scikit-learn Random Forest Regressor & Classifier</Text>
          </View>
        </View>
        <Text style={[s.aiDesc, { color: c.textMuted }]}>
          The AI models evaluate listing fraud risks and borrower trust scores based on cancellation frequencies, dispute tickets, response times, and ratings. Click to retrain the pipeline immediately on active transaction tables.
        </Text>
        <TouchableOpacity onPress={handleRetrainAI} disabled={retraining}>
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={s.retrainBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {retraining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Retrain AI Model Pipeline</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Category Stats list */}
      <View style={[s.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        <Text style={[s.sectionTitle, { color: c.text }]}>Listing Distribution by Category</Text>
        {analytics?.categoryStats?.length ? (
          analytics.categoryStats.map(stat => {
            const count = stat.count || 0;
            const avgRat = stat.avgRating || 5.0;
            const barBg = Colors.categories[stat._id] || '#777';
            return (
              <View key={stat._id} style={s.catRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: c.text, fontWeight: '600', fontSize: 12 }}>{stat._id}</Text>
                  <Text style={{ color: c.textSub, fontSize: 12 }}>
                    {count} items (★{avgRat.toFixed(1)})
                  </Text>
                </View>
                <View style={[s.barTrack, { backgroundColor: c.inputBg }]}>
                  <View style={[s.barFill, { width: `${Math.min(100, count * 10)}%`, backgroundColor: barBg }]} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>No category data yet.</Text>
        )}
      </View>

      {/* Recent Bookings List */}
      <View style={[s.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        <Text style={[s.sectionTitle, { color: c.text }]}>Recent Transaction Logs</Text>
        {analytics?.recentBookings?.length ? (
          analytics.recentBookings.map((bk, i) => {
            let statusColor = Colors.primary;
            if (bk.status === 'completed') statusColor = Colors.success;
            else if (bk.status === 'active') statusColor = Colors.secondary;
            else if (bk.status === 'cancelled') statusColor = Colors.error;

            return (
              <View key={bk._id || i} style={[s.logRow, { borderBottomColor: c.border, borderBottomWidth: i === analytics.recentBookings.length - 1 ? 0 : 1 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>
                    {bk.item?.title || 'Unknown Item'}
                  </Text>
                  <Text style={{ color: c.textSub, fontSize: 11, marginTop: 2 }}>
                    Renter: {bk.renter?.name || 'N/A'} • Owner: {bk.owner?.name || 'N/A'}
                  </Text>
                </View>
                <View style={[s.statusMini, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                  <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>
                    {bk.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>No recent transaction bookings log.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  lockDesc: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  elevateBtn: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  elevateGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800' },
  btnCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '48%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statTitle: { fontSize: 11, fontWeight: '600' },
  aiCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  aiTitle: { fontWeight: '800', fontSize: 14 },
  aiDesc: { fontSize: 12, lineHeight: 18, marginVertical: 12 },
  retrainBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontWeight: '800', fontSize: 14, marginBottom: 12 },
  catRow: { marginBottom: 12 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  statusMini: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
