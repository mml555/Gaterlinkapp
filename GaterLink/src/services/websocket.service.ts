import io, { Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, setTypingUsers, incrementUnreadCount } from '../store/slices/messagesSlice';
import { updateRequest } from '../store/slices/requestsSlice';
import NotificationService from './notification.service';
import LoggingService from './logging.service';
import { Message, AccessRequest } from '../types';
import { API_CONFIG } from '../constants';

interface WebSocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
  
  // Message events
  newMessage: (data: { chatRoomId: string; message: Message }) => void;
  messageRead: (data: { chatRoomId: string; messageId: string; userId: string }) => void;
  typing: (data: { chatRoomId: string; userId: string; isTyping: boolean }) => void;
  
  // Request events
  requestUpdated: (request: AccessRequest) => void;
  requestAssigned: (data: { requestId: string; adminId: string }) => void;
  
  // Notification events
  notification: (data: { title: string; message: string; type: string; data?: any }) => void;
}

class WebSocketService {
  private socket: Socket<WebSocketEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(authToken: string): void {
    if (this.socket?.connected) {
      LoggingService.info('WebSocket already connected', 'WebSocket');
      return;
    }

    const wsUrl = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    
    this.socket = io(wsUrl, {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
    LoggingService.info('WebSocket connecting...', 'WebSocket', { url: wsUrl });
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      LoggingService.info('WebSocket connected', 'WebSocket');
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      const user = store.getState().auth.user;
      if (user) {
        this.joinRoom(`user:${user.id}`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      LoggingService.warn('WebSocket disconnected', 'WebSocket', { reason });
    });

    this.socket.on('error', (error) => {
      LoggingService.error('WebSocket error', 'WebSocket', error);
    });

    // Message events
    this.socket.on('newMessage', ({ chatRoomId, message }) => {
      LoggingService.info('New message received', 'WebSocket', { chatRoomId, messageId: message.id });
      
      // Add message to store
      store.dispatch(addMessage({ chatRoomId, message }));
      
      // Show notification if app is in background or user is not in chat
      const currentUser = store.getState().auth.user;
      if (message.senderId !== currentUser?.id) {
        store.dispatch(incrementUnreadCount(chatRoomId));
        
        NotificationService.showNotification({
          title: 'New Message',
          body: message.content,
          data: { chatRoomId, messageId: message.id },
        });
      }
    });

    this.socket.on('messageRead', ({ chatRoomId, messageId, userId }) => {
      // Handle message read receipts
      LoggingService.debug('Message read', 'WebSocket', { chatRoomId, messageId, userId });
    });

    this.socket.on('typing', ({ chatRoomId, userId, isTyping }) => {
      const typingUsers = store.getState().messages.typingUsers[chatRoomId] || [];
      
      if (isTyping && !typingUsers.includes(userId)) {
        store.dispatch(setTypingUsers({ 
          chatRoomId, 
          userIds: [...typingUsers, userId] 
        }));
      } else if (!isTyping && typingUsers.includes(userId)) {
        store.dispatch(setTypingUsers({ 
          chatRoomId, 
          userIds: typingUsers.filter(id => id !== userId) 
        }));
      }
    });

    // Request events
    this.socket.on('requestUpdated', (request) => {
      LoggingService.info('Request updated', 'WebSocket', { requestId: request.id, status: request.status });
      store.dispatch(updateRequest(request));
      
      // Show notification
      NotificationService.showNotification({
        title: 'Request Updated',
        body: `Your request has been ${request.status}`,
        data: { requestId: request.id },
      });
    });

    this.socket.on('requestAssigned', ({ requestId, adminId }) => {
      LoggingService.info('Request assigned', 'WebSocket', { requestId, adminId });
      
      NotificationService.showNotification({
        title: 'Request Assigned',
        body: 'An admin has been assigned to your request',
        data: { requestId },
      });
    });

    // Notification events
    this.socket.on('notification', ({ title, message, type, data }) => {
      NotificationService.showNotification({
        title,
        body: message,
        data: { ...data, type },
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      LoggingService.info('WebSocket disconnected', 'WebSocket');
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      LoggingService.warn('Cannot join room - WebSocket not connected', 'WebSocket');
      return;
    }

    this.socket.emit('joinRoom', roomId);
    LoggingService.info('Joined room', 'WebSocket', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      LoggingService.warn('Cannot leave room - WebSocket not connected', 'WebSocket');
      return;
    }

    this.socket.emit('leaveRoom', roomId);
    LoggingService.info('Left room', 'WebSocket', { roomId });
  }

  /**
   * Send a message
   */
  sendMessage(chatRoomId: string, message: Omit<Message, 'id' | 'timestamp'>): void {
    if (!this.socket?.connected) {
      LoggingService.warn('Cannot send message - WebSocket not connected', 'WebSocket');
      return;
    }

    this.socket.emit('sendMessage', { chatRoomId, message });
    LoggingService.info('Message sent', 'WebSocket', { chatRoomId });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(chatRoomId: string, messageId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('markRead', { chatRoomId, messageId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatRoomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    // Clear existing typing timer for this room
    const existingTimer = this.typingTimers.get(chatRoomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.typingTimers.delete(chatRoomId);
    }

    this.socket.emit('typing', { chatRoomId, isTyping });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timer = setTimeout(() => {
        this.sendTyping(chatRoomId, false);
      }, 3000);
      this.typingTimers.set(chatRoomId, timer);
    }
  }

  /**
   * Update request status (admin only)
   */
  updateRequestStatus(requestId: string, status: string, adminNotes?: string): void {
    if (!this.socket?.connected) {
      LoggingService.warn('Cannot update request - WebSocket not connected', 'WebSocket');
      return;
    }

    this.socket.emit('updateRequest', { requestId, status, adminNotes });
    LoggingService.info('Request update sent', 'WebSocket', { requestId, status });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new WebSocketService();