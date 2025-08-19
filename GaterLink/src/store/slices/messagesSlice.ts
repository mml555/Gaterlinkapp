import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ChatRoom } from '../../types';

interface MessagesState {
  chatRooms: ChatRoom[];
  messages: Record<string, Message[]>; // chatRoomId -> messages
  typingUsers: Record<string, string[]>; // chatRoomId -> userIds
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  chatRooms: [],
  messages: {},
  typingUsers: {},
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setChatRooms: (state, action: PayloadAction<ChatRoom[]>) => {
      state.chatRooms = action.payload;
    },
    addChatRoom: (state, action: PayloadAction<ChatRoom>) => {
      state.chatRooms.push(action.payload);
    },
    updateChatRoom: (state, action: PayloadAction<ChatRoom>) => {
      const index = state.chatRooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.chatRooms[index] = action.payload;
      }
    },
    setMessages: (state, action: PayloadAction<{ chatRoomId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatRoomId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<{ chatRoomId: string; message: Message }>) => {
      if (!state.messages[action.payload.chatRoomId]) {
        state.messages[action.payload.chatRoomId] = [];
      }
      state.messages[action.payload.chatRoomId].push(action.payload.message);
      
      // Update chat room's last message
      const chatRoom = state.chatRooms.find(r => r.id === action.payload.chatRoomId);
      if (chatRoom) {
        chatRoom.lastMessage = action.payload.message;
        chatRoom.updatedAt = new Date();
      }
    },
    markMessageAsRead: (state, action: PayloadAction<{ chatRoomId: string; messageId: string }>) => {
      const messages = state.messages[action.payload.chatRoomId];
      if (messages) {
        const message = messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.isRead = true;
        }
      }
    },
    setTypingUsers: (state, action: PayloadAction<{ chatRoomId: string; userIds: string[] }>) => {
      state.typingUsers[action.payload.chatRoomId] = action.payload.userIds;
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatRoom = state.chatRooms.find(r => r.id === action.payload);
      if (chatRoom) {
        chatRoom.unreadCount++;
      }
    },
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const chatRoom = state.chatRooms.find(r => r.id === action.payload);
      if (chatRoom) {
        chatRoom.unreadCount = 0;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setChatRooms,
  addChatRoom,
  updateChatRoom,
  setMessages,
  addMessage,
  markMessageAsRead,
  setTypingUsers,
  incrementUnreadCount,
  resetUnreadCount,
  setLoading,
  setError,
} = messagesSlice.actions;

export default messagesSlice.reducer;