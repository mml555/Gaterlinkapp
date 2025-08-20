import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessage, addChat, updateChat } from '../store/slices/chatSlice';
import { ChatMessage, Chat, MessageType } from '../types';

interface SocketMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  messageType: MessageType;
  isRead: boolean;
  metadata?: any;
}

interface TypingData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface MessageStatusUpdate {
  messageId: string;
  chatId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

interface OnlineStatusUpdate {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private onlineUsers: Set<string> = new Set();

  // Event listeners
  private messageListeners: ((message: SocketMessage) => void)[] = [];
  private typingListeners: ((data: TypingData) => void)[] = [];
  private statusListeners: ((data: MessageStatusUpdate) => void)[] = [];
  private onlineStatusListeners: ((data: OnlineStatusUpdate) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  async connect(userId: string, token: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      // In production, this would come from environment variables
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
      
      this.socket = io(socketUrl, {
        auth: {
          token,
          userId,
        },
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('Socket connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionListeners(true);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.handleReconnect();
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.onlineUsers.clear();
      this.typingTimeouts.clear();
      this.notifyConnectionListeners(false);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:new', (message: SocketMessage) => {
      this.handleNewMessage(message);
    });

    this.socket.on('message:status', (data: MessageStatusUpdate) => {
      this.handleMessageStatusUpdate(data);
    });

    // Typing events
    this.socket.on('typing:start', (data: TypingData) => {
      this.handleTypingStart(data);
    });

    this.socket.on('typing:stop', (data: TypingData) => {
      this.handleTypingStop(data);
    });

    // Online status events
    this.socket.on('user:online', (data: OnlineStatusUpdate) => {
      this.handleOnlineStatusUpdate(data);
    });

    this.socket.on('user:offline', (data: OnlineStatusUpdate) => {
      this.handleOnlineStatusUpdate(data);
    });

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.notifyConnectionListeners(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('reconnect', () => {
      console.log('Socket reconnected');
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleNewMessage(message: SocketMessage): void {
    // Add to Redux store
    store.dispatch(addMessage({
      chatId: message.chatId,
      message: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: new Date(message.timestamp),
        messageType: message.messageType,
        isRead: message.isRead,
        metadata: message.metadata,
      },
    }));

    // Notify listeners
    this.messageListeners.forEach(listener => listener(message));
  }

  private handleMessageStatusUpdate(data: MessageStatusUpdate): void {
    // Update message status in Redux store
    store.dispatch(updateMessage({
      chatId: data.chatId,
      messageId: data.messageId,
      updates: {
        isRead: data.status === 'read',
        // Add other status fields if needed
      },
    }));

    // Notify listeners
    this.statusListeners.forEach(listener => listener(data));
  }

  private handleTypingStart(data: TypingData): void {
    // Clear existing timeout for this user
    const timeoutKey = `${data.chatId}-${data.userId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.handleTypingStop(data);
    }, 3000);
    
    this.typingTimeouts.set(timeoutKey, timeout);

    // Notify listeners
    this.typingListeners.forEach(listener => listener(data));
  }

  private handleTypingStop(data: TypingData): void {
    const timeoutKey = `${data.chatId}-${data.userId}`;
    const timeout = this.typingTimeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    // Notify listeners
    this.typingListeners.forEach(listener => listener({ ...data, isTyping: false }));
  }

  private handleOnlineStatusUpdate(data: OnlineStatusUpdate): void {
    if (data.isOnline) {
      this.onlineUsers.add(data.userId);
    } else {
      this.onlineUsers.delete(data.userId);
    }

    // Notify listeners
    this.onlineStatusListeners.forEach(listener => listener(data));
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Public methods for sending events
  sendMessage(message: Omit<SocketMessage, 'id' | 'timestamp'>): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    this.socket.emit('message:send', {
      ...message,
      timestamp: new Date(),
    });
  }

  startTyping(chatId: string, userId: string, userName: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:start', {
      chatId,
      userId,
      userName,
      isTyping: true,
    });
  }

  stopTyping(chatId: string, userId: string, userName: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:stop', {
      chatId,
      userId,
      userName,
      isTyping: false,
    });
  }

  markMessageAsRead(messageId: string, chatId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('message:read', {
      messageId,
      chatId,
      timestamp: new Date(),
    });
  }

  joinChat(chatId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('chat:join', { chatId });
  }

  leaveChat(chatId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('chat:leave', { chatId });
  }

  updateOnlineStatus(isOnline: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('user:status', {
      isOnline,
      timestamp: new Date(),
    });
  }

  // Event listener management
  onMessage(listener: (message: SocketMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onTyping(listener: (data: TypingData) => void): () => void {
    this.typingListeners.push(listener);
    return () => {
      const index = this.typingListeners.indexOf(listener);
      if (index > -1) {
        this.typingListeners.splice(index, 1);
      }
    };
  }

  onMessageStatus(listener: (data: MessageStatusUpdate) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  onOnlineStatus(listener: (data: OnlineStatusUpdate) => void): () => void {
    this.onlineStatusListeners.push(listener);
    return () => {
      const index = this.onlineStatusListeners.indexOf(listener);
      if (index > -1) {
        this.onlineStatusListeners.splice(index, 1);
      }
    };
  }

  onConnection(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  // Mock implementation for development/testing
  private setupMockEvents(): void {
    // Simulate real-time events for development
    if (__DEV__ && !this.socket?.connected) {
      setInterval(() => {
        // Simulate typing events
        if (Math.random() > 0.9) {
          const mockTyping: TypingData = {
            chatId: '1',
            userId: 'admin1',
            userName: 'Admin',
            isTyping: true,
          };
          this.handleTypingStart(mockTyping);
        }
      }, 5000);

      setInterval(() => {
        // Simulate online status updates
        if (Math.random() > 0.8) {
          const mockStatus: OnlineStatusUpdate = {
            userId: 'admin1',
            isOnline: Math.random() > 0.5,
            lastSeen: new Date(),
          };
          this.handleOnlineStatusUpdate(mockStatus);
        }
      }, 10000);
    }
  }
}

export const socketService = new SocketService();
