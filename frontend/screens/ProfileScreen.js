import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile, recalcTrust } from '../utils/api';
import { Colors } from '../theme';

export default function ProfileScreen() {
  const { theme: { c }, isDark, toggleTheme } = useTheme();
  const { user, setUser, logout } = useAuth();

  // Modals state
  const [walletModal, setWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState('deposit'); // deposit or withdraw
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleUpdateProfile = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    setLoading(true);
    try {
      const res = await updateProfile({ name, phone, bio });
      setUser(res.data);
      setEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletTx = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return Alert.alert('Invalid Amount', 'Please input a valid amount.');
    setLoading(true);
    try {
      const currentBalance = user?.walletBalance || 0;
      let newBalance = currentBalance;
      if (walletAction === 'deposit') {
        newBalance += val;
      } else {
        if (val > currentBalance) {
          Alert.alert('Insufficient Funds', 'Cannot withdraw more than your wallet balance.');
          setLoading(false);
          return;
        }
        newBalance -= val;
      }

      const res = await updateProfile({ walletBalance: newBalance });
      setUser(res.data);
      setWalletModal(false);
      setAmount('');
      Alert.alert('🎉 Wallet Updated', `${walletAction === 'deposit' ? 'Deposited' : 'Withdrawn'} ₹${val} successfully!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update wallet balance');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerVerify = async () => {
    if (user?.isIdVerified) return Alert.alert('Already Verified', 'Your identity is fully verified.');
    Alert.alert('Simulate ID Verification', 'Submit mock Government ID and profile selfie check?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify ID Now',
        onPress: async () => {
          try {
            const res = await updateProfile({ isIdVerified: true });
            setUser(res.data);
            Alert.alert('🎉 ID Verified!', 'Verification check passed. Trust badge added to profile.');
          } catch {}
        }
      }
    ]);
  };

  const handleRecalcTrust = async () => {
    try {
      const res = await recalcTrust(user?._id || user?.id);
      setUser(prev => ({ ...prev, trustScore: res.data.trustScore }));
      Alert.alert('AI Model Triggered', `Trust Score re-evaluated to: ${Math.round(res.data.trustScore)}%`);
    } catch {
      Alert.alert('AI Offline', 'Could not reach Scikit-learn AI server. Defaulting to cached score.');
    }
  };

  // Trust Gauge Rendering Helper
  const score = user?.trustScore || 60;
  let scoreColor = Colors.error;
  let scoreDesc = 'Unreliable / High Risk';
  if (score >= 85) {
    scoreColor = Colors.success;
    scoreDesc = 'Excellent Trustworthiness';
  } else if (score >= 70) {
    scoreColor = Colors.primary;
    scoreDesc = 'Good Neighbor Reliability';
  } else if (score >= 50) {
    scoreColor = Colors.warning;
    scoreDesc = 'Standard Account Rating';
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      {/* Visual Header Card */}
      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.headCard}>
        <View style={s.profileHeader}>
          <View style={[s.avatarCircle, { backgroundColor: '#FFF' }]}>
            <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 32 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.nameText}>{user?.name}</Text>
              {user?.isIdVerified && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondaryLight} />
              )}
            </View>
            <Text style={s.roleText}>{user?.email}</Text>
            {user?.phone ? <Text style={s.phoneText}>📞 {user.phone}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={() => {
              setName(user?.name || '');
              setPhone(user?.phone || '');
              setBio(user?.bio || '');
              setEditModal(true);
            }}
            style={s.editPen}
          >
            <Ionicons name="pencil" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bio text */}
        <Text style={s.bioText}>"{user?.bio || 'Hey neighbor! Ready to rent and lend.'}"</Text>

        {/* Stats segment */}
        <View style={s.statBox}>
          {[
            { label: 'Rented', count: user?.bookingCount || 0 },
            { label: 'Returned', count: user?.completedCount || 0 },
            { label: 'Disputes', count: user?.disputeCount || 0 },
          ].map(st => (
            <View key={st.label} style={s.statUnit}>
              <Text style={s.statCount}>{st.count}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* Trust Score AI Gauge */}
        <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark-sharp" size={18} color={Colors.primary} />
              <Text style={[s.cardTitle, { color: c.text }]}>AI Trust Score Gauge</Text>
            </View>
            <TouchableOpacity onPress={handleRecalcTrust} style={s.recalcBtn}>
              <Ionicons name="sync" size={13} color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700' }}>Re-evaluate</Text>
            </TouchableOpacity>
          </View>

          {/* Graphical Gauge Bar */}
          <View style={s.gaugeWrap}>
            <View style={[s.gaugeTrack, { backgroundColor: c.inputBg }]}>
              <View style={[s.gaugeBar, { width: `${score}%`, backgroundColor: scoreColor }]} />
            </View>
            <Text style={[s.gaugeScore, { color: scoreColor }]}>{Math.round(score)}%</Text>
          </View>
          <Text style={{ color: c.textSub, fontSize: 12, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>
            {scoreDesc}
          </Text>
        </View>

        {/* Hyperlocal Escrow Wallet Card */}
        <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700' }}>HYPERLOCAL WALLET</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <View>
              <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>
                ₹{user?.walletBalance || 0}
              </Text>
              <Text style={{ color: c.textSub, fontSize: 11 }}>Available for deposits & rentals</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setWalletAction('deposit');
                  setAmount('');
                  setWalletModal(true);
                }}
                style={[s.walletBtn, { backgroundColor: Colors.primary }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setWalletAction('withdraw');
                  setAmount('');
                  setWalletModal(true);
                }}
                style={[s.walletBtn, { borderColor: Colors.primary, borderWidth: 1 }]}
              >
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12 }}>Cash Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Verifications list */}
        <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border, gap: 12 }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>Identity & Safety Badges</Text>
          {[
            { key: 'id', title: 'Government ID Check', desc: 'Secure listing safety validator', checked: user?.isIdVerified, action: handleTriggerVerify },
            { key: 'email', title: 'Email Address Verified', desc: user?.email || '', checked: true },
            { key: 'phone', title: 'Phone Verification', desc: user?.phone || 'Not added', checked: !!user?.phone },
          ].map(badge => (
            <View key={badge.key} style={s.badgeRow}>
              <View style={[s.iconBg, { backgroundColor: badge.checked ? Colors.success + '18' : c.inputBg }]}>
                <Ionicons
                  name={badge.checked ? 'shield-checkmark' : 'shield-outline'}
                  size={18}
                  color={badge.checked ? Colors.success : c.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.badgeTitle, { color: c.text }]}>{badge.title}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{badge.desc}</Text>
              </View>
              {badge.action && !badge.checked && (
                <TouchableOpacity onPress={badge.action} style={s.actionBadgeBtn}>
                  <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>Verify</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Settings options */}
        <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border, gap: 12 }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>Preferences & System</Text>

          <TouchableOpacity onPress={toggleTheme} style={s.settingRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={Colors.primary} />
            <Text style={[s.settingText, { color: c.text }]}>
              {isDark ? 'Dark Theme (Active)' : 'Light Theme (Active)'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('App Info', 'RentNest Mobile Web Platform v1.0.0. Powered by advanced peer-to-peer reliability AI.')} style={s.settingRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={[s.settingText, { color: c.text }]}>Version and System logs</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={[s.settingRow, { marginTop: 8 }]}>
            <Ionicons name="log-out" size={20} color={Colors.error} />
            <Text style={[s.settingText, { color: Colors.error, fontWeight: '700' }]}>Sign Out Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.modalTitle, { color: c.text }]}>Edit Profile Info</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={c.textSub} />
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: c.textSub }]}>Full Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={name}
              onChangeText={setName}
            />

            <Text style={[s.label, { color: c.textSub, marginTop: 12 }]}>Phone</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={[s.label, { color: c.textSub, marginTop: 12 }]}>Bio Quote</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border, height: 60 }]}
              multiline
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity onPress={handleUpdateProfile} disabled={loading} style={{ marginTop: 24 }}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnPrimary}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Save Changes</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wallet Deposit/Withdraw Modal */}
      <Modal visible={walletModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.modalTitle, { color: c.text }]}>
                {walletAction === 'deposit' ? 'Simulate Escrow Deposit' : 'Cash Out Wallet Balance'}
              </Text>
              <TouchableOpacity onPress={() => setWalletModal(false)}>
                <Ionicons name="close" size={24} color={c.textSub} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: c.textSub, fontSize: 13, marginBottom: 16 }}>
              {walletAction === 'deposit'
                ? 'Simulate card deposit loading into your escrow balance drawer.'
                : 'Direct immediate cash out back into your linked checking account.'}
            </Text>

            <Text style={[s.label, { color: c.textSub }]}>Amount (₹)</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border, fontSize: 18, fontWeight: '700' }]}
              placeholder="500"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TouchableOpacity onPress={handleWalletTx} disabled={loading} style={{ marginTop: 24 }}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnPrimary}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Submit Payment</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  headCard: { padding: 24, paddingTop: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  profileHeader: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  nameText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  roleText: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
  phoneText: { color: '#FFF', fontSize: 12, marginTop: 4 },
  editPen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF33', alignItems: 'center', justifyContent: 'center' },
  bioText: { color: '#EEE', fontSize: 13, fontStyle: 'italic', marginTop: 16, paddingHorizontal: 4 },
  statBox: { flexDirection: 'row', backgroundColor: '#00000022', borderRadius: 16, padding: 12, marginTop: 20, gap: 12 },
  statUnit: { flex: 1, alignItems: 'center' },
  statCount: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#DDD', fontSize: 10, fontWeight: '600', marginTop: 2 },
  body: { padding: 16, gap: 16, paddingBottom: 60 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle: { fontWeight: '700', fontSize: 14 },
  recalcBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '11', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  gaugeWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  gaugeTrack: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  gaugeBar: { height: '100%', borderRadius: 6 },
  gaugeScore: { fontWeight: '800', fontSize: 18 },
  walletBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontWeight: '700', fontSize: 13 },
  actionBadgeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primary + '18', borderRadius: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  settingText: { flex: 1, fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  btnPrimary: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
});
