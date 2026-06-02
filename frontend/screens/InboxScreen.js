import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getChatRooms, getNotifications, markAllRead } from '../utils/api';
import { Colors } from '../theme';

export default function InboxScreen({ navigation }) {
  const { theme: { c } } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('chats'); // chats or notifications
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInboxData = async (showPulse = true) => {
    if (showPulse) setLoading(true);
    try {
      if (activeTab === 'chats') {
        const res = await getChatRooms();
        setRooms(res.data || []);
      } else {
        const res = await getNotifications();
        setNotifications(res.data.notifications || []);
        setUnreadNotifs(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Inbox error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInboxData(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setUnreadNotifs(0);
      fetchInboxData(false);
    } catch {}
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'booking_request':
      case 'booking_approved':
      case 'booking_rejected':
        return { name: 'calendar', color: Colors.primary };
      case 'payment_received':
        return { name: 'cash', color: Colors.success };
      case 'chat':
        return { name: 'chatbubbles', color: Colors.secondary };
      case 'review':
        return { name: 'star', color: Colors.accent };
      default:
        return { name: 'notifications', color: Colors.info };
    }
  };

  const renderChatRoom = ({ item }) => {
    const partner = item.other;
    const lastMsg = item.lastMessage;
    if (!partner) return null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat', {
          recipientId: partner._id,
          recipientName: partner.name
        })}
        style={[s.roomCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
      >
        <View style={[s.avatar, { backgroundColor: Colors.primary }]}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
            {partner.name[0]?.toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[s.roomName, { color: c.text }]}>{partner.name}</Text>
              {partner.trustScore && (
                <View style={s.trustBadge}>
                  <Text style={s.trustBadgeText}>{Math.round(partner.trustScore)}% Trust</Text>
                </View>
              )}
            </View>
            <Text style={{ color: c.textMuted, fontSize: 10 }}>
              {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <Text style={[s.lastMsg, { color: item.unreadCount > 0 ? c.text : c.textSub }]} numberOfLines={1}>
            {lastMsg.content}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }) => {
    const icon = getNotifIcon(item.type);
    return (
      <View style={[s.notifCard, { backgroundColor: c.bgCard, borderColor: c.border }, !item.isRead && s.unreadNotifCard]}>
        <View style={[s.notifIconBox, { backgroundColor: icon.color + '18' }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.notifTitle, { color: c.text }]}>{item.title}</Text>
          <Text style={[s.notifBody, { color: c.textSub }]}>{item.body}</Text>
          <Text style={{ color: c.textMuted, fontSize: 9, marginTop: 4 }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Tab Switcher */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('chats')}
          style={[s.tab, activeTab === 'chats' && [s.tabActive, { borderBottomColor: Colors.primary }]]}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={activeTab === 'chats' ? Colors.primary : c.textSub} />
          <Text style={[s.tabText, { color: activeTab === 'chats' ? Colors.primary : c.textSub }]}>Conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          style={[s.tab, activeTab === 'notifications' && [s.tabActive, { borderBottomColor: Colors.primary }]]}
        >
          <Ionicons name="notifications-outline" size={18} color={activeTab === 'notifications' ? Colors.primary : c.textSub} />
          <Text style={[s.tabText, { color: activeTab === 'notifications' ? Colors.primary : c.textSub }]}>Alerts</Text>
          {unreadNotifs > 0 && (
            <View style={s.notifCountBadge}>
              <Text style={s.notifCountText}>{unreadNotifs}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Header Utilities */}
      {activeTab === 'notifications' && unreadNotifs > 0 && (
        <View style={s.utilRow}>
          <Text style={{ color: c.textSub, fontSize: 12 }}>{unreadNotifs} unread alerts</Text>
          <TouchableOpacity onPress={handleMarkAllRead} style={s.markReadBtn}>
            <Ionicons name="checkmark-done" size={14} color={Colors.primary} />
            <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'chats' ? rooms : notifications}
          keyExtractor={item => item._id}
          renderItem={activeTab === 'chats' ? renderChatRoom : renderNotification}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={[s.center, { marginTop: 60 }]}>
              <Ionicons name={activeTab === 'chats' ? 'chatbox-ellipses-outline' : 'notifications-off-outline'} size={48} color={c.textMuted} />
              <Text style={[s.emptyText, { color: c.textSub }]}>
                {activeTab === 'chats' ? 'No chats started yet' : 'No alerts'}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {activeTab === 'chats'
                  ? 'Message lenders nearby to negotiate borrow schedules!'
                  : 'Check here for booking requests, returns, and system alerts.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, position: 'relative' },
  tabActive: { borderBottomWidth: 3 },
  tabText: { fontWeight: '700', fontSize: 14 },
  roomCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roomName: { fontWeight: '700', fontSize: 15 },
  trustBadge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trustBadgeText: { color: Colors.primary, fontSize: 9, fontWeight: '700' },
  lastMsg: { fontSize: 12, marginTop: 4 },
  unreadBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  notifCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  unreadNotifCard: { borderLeftWidth: 4, borderLeftColor: Colors.primary },
  notifIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontWeight: '700', fontSize: 13 },
  notifBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  utilRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notifCountBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 10, right: 30 },
  notifCountText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  emptyText: { fontSize: 15, fontWeight: '700', marginTop: 10 },
});
