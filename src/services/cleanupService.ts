import { firebaseService } from './firebaseService';

class CleanupService {
  private cleanupListeners: (() => void)[] = [];

  // Setup automatic cleanup listeners
  setupCleanupListeners(): void {
    console.log('Setting up cleanup listeners...');
    
    // Listen for expired holds
    this.setupExpiredHoldsListener();
    
    // Listen for old notifications
    this.setupOldNotificationsListener();
    
    // Setup periodic cleanup tasks
    this.setupPeriodicCleanup();
  }

  // Clean up expired holds automatically
  private setupExpiredHoldsListener(): void {
    const expiredHoldsQuery = firebaseService.firestore
      .collection('holds')
      .where('expiresAt', '<', new Date())
      .where('status', '==', 'active');

    const unsubscribe = expiredHoldsQuery.onSnapshot(async (snapshot) => {
      if (!snapshot.empty) {
        console.log(`Found ${snapshot.docs.length} expired holds to clean up`);
        
        const batch = firebaseService.firestore.batch();
        
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'expired',
            updatedAt: new Date(),
          });
        });

        try {
          await batch.commit();
          console.log(`Successfully cleaned up ${snapshot.docs.length} expired holds`);
        } catch (error) {
          console.error('Error cleaning up expired holds:', error);
        }
      }
    });

    this.cleanupListeners.push(unsubscribe);
  }

  // Clean up old notifications automatically
  private setupOldNotificationsListener(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotificationsQuery = firebaseService.firestore
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .where('read', '==', true);

    const unsubscribe = oldNotificationsQuery.onSnapshot(async (snapshot) => {
      if (!snapshot.empty) {
        console.log(`Found ${snapshot.docs.length} old notifications to clean up`);
        
        const batch = firebaseService.firestore.batch();
        
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        try {
          await batch.commit();
          console.log(`Successfully cleaned up ${snapshot.docs.length} old notifications`);
        } catch (error) {
          console.error('Error cleaning up old notifications:', error);
        }
      }
    });

    this.cleanupListeners.push(unsubscribe);
  }

  // Setup periodic cleanup tasks (runs every hour)
  private setupPeriodicCleanup(): void {
    const cleanupInterval = setInterval(async () => {
      try {
        console.log('Running periodic cleanup...');
        
        // Clean up old emergency logs (older than 90 days)
        await this.cleanupOldEmergencyLogs();
        
        // Clean up old access logs (older than 60 days)
        await this.cleanupOldAccessLogs();
        
        // Clean up old chat messages (older than 30 days)
        await this.cleanupOldChatMessages();
        
        console.log('Periodic cleanup completed');
      } catch (error) {
        console.error('Error in periodic cleanup:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Store the interval ID for cleanup
    this.cleanupListeners.push(() => clearInterval(cleanupInterval));
  }

  // Clean up old emergency logs
  private async cleanupOldEmergencyLogs(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldEmergencies = await firebaseService.firestore
      .collection('emergencies')
      .where('createdAt', '<', ninetyDaysAgo)
      .where('status', '==', 'resolved')
      .get();

    if (!oldEmergencies.empty) {
      const batch = firebaseService.firestore.batch();
      
      oldEmergencies.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldEmergencies.docs.length} old emergency logs`);
    }
  }

  // Clean up old access logs
  private async cleanupOldAccessLogs(): Promise<void> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const oldAccessLogs = await firebaseService.firestore
      .collection('accessLogs')
      .where('timestamp', '<', sixtyDaysAgo)
      .get();

    if (!oldAccessLogs.empty) {
      const batch = firebaseService.firestore.batch();
      
      oldAccessLogs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldAccessLogs.docs.length} old access logs`);
    }
  }

  // Clean up old chat messages
  private async cleanupOldChatMessages(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldMessages = await firebaseService.firestore
      .collectionGroup('messages')
      .where('createdAt', '<', thirtyDaysAgo)
      .get();

    if (!oldMessages.empty) {
      const batch = firebaseService.firestore.batch();
      
      oldMessages.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldMessages.docs.length} old chat messages`);
    }
  }

  // Manual cleanup methods for immediate execution
  async cleanupExpiredHolds(): Promise<number> {
    try {
      const expiredHolds = await firebaseService.firestore
        .collection('holds')
        .where('expiresAt', '<', new Date())
        .where('status', '==', 'active')
        .get();

      if (!expiredHolds.empty) {
        const batch = firebaseService.firestore.batch();
        
        expiredHolds.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'expired',
            updatedAt: new Date(),
          });
        });

        await batch.commit();
        console.log(`Manually cleaned up ${expiredHolds.docs.length} expired holds`);
        return expiredHolds.docs.length;
      }
      return 0;
    } catch (error) {
      console.error('Error in manual cleanup of expired holds:', error);
      throw error;
    }
  }

  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = await firebaseService.firestore
        .collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .where('read', '==', true)
        .get();

      if (!oldNotifications.empty) {
        const batch = firebaseService.firestore.batch();
        
        oldNotifications.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Manually cleaned up ${oldNotifications.docs.length} old notifications`);
        return oldNotifications.docs.length;
      }
      return 0;
    } catch (error) {
      console.error('Error in manual cleanup of old notifications:', error);
      throw error;
    }
  }

  // Cleanup all listeners when service is destroyed
  cleanup(): void {
    console.log('Cleaning up cleanup service listeners...');
    this.cleanupListeners.forEach(unsubscribe => unsubscribe());
    this.cleanupListeners = [];
  }
}

export const cleanupService = new CleanupService();
