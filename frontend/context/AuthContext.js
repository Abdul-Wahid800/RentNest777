import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, login as apiLogin, register as apiRegister } from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Boot: restore session from storage
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem('rentnest_token');
        if (stored) {
          setToken(stored);
          const res = await getMe();
          setUser(res.data);
          connectSocket(res.data._id);
        }
      } catch {
        await AsyncStorage.removeItem('rentnest_token');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    const { token: tok, user: u } = res.data;
    await AsyncStorage.setItem('rentnest_token', tok);
    setToken(tok);
    setUser(u);
    connectSocket(u.id);
    return u;
  };

  const register = async (name, email, password, phone) => {
    const res = await apiRegister({ name, email, password, phone });
    const { token: tok, user: u, otp_dev } = res.data;
    await AsyncStorage.setItem('rentnest_token', tok);
    setToken(tok);
    setUser(u);
    connectSocket(u.id);
    return { user: u, otp_dev };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('rentnest_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
