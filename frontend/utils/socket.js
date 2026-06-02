import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    if (userId) socket.emit('register', userId);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (room) => {
  socket?.emit('join_room', room);
};

export const leaveRoom = (room) => {
  socket?.emit('leave_room', room);
};

export const sendSocketMessage = (data) => {
  socket?.emit('send_message', data);
};

export const emitTyping = (room, userId, isTyping) => {
  socket?.emit('typing', { room, userId, isTyping });
};

export const getRoomId = (userId1, userId2) =>
  [userId1, userId2].sort().join('_');

export default { connectSocket, getSocket, disconnectSocket, joinRoom, leaveRoom, sendSocketMessage, emitTyping, getRoomId };
