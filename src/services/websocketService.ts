import { firebaseService } from './firebaseService';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

interface WebSocketCallbacks {
  onEmergencyUpdate?: (emergency: any) => void;
  onHoldUpdate?: (hold: any) => void;
  onEquipmentUpdate?: (equipment: any) => void;
  onRequestUpdate?: (request: any) => void;
  onNotification?: (notification: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private callbacks: WebSocketCallbacks = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  constructor() {
    this.setupFirebaseAuthListener();
  }

  private setupFirebaseAuthListener() {
    firebaseService.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        this.connect();
      } else {
        this.userId = null;
        this.disconnect();
      }
    });
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get Firebase auth token for authentication
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Connect to WebSocket server (replace with your WebSocket server URL)
      const wsUrl = `wss://your-websocket-server.com/ws?token=${token}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleOpen(event: Event) {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.callbacks.onConnectionChange?.(true);
    
    // Send user identification
    this.sendMessage({
      type: 'user_identify',
      data: { userId: this.userId },
      timestamp: new Date()
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isConnecting = false;
    this.stopHeartbeat();
    this.callbacks.onConnectionChange?.(false);

    if (event.code !== 1000) { // Not a normal closure
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.callbacks.onError?.('WebSocket connection error');
  }

  private processMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'emergency_update':
        this.callbacks.onEmergencyUpdate?.(message.data);
        break;
      case 'hold_update':
        this.callbacks.onHoldUpdate?.(message.data);
        break;
      case 'equipment_update':
        this.callbacks.onEquipmentUpdate?.(message.data);
        break;
      case 'request_update':
        this.callbacks.onRequestUpdate?.(message.data);
        break;
      case 'notification':
        this.callbacks.onNotification?.(message.data);
        break;
      case 'heartbeat':
        // Respond to heartbeat
        this.sendMessage({
          type: 'heartbeat_ack',
          data: { timestamp: new Date() },
          timestamp: new Date()
        });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: 'heartbeat',
        data: { timestamp: new Date() },
        timestamp: new Date()
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  subscribeToUpdates(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  unsubscribeFromUpdates(): void {
    this.callbacks = {};
  }

  subscribeToEmergencyUpdates(siteId?: string): void {
    this.sendMessage({
      type: 'subscribe_emergencies',
      data: { siteId, userId: this.userId },
      timestamp: new Date()
    });
  }

  subscribeToHoldUpdates(siteId?: string): void {
    this.sendMessage({
      type: 'subscribe_holds',
      data: { siteId, userId: this.userId },
      timestamp: new Date()
    });
  }

  subscribeToEquipmentUpdates(siteId?: string): void {
    this.sendMessage({
      type: 'subscribe_equipment',
      data: { siteId, userId: this.userId },
      timestamp: new Date()
    });
  }

  subscribeToRequestUpdates(siteId?: string): void {
    this.sendMessage({
      type: 'subscribe_requests',
      data: { siteId, userId: this.userId },
      timestamp: new Date()
    });
  }

  unsubscribeFromUpdates(type: string, siteId?: string): void {
    this.sendMessage({
      type: `unsubscribe_${type}`,
      data: { siteId, userId: this.userId },
      timestamp: new Date()
    });
  }

  sendEmergencyAlert(emergency: any): void {
    this.sendMessage({
      type: 'emergency_alert',
      data: emergency,
      timestamp: new Date(),
      userId: this.userId || undefined
    });
  }

  sendHoldNotification(hold: any): void {
    this.sendMessage({
      type: 'hold_notification',
      data: hold,
      timestamp: new Date(),
      userId: this.userId || undefined
    });
  }

  sendEquipmentStatusUpdate(equipment: any): void {
    this.sendMessage({
      type: 'equipment_status_update',
      data: equipment,
      timestamp: new Date(),
      userId: this.userId || undefined
    });
  }

  sendRequestStatusUpdate(request: any): void {
    this.sendMessage({
      type: 'request_status_update',
      data: request,
      timestamp: new Date(),
      userId: this.userId || undefined
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    this.stopHeartbeat();
    this.isConnecting = false;
    this.callbacks.onConnectionChange?.(false);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected()) return 'connected';
    return 'disconnected';
  }
}

export const websocketService = new WebSocketService();
