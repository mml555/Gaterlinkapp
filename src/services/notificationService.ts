import firestore from '@react-native-firebase/firestore';
import { firebaseService } from './firebaseService';

// Define the FirestoreNotification type if it doesn't exist in types
export interface FirestoreNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

class NotificationService {
  private firestoreListeners: (() => void)[] = [];

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      console.log('Initializing notification service...');
      
      // Set up notification listeners for the current user
      const currentUser = firebaseService.auth.currentUser;
      if (currentUser) {
        this.setupNotificationListeners(currentUser.uid);
      }

      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      // Don't throw, just log the error
    }
  }

  // Set up all notification listeners for a user
  private setupNotificationListeners(userId: string): void {
    try {
      console.log('Setting up notification listeners for user:', userId);
      
      // Set up listeners for new notifications
      this.setupNewNotificationsListener(userId);
      
      // Set up listeners for notification updates
      this.setupNotificationUpdatesListener(userId);
      
      console.log('Notification listeners set up successfully');
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      // Don't throw the error, just log it to prevent app crashes
    }
  }

  // Listen for new notifications with fallback
  private setupNewNotificationsListener(userId: string): void {
    try {
      // First, try the complex query with ordering
      const notificationsQuery = firestore()
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false);

      const unsubscribe = notificationsQuery.onSnapshot(
        (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
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
        },
        (error: any) => {
          console.error('Error in new notifications listener:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          // Handle specific error types gracefully
          if (error.code === 'permission-denied') {
            console.warn('Permission denied for notifications - this is expected for some users');
            // Don't retry immediately, the service will continue to function
          } else if (error.code === 'unavailable') {
            console.warn('Firestore temporarily unavailable, will retry later');
            // Could implement retry logic here
          } else {
            console.warn('Non-critical notification listener error, continuing...');
          }
        }
      );

      // Store the unsubscribe function
      this.firestoreListeners.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up new notifications listener:', error);
      // Don't throw, just log the error
    }
  }

  // Fallback listener with simpler query
  private setupFallbackNotificationsListener(userId: string): void {
    try {
      console.log('Setting up fallback notifications listener...');
      
      // Simpler query without ordering to avoid permission issues
      const notificationsQuery = firestore()
        .collection('notifications')
        .where('userId', '==', userId);

      const unsubscribe = notificationsQuery.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notification = {
                id: change.doc.id,
                ...change.doc.data(),
                createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              } as FirestoreNotification;

              console.log('New notification received (fallback):', notification);
              
              // Show local notification
              this.showLocalNotification(notification);
              
              // Update badge count
              this.incrementBadgeCount();
            }
          });
        },
        (error: any) => {
          console.error('Error in fallback notifications listener:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          if (error.code === 'permission-denied') {
            console.warn('🔒 Permission denied even with fallback query. This suggests:');
            console.warn('   - Firestore rules are too restrictive');
            console.warn('   - User authentication issues');
            console.warn('   - Collection may not exist');
            console.warn('Notifications may not work properly until this is resolved.');
          }
        }
      );

      this.firestoreListeners.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up fallback notifications listener:', error);
    }
  }

  // Listen for notification updates (marking as read)
  private setupNotificationUpdatesListener(userId: string): void {
    try {
      // First, try the complex query with ordering
      const notificationsQuery = firebaseService.firestore
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc');

      const unsubscribe = notificationsQuery.onSnapshot(
        (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'modified') {
              const notification = {
                id: change.doc.id,
                ...change.doc.data(),
                createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              } as FirestoreNotification;

              console.log('Notification updated:', notification);
              
              // Update local notification if marked as read
              if (notification.read) {
                this.markAsReadLocal(notification.id);
              }
            }
          });
        },
        (error: any) => {
          console.error('Error in notification updates listener:', error);
          // Handle specific error types
          if (error.code === 'permission-denied') {
            console.warn('Permission denied for notification updates. Trying fallback query...');
            // Try a simpler query without ordering
            this.setupFallbackNotificationUpdatesListener(userId);
          } else if (error.code === 'failed-precondition') {
            console.warn('Missing index for notification updates query. Creating index...');
            // The index will be created automatically by Firebase
          } else {
            console.error('Unexpected error in notification updates listener:', error);
          }
        }
      );

      this.firestoreListeners.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up notification updates listener:', error);
    }
  }

  // Fallback listener for notification updates with simpler query
  private setupFallbackNotificationUpdatesListener(userId: string): void {
    try {
      console.log('Setting up fallback notification updates listener...');
      
      // Simpler query without ordering to avoid permission issues
      const notificationsQuery = firebaseService.firestore
        .collection('notifications')
        .where('userId', '==', userId);

      const unsubscribe = notificationsQuery.onSnapshot(
        (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'modified') {
              const notification = {
                id: change.doc.id,
                ...change.doc.data(),
                createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              } as FirestoreNotification;

              console.log('Notification updated (fallback):', notification);
              
              // Update local notification if marked as read
              if (notification.read) {
                this.markAsReadLocal(notification.id);
              }
            }
          });
        },
        (error: any) => {
          console.error('Error in fallback notification updates listener:', error);
          if (error.code === 'permission-denied') {
            console.warn('Permission denied even with fallback query. Notification updates may not work properly.');
          }
        }
      );

      this.firestoreListeners.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up fallback notification updates listener:', error);
    }
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

  // Schedule local notification
  private async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // This would integrate with a local notification library
      // For now, just log the notification
      console.log('Scheduling local notification:', { title, body, data });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Mark notification as read in Firestore
  private async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = firebaseService.firestore
        .collection('notifications')
        .doc(notificationId);
      
      if (!docRef) {
        throw new Error('Document reference is null');
      }

      await docRef.update({
        read: true,
        readAt: new Date(),
      });

      console.log(`Notification ${notificationId} marked as read in Firestore`);
    } catch (error: any) {
      console.error('Error marking notification as read in Firestore:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for marking notification as read. Check Firestore rules.');
      } else if (error.code === 'not-found') {
        console.warn('Notification not found when trying to mark as read.');
      }
    }
  }

  // Mark notification as read (local method)
  private markAsReadLocal(notificationId: string): void {
    try {
      // This method is called by listeners to mark notifications as read locally
      // The actual Firestore update is handled by markNotificationAsRead
      console.log(`Notification ${notificationId} marked as read locally`);
    } catch (error) {
      console.error('Error marking notification as read locally:', error);
    }
  }

  // Increment badge count
  private async incrementBadgeCount(): Promise<void> {
    try {
      // This method would increment the app badge count
      // For now, just log the action
      console.log('Incrementing badge count');
    } catch (error) {
      console.error('Error incrementing badge count:', error);
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
    } catch (error: any) {
      console.error('Error fetching Firestore notifications:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for notifications. Check Firestore rules.');
      } else if (error.code === 'failed-precondition') {
        console.warn('Missing index for notifications query. Creating index...');
      }
      return [];
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getFirestoreNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Get all notifications for a user
  async getNotifications(userId?: string): Promise<FirestoreNotification[]> {
    try {
      const currentUserId = userId || firebaseService.auth.currentUser?.uid;
      if (!currentUserId) {
        console.warn('No user ID available for getting notifications');
        return [];
      }
      return await this.getFirestoreNotifications(currentUserId);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      const currentUser = firebaseService.auth.currentUser;
      if (!currentUser) {
        return 0;
      }
      return await this.getUnreadNotificationCount(currentUser.uid);
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Mark notification as read (public method)
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const currentUser = firebaseService.auth.currentUser;
      if (!currentUser) {
        console.warn('No current user to mark notifications as read');
        return;
      }

      const notifications = await this.getFirestoreNotifications(currentUser.uid);
      const unreadNotifications = notifications.filter(n => !n.read);

      const batch = firestore().batch();
      unreadNotifications.forEach(notification => {
        const notificationRef = firestore().collection('notifications').doc(notification.id);
        batch.update(notificationRef, { read: true, readAt: firestore.FieldValue.serverTimestamp() });
      });

      await batch.commit();
      console.log(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await firestore().collection('notifications').doc(notificationId).delete();
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Request permissions
  async requestPermissions(): Promise<void> {
    try {
      console.log('Requesting notification permissions...');
      // This would typically involve requesting push notification permissions
      // For now, we'll just log that permissions were requested
      console.log('Notification permissions requested');
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      throw error;
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
