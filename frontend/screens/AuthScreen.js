import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Alert, Modal, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { verifyOtp, resendOtp } from '../utils/api';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { theme: { c, Colors, Radius } } = useTheme();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ CLEAN ANIMATION HELPER (FIXES useNativeDriver WARNING)
  const animateFade = (duration = 500) => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false, // 👈 FIXED FOR WEB
    }).start();
  };

  React.useEffect(() => {
    animateFade(700);
  }, [mode]);

  const handleSubmit = async () => {
    if (!email || !password)
      return Alert.alert('Required', 'Email and password are required');

    if (mode === 'register' && !name)
      return Alert.alert('Required', 'Name is required');

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const res = await register(name, email, password, phone);
        setDevOtp(res.otp_dev || '');
        setOtpModal(true);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otp)
      return Alert.alert('Enter OTP', 'Please enter the 6-digit OTP');

    setOtpLoading(true);

    try {
      await verifyOtp({ otp });
      setOtpModal(false);
      Alert.alert('✅ Verified!', 'Your email has been verified.');
    } catch (e) {
      Alert.alert('Invalid OTP', e.response?.data?.error || 'Please try again');
    } finally {
      setOtpLoading(false);
    }
  };

  const INPUT = {
    backgroundColor: c.inputBg,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#3B0D8F', '#0F0F1A', '#0A0F2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll}>

          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Logo */}
            <View style={s.logoWrap}>
              <LinearGradient
                colors={['#7C3AED', '#06B6D4']}
                style={s.logoGrad}
              >
                <Ionicons name="home" size={32} color="#FFF" />
              </LinearGradient>

              <Text style={s.logoText}>RentNest</Text>
              <Text style={s.logoSub}>Your neighborhood sharing hub</Text>
            </View>

            {/* Tabs */}
            <View style={[s.tabWrap, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              {['login', 'register'].map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m);
                    animateFade(400);
                  }}
                  style={[s.tab, mode === m && s.tabActive]}
                >
                  <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Card */}
            <View style={[s.card, { backgroundColor: 'rgba(26,26,46,0.85)', borderColor: c.border }]}>
              
              {mode === 'register' && (
                <>
                  <Text style={s.label}>Full Name</Text>
                  <TextInput style={INPUT} value={name} onChangeText={setName} />
                </>
              )}

              <Text style={s.label}>Email</Text>
              <TextInput style={INPUT} value={email} onChangeText={setEmail} />

              {mode === 'register' && (
                <>
                  <Text style={s.label}>Phone</Text>
                  <TextInput style={INPUT} value={phone} onChangeText={setPhone} />
                </>
              )}

              <Text style={s.label}>Password</Text>
              <TextInput
                style={INPUT}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity onPress={handleSubmit}>
                <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnGrad}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.btnText}>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <Modal visible={otpModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.bgCard }]}>
            
            <Text style={s.modalTitle}>Verify OTP</Text>

            <TextInput
              style={[INPUT, { textAlign: 'center', fontSize: 24 }]}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity onPress={handleOtpVerify}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.btnGrad}>
                {otpLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>Verify</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => resendOtp()}>
              <Text style={{ color: Colors.primaryLight, marginTop: 12 }}>
                Resend OTP
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80 },

  logoWrap: { alignItems: 'center', marginBottom: 30 },
  logoGrad: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 30, fontWeight: '800', color: '#FFF' },
  logoSub: { color: '#aaa', fontSize: 13 },

  tabWrap: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { color: '#888' },
  tabTextActive: { color: '#fff' },

  card: { padding: 20, borderRadius: 20, borderWidth: 1 },

  label: { color: '#aaa', marginBottom: 6 },

  btnGrad: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },

  btnText: { color: '#fff', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end'
  },

  modalCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center'
  }
});