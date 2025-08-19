import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Chat, ChatMessage } from '../../types';
import { chatService } from '../../services/chatService';

// Async thunks
export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const conversations = await chatService.getConversations(userId);
      return conversations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chats');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const messages = await chatService.getMessages(conversationId);
      return { conversationId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, senderId, senderName, content, type = 'text', metadata }: {
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    metadata?: any;
  }, { rejectWithValue }) => {
    try {
      const message = await chatService.sendMessage(conversationId, senderId, senderName, content, type, metadata);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markAsRead',
  async ({ conversationId, userId }: { conversationId: string; userId: string }, { rejectWithValue }) => {
    try {
      await chatService.markMessagesAsRead(conversationId, userId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark messages as read');
    }
  }
);

// Initial state
const initialState: ChatState = {
  chats: [],
  messages: {},
  isLoading: false,
  error: null,
  activeChat: null,
};

// Chat slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
    },
    clearActiveChat: (state) => {
      state.activeChat = null;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: ChatMessage }>) => {
      const { chatId, message } = action.payload;
      
      // Add message to messages array
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update chat's last message and unread count
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        if (!message.isRead) {
          state.chats[chatIndex].unreadCount += 1;
        }
      }
    },
    updateMessage: (state, action: PayloadAction<{ chatId: string; messageId: string; updates: Partial<ChatMessage> }>) => {
      const { chatId, messageId, updates } = action.payload;
      
      if (state.messages[chatId]) {
        const messageIndex = state.messages[chatId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex] = { ...state.messages[chatId][messageIndex], ...updates };
        }
      }
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      const existingIndex = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (existingIndex === -1) {
        state.chats.unshift(action.payload);
      }
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = action.payload;
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.messages[chatId] = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        // Transform Conversation[] to Chat[] by adding missing fields
        state.chats = action.payload.map(conversation => ({
          id: conversation.id,
          requestId: conversation.id, // Use conversation id as requestId for now
          participants: conversation.participants,
          lastMessage: conversation.lastMessage ? {
            id: conversation.lastMessage.id,
            chatId: conversation.lastMessage.conversationId,
            senderId: conversation.lastMessage.senderId,
            senderName: conversation.lastMessage.senderName,
            content: conversation.lastMessage.content,
            timestamp: conversation.lastMessage.timestamp,
            messageType: conversation.lastMessage.type as any,
            isRead: conversation.lastMessage.read,
            metadata: conversation.lastMessage.metadata,
          } : undefined,
          unreadCount: conversation.unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        }));
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        // Transform Message[] to ChatMessage[] by adding missing fields
        state.messages[conversationId] = messages.map(message => ({
          id: message.id,
          chatId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          messageType: message.type as any,
          isRead: message.read,
          metadata: message.metadata,
        }));
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const message = action.payload;
        const conversationId = message.conversationId;
        
        // Transform and add message to messages array
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        const transformedMessage = {
          id: message.id,
          chatId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          messageType: message.type as any,
          isRead: message.read,
          metadata: message.metadata,
        };
        state.messages[conversationId].push(transformedMessage);
        
        // Update chat's last message
        const chatIndex = state.chats.findIndex(chat => chat.id === conversationId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = transformedMessage;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const conversationId = action.payload;
        
        // Mark all messages in the chat as read
        if (state.messages[conversationId]) {
          state.messages[conversationId].forEach(message => {
            message.isRead = true;
          });
        }
        
        // Update chat's unread count
        const chatIndex = state.chats.findIndex(chat => chat.id === conversationId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setActiveChat, 
  clearActiveChat, 
  addMessage, 
  updateMessage,
  addChat,
  updateChat,
  clearMessages
} = chatSlice.actions;

export default chatSlice.reducer;
