import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from './firebaseService';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

class NotificationService {
  private readonly NOTIFICATIONS_KEY = '@notifications';
  private readonly BADGE_COUNT_KEY = '@badge_count';
  private firestoreListeners: (() => void)[] = [];

  async requestPermissions(): Promise<boolean> {
    try {
      // For React Native, we'll use a simple permission check
      // In a real implementation, you would use react-native-permissions
      console.log('Requesting notification permissions...');
      return true; // Simulate granted permission
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: any
  ): Promise<string> {
    try {
      // For React Native, we'll store the notification locally
      const notification: NotificationData = {
        id: Date.now().toString(),
        title,
        body,
        data,
        timestamp: new Date(),
        read: false,
      };

      await this.saveNotification(notification);
      await this.incrementBadgeCount();
      
      return notification.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== identifier);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      await AsyncStorage.setItem(this.BADGE_COUNT_KEY, '0');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(this.BADGE_COUNT_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BADGE_COUNT_KEY, count.toString());
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async getNotifications(): Promise<NotificationData[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      if (notificationsJson) {
        const notifications = JSON.parse(notificationsJson);
        return notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
      
      // Update badge count
      const unreadCount = updatedNotifications.filter(n => !n.read).length;
      await this.setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(filteredNotifications));
      
      // Update badge count
      const unreadCount = filteredNotifications.filter(n => !n.read).length;
      await this.setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  private async saveNotification(notification: NotificationData): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      notifications.unshift(notification); // Add to beginning
      
      // Keep only last 100 notifications
      const trimmedNotifications = notifications.slice(0, 100);
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(trimmedNotifications));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  private async incrementBadgeCount(): Promise<void> {
    try {
      const currentCount = await this.getBadgeCount();
      await this.setBadgeCount(currentCount + 1);
    } catch (error) {
      console.error('Error incrementing badge count:', error);
    }
  }

  // Real-time Firestore notification listeners (free tier alternative to Cloud Functions)
  
  // Setup real-time listeners for notifications
  setupNotificationListeners(userId: string): void {
    console.log(`Setting up notification listeners for user: ${userId}`);
    
    // Listen for new notifications
    this.setupNewNotificationsListener(userId);
    
    // Listen for notification updates
    this.setupNotificationUpdatesListener(userId);
  }

  // Listen for new notifications
  private setupNewNotificationsListener(userId: string): void {
    const notificationsQuery = firebaseService.firestore
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc');

    const unsubscribe = notificationsQuery.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate() || new Date(),
          } as FirestoreNotification;

          console.log('New notification received:', notification);
          
          // Show local notification
          this.showLocalNotification(notification);
          
          // Update badge count
          this.incrementBadgeCount();
        }
      });
    });

    this.firestoreListeners.push(unsubscribe);
  }

  // Listen for notification updates (marking as read)
  private setupNotificationUpdatesListener(userId: string): void {
    const notificationsQuery = firebaseService.firestore
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc');

    const unsubscribe = notificationsQuery.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const notification = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate() || new Date(),
          } as FirestoreNotification;

          console.log('Notification updated:', notification);
          
          // Update local notification if marked as read
          if (notification.read) {
            this.markAsRead(notification.id);
          }
        }
      });
    });

    this.firestoreListeners.push(unsubscribe);
  }

  // Show local notification
  private async showLocalNotification(notification: FirestoreNotification): Promise<void> {
    try {
      // Schedule local notification
      await this.scheduleLocalNotification(
        notification.title,
        notification.body,
        notification.data
      );

      console.log(`Local notification shown: ${notification.title}`);
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Mark notification as read in Firestore
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await firebaseService.firestore
        .collection('notifications')
        .doc(notificationId)
        .update({
          read: true,
          readAt: new Date(),
        });

      console.log(`Notification ${notificationId} marked as read in Firestore`);
    } catch (error) {
      console.error('Error marking notification as read in Firestore:', error);
    }
  }

  // Get notifications from Firestore
  async getFirestoreNotifications(userId: string): Promise<FirestoreNotification[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as FirestoreNotification[];
    } catch (error) {
      console.error('Error fetching Firestore notifications:', error);
      return [];
    }
  }

  // Get unread notification count from Firestore
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const snapshot = await firebaseService.firestore
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      return snapshot.docs.length;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  // Cleanup all listeners
  cleanup(): void {
    console.log('Cleaning up notification service listeners...');
    this.firestoreListeners.forEach(unsubscribe => unsubscribe());
    this.firestoreListeners = [];
  }
}

export const notificationService = new NotificationService();
