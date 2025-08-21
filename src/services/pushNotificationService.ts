import { firebaseService } from './firebaseService';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  priority?: 'high' | 'normal' | 'low';
  sound?: string;
  badge?: number;
}

class PushNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private notificationListeners: Map<string, (data: any) => void> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        
        // Get FCM token
        this.fcmToken = await messaging().getToken();
        console.log('FCM Token:', this.fcmToken);

        // Save token to user profile
        await this.saveTokenToUserProfile();

        // Setup notification handlers
        this.setupNotificationHandlers();
        
        // Setup local notification configuration
        this.setupLocalNotifications();

        this.isInitialized = true;
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async saveTokenToUserProfile(): Promise<void> {
    try {
      const user = firebaseService.auth.currentUser;
      if (user && this.fcmToken) {
        if (!firebaseService.firestore) {
          throw new Error('Firestore not initialized');
        }

        await firebaseService.firestore
          .collection('users')
          .doc(user.uid)
          .update({
            fcmToken: this.fcmToken,
            lastTokenUpdate: new Date(),
            platform: Platform.OS,
          });
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  private setupNotificationHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Received foreground message:', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle notification open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Handle initial notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Initial notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  private setupLocalNotifications(): void {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'emergency-alerts',
          channelName: 'Emergency Alerts',
          channelDescription: 'Critical emergency notifications',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Emergency channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'hold-notifications',
          channelName: 'Hold Notifications',
          channelDescription: 'Hold and access notifications',
          playSound: true,
          soundName: 'default',
          importance: 3,
          vibrate: true,
        },
        (created) => console.log(`Hold channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'equipment-updates',
          channelName: 'Equipment Updates',
          channelDescription: 'Equipment status and reservation updates',
          playSound: true,
          soundName: 'default',
          importance: 2,
          vibrate: false,
        },
        (created) => console.log(`Equipment channel created: ${created}`)
      );
    }
  }

  private handleNotification(remoteMessage: any): void {
    const { data, notification } = remoteMessage;
    
    if (notification) {
      this.showLocalNotification({
        id: data?.id || Date.now().toString(),
        title: notification.title || 'GaterLink',
        body: notification.body || '',
        data: data,
        priority: data?.priority || 'normal',
        sound: data?.sound || 'default',
        badge: data?.badge,
      });
    }

    // Trigger custom listeners
    const listener = this.notificationListeners.get(data?.type);
    if (listener) {
      listener(data);
    }
  }

  private handleNotificationOpen(remoteMessage: any): void {
    const { data } = remoteMessage;
    
    // Handle navigation based on notification type
    switch (data?.type) {
      case 'emergency':
        // Navigate to emergency dashboard
        this.navigateToScreen('EmergencyDashboard');
        break;
      case 'hold':
        // Navigate to hold management
        this.navigateToScreen('HoldManagement');
        break;
      case 'equipment':
        // Navigate to equipment details
        if (data.equipmentId) {
          this.navigateToScreen('EquipmentDetails', { equipmentId: data.equipmentId });
        }
        break;
      case 'request':
        // Navigate to request details
        if (data.requestId) {
          this.navigateToScreen('RequestDetails', { requestId: data.requestId });
        }
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  private navigateToScreen(screenName: string, params?: any): void {
    // This would be implemented with navigation service
    console.log(`Navigate to ${screenName}`, params);
  }

  showLocalNotification(notification: NotificationData): void {
    PushNotification.localNotification({
      id: notification.id,
      title: notification.title,
      message: notification.body,
      userInfo: notification.data,
      channelId: this.getChannelId(notification.data?.type),
      priority: notification.priority === 'normal' ? 'default' : notification.priority,
      soundName: notification.sound,
      number: notification.badge,
      vibrate: notification.priority === 'high',
      vibration: notification.priority === 'high' ? 300 : 100,
      playSound: true,
      autoCancel: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      bigText: notification.body,
      subText: notification.data?.subText,
      color: this.getNotificationColor(notification.data?.type),
      actions: this.getNotificationActions(notification.data?.type),
    });
  }

  private getChannelId(type?: string): string {
    switch (type) {
      case 'emergency':
        return 'emergency-alerts';
      case 'hold':
        return 'hold-notifications';
      case 'equipment':
        return 'equipment-updates';
      default:
        return 'default';
    }
  }

  private getNotificationColor(type?: string): string {
    switch (type) {
      case 'emergency':
        return '#F44336';
      case 'hold':
        return '#FF9800';
      case 'equipment':
        return '#2196F3';
      default:
        return '#4CAF50';
    }
  }

  private getNotificationActions(type?: string): string[] {
    switch (type) {
      case 'emergency':
        return ['Acknowledge', 'View Details'];
      case 'hold':
        return ['View Details', 'Extend'];
      case 'equipment':
        return ['View Details', 'Reserve'];
      default:
        return ['View'];
    }
  }

  async sendEmergencyNotification(emergency: any): Promise<void> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) return;

      const notificationData = {
        type: 'emergency',
        emergencyId: emergency.id,
        siteId: emergency.siteId,
        severity: emergency.severity,
        title: `Emergency: ${emergency.type}`,
        body: emergency.description,
        priority: 'high',
        sound: 'emergency',
      };

      // Send to affected users
      if (emergency.affectedUsers && emergency.affectedUsers.length > 0) {
        await this.sendToUsers(emergency.affectedUsers, notificationData);
      }

      // Also send to site managers
      await this.sendToSiteManagers(emergency.siteId, notificationData);

    } catch (error) {
      console.error('Error sending emergency notification:', error);
    }
  }

  async sendHoldNotification(hold: any): Promise<void> {
    try {
      const notificationData = {
        type: 'hold',
        holdId: hold.id,
        siteId: hold.siteId,
        areaId: hold.areaId,
        title: 'Area on Hold',
        body: `${hold.areaId} is now on hold: ${hold.reason}`,
        priority: 'normal',
        sound: 'default',
      };

      // Send to affected users
      if (hold.affectedUsers && hold.affectedUsers.length > 0) {
        await this.sendToUsers(hold.affectedUsers, notificationData);
      }

    } catch (error) {
      console.error('Error sending hold notification:', error);
    }
  }

  async sendEquipmentNotification(equipment: any, type: 'status' | 'reservation' | 'maintenance'): Promise<void> {
    try {
      const notificationData = {
        type: 'equipment',
        equipmentId: equipment.id,
        siteId: equipment.siteId,
        notificationType: type,
        title: `Equipment Update: ${equipment.name}`,
        body: this.getEquipmentNotificationBody(equipment, type),
        priority: 'normal',
        sound: 'default',
      };

      // Send to site users
      await this.sendToSiteUsers(equipment.siteId, notificationData);

    } catch (error) {
      console.error('Error sending equipment notification:', error);
    }
  }

  private getEquipmentNotificationBody(equipment: any, type: string): string {
    switch (type) {
      case 'status':
        return `${equipment.name} status changed to ${equipment.status}`;
      case 'reservation':
        return `New reservation for ${equipment.name}`;
      case 'maintenance':
        return `${equipment.name} requires maintenance`;
      default:
        return `Update for ${equipment.name}`;
    }
  }

  private async sendToUsers(userIds: string[], notificationData: any): Promise<void> {
    try {
      // Get FCM tokens for users
      const userTokens = await this.getUserTokens(userIds);
      
      // Send notifications
      for (const token of userTokens) {
        await this.sendToToken(token, notificationData);
      }
    } catch (error) {
      console.error('Error sending to users:', error);
    }
  }

  private async sendToSiteUsers(siteId: string, notificationData: any): Promise<void> {
    try {
      // Get site members
      const siteMembers = await firebaseService.firestore
        .collection('siteMemberships')
        .where('siteId', '==', siteId)
        .get();

      const userIds = siteMembers.docs.map(doc => doc.data().userId);
      await this.sendToUsers(userIds, notificationData);
    } catch (error) {
      console.error('Error sending to site users:', error);
    }
  }

  private async sendToSiteManagers(siteId: string, notificationData: any): Promise<void> {
    try {
      // Get site managers
      const siteManagers = await firebaseService.firestore
        .collection('siteMemberships')
        .where('siteId', '==', siteId)
        .where('role', '==', 'MANAGER')
        .get();

      const userIds = siteManagers.docs.map(doc => doc.data().userId);
      await this.sendToUsers(userIds, notificationData);
    } catch (error) {
      console.error('Error sending to site managers:', error);
    }
  }

  private async getUserTokens(userIds: string[]): Promise<string[]> {
    try {
      const tokens: string[] = [];
      
      for (const userId of userIds) {
        const userDoc = await firebaseService.firestore
          .collection('users')
          .doc(userId)
          .get();

        const fcmToken = userDoc.data()?.fcmToken;
        if (fcmToken) {
          tokens.push(fcmToken);
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  private async sendToToken(token: string, notificationData: any): Promise<void> {
    try {
      // This would typically be done through Firebase Cloud Functions
      // For now, we'll just log the notification
      console.log('Sending notification to token:', token, notificationData);
    } catch (error) {
      console.error('Error sending to token:', error);
    }
  }

  addNotificationListener(type: string, callback: (data: any) => void): void {
    this.notificationListeners.set(type, callback);
  }

  removeNotificationListener(type: string): void {
    this.notificationListeners.delete(type);
  }

  async getBadgeCount(): Promise<number> {
    try {
      // Badge count is not available in React Native Firebase messaging
      // Return 0 as fallback
      return 0;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      // Badge count setting is not available in React Native Firebase messaging
      // Use PushNotification for badge management
      PushNotification.setApplicationIconBadgeNumber(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      PushNotification.cancelAllLocalNotifications();
      // Clear badge count using PushNotification
      PushNotification.setApplicationIconBadgeNumber(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  async getFCMToken(): Promise<string | null> {
    return this.fcmToken;
  }

  async refreshFCMToken(): Promise<string | null> {
    try {
      this.fcmToken = await messaging().getToken();
      await this.saveTokenToUserProfile();
      return this.fcmToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
