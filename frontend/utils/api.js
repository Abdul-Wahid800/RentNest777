import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Smart URL detection:
// - On web (Render): use same-origin relative path so frontend & backend share the domain
// - On native (Expo Go / APK): use env variable or fallback to localhost for local dev
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    // On web, use relative URL — works on Render because backend serves frontend too
    // Or use the explicit Render backend URL if frontend is on a separate static service
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // If running on localhost (dev), use localhost:5000
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    // On Render production — use same origin (backend serves frontend)
    return `${origin}/api`;
  }
  // Native: use env var or localhost for dev
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const BASE_URL = getBaseURL();

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Inject JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('rentnest_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login    = (data) => api.post('/auth/login', data);
export const getMe    = ()     => api.get('/auth/me');
export const updateProfile  = (data) => api.put('/auth/profile', data);
export const verifyOtp      = (data) => api.post('/auth/verify-otp', data);
export const resendOtp      = ()     => api.post('/auth/resend-otp');
export const changePassword = (data) => api.put('/auth/change-password', data);

// Items
export const getItems       = (params) => api.get('/items', { params });
export const getTrending    = ()        => api.get('/items/trending');
export const getCategories  = ()        => api.get('/items/categories');
export const getItem        = (id)      => api.get(`/items/${id}`);
export const createItem     = (data)    => api.post('/items', data);
export const updateItem     = (id, data)=> api.put(`/items/${id}`, data);
export const deleteItem     = (id)      => api.delete(`/items/${id}`);
export const getUserItems   = (userId)  => api.get(`/items/user/${userId}`);
export const toggleWishlist = (id)      => api.post(`/items/${id}/wishlist`);

// Bookings
export const createBooking  = (data)    => api.post('/bookings', data);
export const getBookings    = (params)  => api.get('/bookings', { params });
export const getBooking     = (id)      => api.get(`/bookings/${id}`);
export const approveBooking = (id)      => api.put(`/bookings/${id}/approve`);
export const rejectBooking  = (id, data)=> api.put(`/bookings/${id}/reject`, data);
export const payBooking     = (id)      => api.put(`/bookings/${id}/pay`);
export const cancelBooking  = (id, data)=> api.put(`/bookings/${id}/cancel`, data);
export const confirmPickup  = (id)      => api.put(`/bookings/${id}/pickup-confirm`);
export const confirmReturn  = (id)      => api.put(`/bookings/${id}/return-confirm`);
export const submitReview   = (id, data)=> api.post(`/bookings/${id}/review`, data);
export const fileDispute    = (id, data)=> api.put(`/bookings/${id}/dispute`, data);

// Chats & Notifications
export const getChatRooms      = ()         => api.get('/chats');
export const getChatMessages   = (room, p)  => api.get(`/chats/${room}`, { params: p });
export const sendMessage       = (data)     => api.post('/chats/send', data);
export const getNotifications  = (p)        => api.get('/chats/notifications/all', { params: p });
export const markAllRead       = ()         => api.put('/chats/notifications/read-all');

// AI & Analytics
export const recalcTrust    = (userId)  => api.post(`/ai/trust/${userId}`);
export const checkFraud     = (data)    => api.post('/ai/fraud-check', data);
export const getRecommended = (data)    => api.post('/ai/recommendations', data);
export const getDynamicPrice= (data)    => api.post('/ai/dynamic-price', data);
export const getAnalytics   = ()        => api.get('/ai/analytics');
export const submitReport   = (data)    => api.post('/ai/report', data);

export default api;
