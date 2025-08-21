import { Hold, HoldStatus } from '../types';
import { firebaseService } from './firebaseService';

class HoldService {
  private readonly COLLECTION = 'holds';

  async getHolds(): Promise<Hold[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error: any) {
      console.error('Error fetching holds:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for holds. Check Firestore rules.');
      } else if (error.code === 'failed-precondition') {
        console.warn('Missing index for holds query. Creating index...');
      }
      return [];
    }
  }

  async getActiveHolds(): Promise<Hold[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const now = new Date();
      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('status', '==', HoldStatus.ACTIVE)
        .where('endTime', '>', now)
        .orderBy('endTime', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error: any) {
      console.error('Error fetching active holds:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for active holds. Check Firestore rules.');
      } else if (error.code === 'failed-precondition') {
        console.warn('Missing index for active holds query. Creating index...');
      }
      return [];
    }
  }

  async getHoldsBySite(siteId: string): Promise<Hold[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('siteId', '==', siteId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error: any) {
      console.error('Error fetching holds by site:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for holds by site. Check Firestore rules.');
      } else if (error.code === 'failed-precondition') {
        console.warn('Missing index for holds by site query. Creating index...');
      }
      return [];
    }
  }

  async getHoldsByArea(areaId: string, areaType: 'door' | 'equipment' | 'site'): Promise<Hold[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('areaId', '==', areaId)
        .where('areaType', '==', areaType)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error: any) {
      console.error('Error fetching holds by area:', error);
      // Handle specific error types
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for holds by area. Check Firestore rules.');
      } else if (error.code === 'failed-precondition') {
        console.warn('Missing index for holds by area query. Creating index...');
      }
      return [];
    }
  }

  async createHold(holdData: Partial<Hold>): Promise<Hold> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newHold: Partial<Hold> = {
        ...holdData,
        createdBy: user.uid,
        createdAt: new Date(),
        status: HoldStatus.ACTIVE,
        notificationsSent: false,
        affectedUsers: holdData.affectedUsers || [],
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await firebaseService.firestore
        .collection(this.COLLECTION)
        .add(newHold);

      return {
        id: docRef.id,
        ...newHold,
      } as Hold;
    } catch (error) {
      console.error('Error creating hold:', error);
      throw new Error('Failed to create hold');
    }
  }

  async updateHold(holdId: string, updates: Partial<Hold>): Promise<Hold> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update(updateData);

      // Get updated hold
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as Hold;
    } catch (error) {
      console.error('Error updating hold:', error);
      throw new Error('Failed to update hold');
    }
  }

  async cancelHold(holdId: string): Promise<Hold> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update({
          status: HoldStatus.CANCELLED,
          updatedAt: new Date(),
        });

      // Get updated hold
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as Hold;
    } catch (error) {
      console.error('Error cancelling hold:', error);
      throw new Error('Failed to cancel hold');
    }
  }

  async extendHold(holdId: string, newEndTime: Date): Promise<Hold> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update({
          endTime: newEndTime,
          updatedAt: new Date(),
        });

      // Get updated hold
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as Hold;
    } catch (error) {
      console.error('Error extending hold:', error);
      throw new Error('Failed to extend hold');
    }
  }

  async notifyAffectedUsers(holdId: string): Promise<void> {
    try {
      const hold = await this.getHoldById(holdId);
      if (!hold) {
        throw new Error('Hold not found');
      }

      // Send notifications to affected users
      const notifications = hold.affectedUsers.map(userId => ({
        userId,
        type: 'HOLD_NOTIFICATION',
        title: 'Area on Hold',
        message: `The area "${hold.areaId}" is currently on hold: ${hold.reason}`,
        data: {
          holdId: hold.id,
          areaId: hold.areaId,
          areaType: hold.areaType,
          reason: hold.reason,
          endTime: hold.endTime,
        },
        timestamp: new Date(),
        isRead: false,
      }));

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      // Batch write notifications
      const batch = firebaseService.firestore.batch();
      notifications.forEach(notification => {
        const notificationRef = firebaseService.firestore!.collection('notifications').doc();
        if (notificationRef) {
          batch.set(notificationRef, notification);
        }
      });

      await batch.commit();

      // Mark hold as notified
      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update({
          notificationsSent: true,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error notifying affected users:', error);
      throw new Error('Failed to notify affected users');
    }
  }

  async getHoldById(holdId: string): Promise<Hold | null> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as Hold;
    } catch (error) {
      console.error('Error fetching hold:', error);
      throw new Error('Failed to fetch hold');
    }
  }

  async addAffectedUser(holdId: string, userId: string): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update({
          affectedUsers: (firebaseService.firestore as any).FieldValue.arrayUnion(userId),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error adding affected user:', error);
      throw new Error('Failed to add affected user');
    }
  }

  async removeAffectedUser(holdId: string, userId: string): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(holdId)
        .update({
          affectedUsers: (firebaseService.firestore as any).FieldValue.arrayRemove(userId),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error removing affected user:', error);
      throw new Error('Failed to remove affected user');
    }
  }

  async checkAreaAvailability(areaId: string, areaType: 'door' | 'equipment' | 'site'): Promise<boolean> {
    try {
      const now = new Date();
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .where('areaId', '==', areaId)
        .where('areaType', '==', areaType)
        .where('status', '==', HoldStatus.ACTIVE)
        .where('endTime', '>', now)
        .limit(1)
        .get();

      return snapshot.empty; // Return true if no active holds found
    } catch (error) {
      console.error('Error checking area availability:', error);
      throw new Error('Failed to check area availability');
    }
  }

  async getExpiredHolds(): Promise<Hold[]> {
    try {
      const now = new Date();
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('status', '==', HoldStatus.ACTIVE)
        .where('endTime', '<=', now)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error) {
      console.error('Error fetching expired holds:', error);
      throw new Error('Failed to fetch expired holds');
    }
  }

  async autoExpireHolds(): Promise<void> {
    try {
      const expiredHolds = await this.getExpiredHolds();
      
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const batch = firebaseService.firestore.batch();
      expiredHolds.forEach(hold => {
        const holdRef = firebaseService.firestore!
          .collection(this.COLLECTION)
          .doc(hold.id);
        batch.update(holdRef, {
          status: HoldStatus.EXPIRED,
          updatedAt: new Date(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error auto-expiring holds:', error);
      throw new Error('Failed to auto-expire holds');
    }
  }

  async getHoldsByUser(userId: string): Promise<Hold[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('affectedUsers', 'array-contains', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error) {
      console.error('Error fetching holds by user:', error);
      throw new Error('Failed to fetch holds by user');
    }
  }

  async getActiveHoldsByUser(userId: string): Promise<Hold[]> {
    try {
      const now = new Date();
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('affectedUsers', 'array-contains', userId)
        .where('status', '==', HoldStatus.ACTIVE)
        .where('endTime', '>', now)
        .orderBy('endTime', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Hold[];
    } catch (error) {
      console.error('Error fetching active holds by user:', error);
      throw new Error('Failed to fetch active holds by user');
    }
  }
}

export const holdService = new HoldService();
