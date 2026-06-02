import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getChatMessages, sendMessage as apiSendMessage } from '../utils/api';
import { getSocket, getRoomId, joinRoom, leaveRoom } from '../utils/socket';
import { Colors } from '../theme';

export default function ChatDetailScreen({ route, navigation }) {
  const { recipientId, recipientName, itemId } = route.params;
  const { theme: { c } } = useTheme();
  const { user } = useAuth();
  const listRef = useRef();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);

  const myId = user?._id || user?.id;
  const room = getRoomId(myId, recipientId);
  const socket = getSocket();

  useEffect(() => {
    // 1. Join Socket Room
    joinRoom(room);

    // 2. Fetch History
    (async () => {
      try {
        const res = await getChatMessages(room);
        setMessages(res.data);
      } catch (err) {
        console.warn('Error fetching messages:', err.message);
      } finally {
        setLoading(false);
      }
    })();

    // 3. Listen for Incoming Messages
    if (socket) {
      socket.on('new_message', (msg) => {
        if (msg.room === room) {
          setMessages(prev => [...prev, msg]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
      });

      socket.on('user_typing', ({ userId, isTyping }) => {
        if (userId === recipientId) {
          setRecipientTyping(isTyping);
        }
      });
    }

    return () => {
      leaveRoom(room);
      if (socket) {
        socket.off('new_message');
        socket.off('user_typing');
      }
    };
  }, [room]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setInputText('');

    const payload = {
      senderId: myId,
      recipientId,
      content: txt,
      type: 'text',
      bookingRef: itemId || null
    };

    if (socket?.connected) {
      socket.emit('send_message', payload);
    } else {
      // Fallback to REST
      (async () => {
        try {
          const res = await apiSendMessage(payload);
          setMessages(prev => [...prev, res.data]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {}
      })();
    }

    // Stop typing
    if (socket) {
      socket.emit('typing', { room, userId: myId, isTyping: false });
      setTyping(false);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    if (!socket) return;
    if (text.length > 0 && !typing) {
      socket.emit('typing', { room, userId: myId, isTyping: true });
      setTyping(true);
    } else if (text.length === 0 && typing) {
      socket.emit('typing', { room, userId: myId, isTyping: false });
      setTyping(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender?._id === myId || item.sender === myId;
    const bubbleBg = isMe ? Colors.primary : c.inputBg;
    const bubbleAlign = isMe ? 'flex-end' : 'flex-start';
    const textColor = isMe ? '#FFF' : c.text;

    return (
      <View style={[s.bubbleContainer, { alignSelf: bubbleAlign }]}>
        <View style={[s.bubble, { backgroundColor: bubbleBg, borderBottomRightRadius: isMe ? 2 : 16, borderBottomLeftRadius: isMe ? 16 : 2 }]}>
          <Text style={[s.msgText, { color: textColor }]}>{item.content}</Text>
        </View>
        <Text style={[s.timeText, { color: c.textMuted }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Custom Header */}
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: c.text }]}>{recipientName}</Text>
          <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700' }}>
            {recipientTyping ? 'typing...' : 'online'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Options', 'Actions block reporting or details')}
          style={s.optionBtn}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={c.textSub} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={c.textMuted} />
              <Text style={{ color: c.textSub, marginTop: 8, fontWeight: '600' }}>Start your borrowing discussion</Text>
              <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                Discuss pickup location, safety tips, and availability details.
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[s.inputBar, { borderTopColor: c.border, backgroundColor: c.bgCard }]}>
        <TextInput
          style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
          placeholder="Type your message..."
          placeholderTextColor={c.textMuted}
          value={inputText}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend} style={s.sendBtn}>
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={s.sendGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="send" size={16} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  optionBtn: { padding: 4 },
  bubbleContainer: { maxWidth: '75%', marginBottom: 12 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgText: { fontSize: 14, lineHeight: 18 },
  timeText: { fontSize: 9, marginTop: 3, alignSelf: 'flex-end', paddingRight: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  sendGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }
});
