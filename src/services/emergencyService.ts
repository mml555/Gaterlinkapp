import { EmergencyEvent, EmergencyStatus, EmergencyType, EmergencySeverity, ReadAcknowledgment } from '../types';
import { firebaseService } from './firebaseService';

class EmergencyService {
  private readonly COLLECTION = 'emergencies';

  async getEmergencies(): Promise<EmergencyEvent[]> {
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
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      throw new Error('Failed to fetch emergencies');
    }
  }

  async getActiveEmergencies(): Promise<EmergencyEvent[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('status', '==', EmergencyStatus.ACTIVE)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching active emergencies:', error);
      throw new Error('Failed to fetch active emergencies');
    }
  }

  async getEmergenciesBySite(siteId: string): Promise<EmergencyEvent[]> {
    try {
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
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching emergencies by site:', error);
      throw new Error('Failed to fetch emergencies by site');
    }
  }

  async getEmergenciesByType(type: EmergencyType): Promise<EmergencyEvent[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching emergencies by type:', error);
      throw new Error('Failed to fetch emergencies by type');
    }
  }

  async createEmergency(emergencyData: Partial<EmergencyEvent>): Promise<EmergencyEvent> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newEmergency = {
        ...emergencyData,
        startTime: new Date(),
        createdAt: new Date(),
        status: EmergencyStatus.ACTIVE,
        readAcknowledgments: [],
        notificationsSent: false,
        affectedUsers: emergencyData.affectedUsers || [],
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await firebaseService.firestore
        .collection(this.COLLECTION)
        .add(newEmergency);

      const emergency = {
        id: docRef.id,
        ...newEmergency,
      } as EmergencyEvent;

      // Client-side trigger: Handle emergency creation effects
      await this.onEmergencyCreated(emergency);

      return emergency;
    } catch (error) {
      console.error('Error creating emergency:', error);
      throw new Error('Failed to create emergency');
    }
  }

  // Client-side trigger for emergency creation (free tier alternative to Cloud Functions)
  private async onEmergencyCreated(emergency: EmergencyEvent): Promise<void> {
    try {
      console.log(`Client-side trigger: New emergency created: ${emergency.id}`);

      // Update site status (internal Firebase operation)
      if (emergency.siteId && firebaseService.firestore) {
        await firebaseService.firestore!
          .collection('sites')
          .doc(emergency.siteId)
          .update({
            hasActiveEmergency: true,
            lastEmergencyAt: new Date(),
          });
      }

      // Create notification records for affected users
      if (emergency.affectedUsers && emergency.affectedUsers.length > 0 && firebaseService.firestore) {
        const batch = firebaseService.firestore!.batch();
        
        emergency.affectedUsers.forEach((userId: string) => {
          const notificationRef = firebaseService.firestore!.collection('notifications').doc();
          if (notificationRef) {
            batch.set(notificationRef, {
            userId,
            type: 'emergency',
            title: `Emergency: ${emergency.type?.toUpperCase()}`,
            body: emergency.description || 'Emergency situation reported',
            data: {
              emergencyId: emergency.id,
              siteId: emergency.siteId,
              severity: emergency.severity,
            },
            read: false,
            createdAt: new Date(),
            });
          }
        });

        await batch.commit();
        console.log(`Created notifications for ${emergency.affectedUsers.length} affected users`);
      }

      console.log(`Emergency ${emergency.id} processed successfully`);
    } catch (error) {
      console.error(`Error in client-side emergency creation trigger:`, error);
    }
  }

  async updateEmergency(emergencyId: string, updates: Partial<EmergencyEvent>): Promise<EmergencyEvent> {
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
        .doc(emergencyId)
        .update(updateData);

      // Get updated emergency
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as EmergencyEvent;
    } catch (error) {
      console.error('Error updating emergency:', error);
      throw new Error('Failed to update emergency');
    }
  }

  async resolveEmergency(emergencyId: string, resolutionNotes?: string): Promise<EmergencyEvent> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          status: EmergencyStatus.RESOLVED,
          endTime: new Date(),
          resolutionNotes,
          updatedAt: new Date(),
        });

      // Get updated emergency
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as EmergencyEvent;
    } catch (error) {
      console.error('Error resolving emergency:', error);
      throw new Error('Failed to resolve emergency');
    }
  }

  async cancelEmergency(emergencyId: string, cancellationReason?: string): Promise<EmergencyEvent> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          status: EmergencyStatus.CANCELLED,
          endTime: new Date(),
          cancellationReason,
          updatedAt: new Date(),
        });

      // Get updated emergency
      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as EmergencyEvent;
    } catch (error) {
      console.error('Error cancelling emergency:', error);
      throw new Error('Failed to cancel emergency');
    }
  }

  async broadcastEmergency(emergencyId: string): Promise<void> {
    try {
      const emergency = await this.getEmergencyById(emergencyId);
      if (!emergency) {
        throw new Error('Emergency not found');
      }

      // Send emergency notifications to affected users
      const notifications = emergency.affectedUsers.map(userId => ({
        userId,
        type: 'EMERGENCY_ALERT',
        title: `Emergency: ${emergency.type}`,
        message: emergency.description,
        data: {
          emergencyId: emergency.id,
          type: emergency.type,
          severity: emergency.severity,
          siteId: emergency.siteId,
          location: emergency.location,
        },
        timestamp: new Date(),
        isRead: false,
        priority: 'high',
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

      // Mark emergency as broadcasted
      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          notificationsSent: true,
          broadcastTime: new Date(),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error broadcasting emergency:', error);
      throw new Error('Failed to broadcast emergency');
    }
  }

  async acknowledgeEmergency(emergencyId: string, userId: string, acknowledgment: ReadAcknowledgment): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          readAcknowledgments: (firebaseService.firestore as any).FieldValue.arrayUnion({
            ...acknowledgment,
            userId,
            timestamp: new Date(),
          }),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error acknowledging emergency:', error);
      throw new Error('Failed to acknowledge emergency');
    }
  }

  async triggerEvacuation(siteId: string, reason: string): Promise<EmergencyEvent> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const evacuationEmergency: Partial<EmergencyEvent> = {
        type: EmergencyType.EVACUATION,
        severity: EmergencySeverity.CRITICAL,
        description: `Evacuation required: ${reason}`,
        siteId,
        location: 'Entire Site',
        createdBy: user.uid,
        createdAt: new Date(),
        status: EmergencyStatus.ACTIVE,
        readAcknowledgments: [],
        notificationsSent: false,
        affectedUsers: [], // Will be populated with all site users
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .add(evacuationEmergency);

      return {
        id: docRef.id,
        ...evacuationEmergency,
      } as EmergencyEvent;
    } catch (error) {
      console.error('Error triggering evacuation:', error);
      throw new Error('Failed to trigger evacuation');
    }
  }

  async getEmergencyById(emergencyId: string): Promise<EmergencyEvent | null> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const doc = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
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
      } as EmergencyEvent;
    } catch (error) {
      console.error('Error fetching emergency:', error);
      throw new Error('Failed to fetch emergency');
    }
  }

  async addAffectedUser(emergencyId: string, userId: string): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          affectedUsers: (firebaseService.firestore as any).FieldValue.arrayUnion(userId),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error adding affected user:', error);
      throw new Error('Failed to add affected user');
    }
  }

  async removeAffectedUser(emergencyId: string, userId: string): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore!
        .collection(this.COLLECTION)
        .doc(emergencyId)
        .update({
          affectedUsers: (firebaseService.firestore as any).FieldValue.arrayRemove(userId),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error removing affected user:', error);
      throw new Error('Failed to remove affected user');
    }
  }

  async getEmergenciesByUser(userId: string): Promise<EmergencyEvent[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore!
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
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching emergencies by user:', error);
      throw new Error('Failed to fetch emergencies by user');
    }
  }

  async getActiveEmergenciesByUser(userId: string): Promise<EmergencyEvent[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore!
        .collection(this.COLLECTION)
        .where('affectedUsers', 'array-contains', userId)
        .where('status', '==', EmergencyStatus.ACTIVE)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as EmergencyEvent[];
    } catch (error) {
      console.error('Error fetching active emergencies by user:', error);
      throw new Error('Failed to fetch active emergencies by user');
    }
  }

  async getEmergencyStats(siteId?: string): Promise<{
    total: number;
    active: number;
    resolved: number;
    cancelled: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      let query = firebaseService.firestore.collection(this.COLLECTION);
      
      if (siteId) {
        query = query.where('siteId', '==', siteId);
      }

      const snapshot = await query.get();
      const emergencies = snapshot.docs.map(doc => doc.data()) as EmergencyEvent[];

      const stats = {
        total: emergencies.length,
        active: emergencies.filter(e => e.status === EmergencyStatus.ACTIVE).length,
        resolved: emergencies.filter(e => e.status === EmergencyStatus.RESOLVED).length,
        cancelled: emergencies.filter(e => e.status === EmergencyStatus.CANCELLED).length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
      };

      // Count by type
      emergencies.forEach(emergency => {
        const type = emergency.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      // Count by severity
      emergencies.forEach(emergency => {
        const severity = emergency.severity;
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching emergency stats:', error);
      throw new Error('Failed to fetch emergency stats');
    }
  }

  async getUnacknowledgedEmergencies(userId: string): Promise<EmergencyEvent[]> {
    try {
      const userEmergencies = await this.getActiveEmergenciesByUser(userId);
      
      return userEmergencies.filter(emergency => 
        !emergency.readAcknowledgments?.some(ack => ack.userId === userId)
      );
    } catch (error) {
      console.error('Error fetching unacknowledged emergencies:', error);
      throw new Error('Failed to fetch unacknowledged emergencies');
    }
  }

  async checkUserAcknowledgment(emergencyId: string, userId: string): Promise<boolean> {
    try {
      const emergency = await this.getEmergencyById(emergencyId);
      if (!emergency) {
        return false;
      }

      return emergency.readAcknowledgments?.some(ack => ack.userId === userId) || false;
    } catch (error) {
      console.error('Error checking user acknowledgment:', error);
      throw new Error('Failed to check user acknowledgment');
    }
  }

  async getEmergencyAcknowledgmentRate(emergencyId: string): Promise<{
    totalUsers: number;
    acknowledgedUsers: number;
    acknowledgmentRate: number;
  }> {
    try {
      const emergency = await this.getEmergencyById(emergencyId);
      if (!emergency) {
        throw new Error('Emergency not found');
      }

      const totalUsers = emergency.affectedUsers?.length || 0;
      const acknowledgedUsers = emergency.readAcknowledgments?.length || 0;
      const acknowledgmentRate = totalUsers > 0 ? (acknowledgedUsers / totalUsers) * 100 : 0;

      return {
        totalUsers,
        acknowledgedUsers,
        acknowledgmentRate,
      };
    } catch (error) {
      console.error('Error calculating acknowledgment rate:', error);
      throw new Error('Failed to calculate acknowledgment rate');
    }
  }
}

export const emergencyService = new EmergencyService();
