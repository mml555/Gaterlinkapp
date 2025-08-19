import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { 
  AndroidImportance, 
  AndroidStyle,
  EventType,
  Notification,
  NotificationAndroid,
  NotificationIOS,
  TriggerType,
} from '@notifee/react-native';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { STORAGE_KEYS, NOTIFICATION_TYPES } from '../constants';
import LoggingService from './logging.service';
import PermissionService from './permission.service';

interface NotificationData {
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: string;
  category?: string;
}

class NotificationService {
  private fcmToken: string | null = null;
  private notificationListener: (() => void) | null = null;
  private appStateListener: ((state: AppStateStatus) => void) | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Request notification permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        LoggingService.warn('Notification permission denied', 'Notification');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Setup notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Setup notification listeners
      this.setupNotificationListeners();

      // Handle initial notification
      await this.checkInitialNotification();

      LoggingService.info('Notification service initialized', 'Notification');
    } catch (error) {
      LoggingService.error('Failed to initialize notifications', 'Notification', error as Error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      LoggingService.info('Notification permission granted', 'Notification');
    }

    return enabled;
  }

  /**
   * Get FCM token
   */
  private async getFCMToken(): Promise<void> {
    try {
      this.fcmToken = await messaging().getToken();
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, this.fcmToken);
      
      LoggingService.info('FCM token retrieved', 'Notification', { token: this.fcmToken });
      
      // Send token to server
      await this.sendTokenToServer(this.fcmToken);
    } catch (error) {
      LoggingService.error('Failed to get FCM token', 'Notification', error as Error);
    }
  }

  /**
   * Send FCM token to server
   */
  private async sendTokenToServer(token: string): Promise<void> {
    // TODO: Implement API call to send token to server
    const user = store.getState().auth.user;
    if (user) {
      // ApiService.post('/api/users/fcm-token', { token });
    }
  }

  /**
   * Create notification channels (Android)
   */
  private async createNotificationChannels(): Promise<void> {
    await notifee.createChannel({
      id: 'messages',
      name: 'Messages',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'requests',
      name: 'Request Updates',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'general',
      name: 'General Notifications',
      importance: AndroidImportance.DEFAULT,
    });
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle messages received while app is in foreground
    this.notificationListener = messaging().onMessage(async (remoteMessage) => {
      LoggingService.info('Foreground notification received', 'Notification', remoteMessage);
      
      if (AppState.currentState === 'active') {
        // Show local notification
        await this.showNotification({
          title: remoteMessage.notification?.title || 'New Notification',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        });
      }
    });

    // Handle notification interactions
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          this.handleNotificationPress(detail.notification);
          break;
        case EventType.DISMISSED:
          LoggingService.info('Notification dismissed', 'Notification');
          break;
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        await this.handleNotificationPress(detail.notification);
      }
    });

    // Token refresh listener
    messaging().onTokenRefresh(async (token) => {
      this.fcmToken = token;
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
      await this.sendTokenToServer(token);
    });
  }

  /**
   * Check for initial notification (app opened from notification)
   */
  private async checkInitialNotification(): Promise<void> {
    const initialNotification = await notifee.getInitialNotification();
    
    if (initialNotification) {
      LoggingService.info('App opened from notification', 'Notification', initialNotification);
      await this.handleNotificationPress(initialNotification.notification);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(data: NotificationData): Promise<void> {
    const { title, body, data: notificationData, badge, sound, category } = data;
    
    const channelId = this.getChannelId(notificationData?.type);
    
    const androidConfig: NotificationAndroid = {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    };

    const iosConfig: NotificationIOS = {
      sound: sound || 'default',
      badge,
      categoryId: category,
    };

    try {
      await notifee.displayNotification({
        title,
        body,
        data: notificationData,
        android: androidConfig,
        ios: iosConfig,
      });

      // Store notification in Redux
      store.dispatch(addNotification({
        id: `notif_${Date.now()}`,
        userId: store.getState().auth.user?.id || '',
        title,
        message: body,
        type: notificationData?.type || NOTIFICATION_TYPES.GENERAL,
        isRead: false,
        data: notificationData,
        createdAt: new Date(),
      }));
    } catch (error) {
      LoggingService.error('Failed to show notification', 'Notification', error as Error);
    }
  }

  /**
   * Handle notification press
   */
  private async handleNotificationPress(notification?: Notification): Promise<void> {
    if (!notification?.data) return;

    const { chatRoomId, requestId, type } = notification.data;
    
    LoggingService.info('Notification pressed', 'Notification', notification.data);

    // Navigate based on notification type
    // This would need to be implemented with navigation ref
    if (chatRoomId) {
      // Navigate to chat
    } else if (requestId) {
      // Navigate to request details
    }
  }

  /**
   * Get channel ID based on notification type
   */
  private getChannelId(type?: string): string {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return 'messages';
      case NOTIFICATION_TYPES.STATUS_UPDATE:
        return 'requests';
      default:
        return 'general';
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(
    data: NotificationData,
    trigger: { timestamp: number } | { interval: number }
  ): Promise<string> {
    const triggerConfig = 'timestamp' in trigger
      ? {
          type: TriggerType.TIMESTAMP as const,
          timestamp: trigger.timestamp,
        }
      : {
          type: TriggerType.INTERVAL as const,
          interval: trigger.interval,
        };

    const notificationId = await notifee.createTriggerNotification(
      {
        title: data.title,
        body: data.body,
        data: data.data,
        android: {
          channelId: this.getChannelId(data.data?.type),
        },
      },
      triggerConfig
    );

    LoggingService.info('Notification scheduled', 'Notification', { notificationId, trigger });
    return notificationId;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
    LoggingService.info('Notification cancelled', 'Notification', { notificationId });
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
    LoggingService.info('All notifications cancelled', 'Notification');
  }

  /**
   * Set badge count (iOS)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await notifee.setBadgeCount(count);
    }
  }

  /**
   * Get badge count (iOS)
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return await notifee.getBadgeCount();
    }
    return 0;
  }

  /**
   * Clear badge (iOS)
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
    }
  }
}

export default new NotificationService();