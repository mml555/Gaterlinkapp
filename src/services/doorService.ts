import { Door, AccessRequest, AccessAction, DoorStatus, DoorType, LockType } from '../types';
import { firebaseService } from './firebaseService';
import firestore from '@react-native-firebase/firestore';

class DoorService {
  private readonly DOORS_COLLECTION = 'doors';
  private readonly ACCESS_REQUESTS_COLLECTION = 'accessRequests';
  private readonly ACCESS_LOGS_COLLECTION = 'accessLogs';

  // Door Management
  async getDoors(): Promise<Door[]> {
    try {
      const q = firestore().collection(this.DOORS_COLLECTION).orderBy('name', 'asc');
      const snapshot = await q.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Door[];
    } catch (error) {
      console.error('Error fetching doors:', error);
      throw new Error('Failed to fetch doors');
    }
  }

  async getDoorsBySite(siteId: string): Promise<Door[]> {
    try {
      const q = firestore().collection(this.DOORS_COLLECTION).where('siteId', '==', siteId).orderBy('name', 'asc');
      const snapshot = await q.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Door[];
    } catch (error) {
      console.error('Error fetching doors by site:', error);
      throw new Error('Failed to fetch doors by site');
    }
  }

  async getDoorById(doorId: string): Promise<Door | null> {
    try {
      const docRef = firestore().collection(this.DOORS_COLLECTION).doc(doorId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as Door;
    } catch (error) {
      console.error('Error fetching door:', error);
      throw new Error('Failed to fetch door');
    }
  }

  async getDoorByQRCode(qrCode: string): Promise<Door | null> {
    try {
      const q = firestore().collection(this.DOORS_COLLECTION).where('qrCode', '==', qrCode).limit(1);
      const snapshot = await q.get();

      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Door;
    } catch (error) {
      console.error('Error fetching door by QR code:', error);
      throw new Error('Failed to fetch door by QR code');
    }
  }

  async createDoor(doorData: Partial<Door>): Promise<Door> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newDoor: Partial<Door> = {
        ...doorData,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: DoorStatus.ACTIVE,
        accessCount: 0,
        lastAccess: null,
      };

      const docRef = await firestore().collection(this.DOORS_COLLECTION).add(newDoor);

      return {
        id: docRef.id,
        ...newDoor,
      } as Door;
    } catch (error) {
      console.error('Error creating door:', error);
      throw new Error('Failed to create door');
    }
  }

  async updateDoor(doorId: string, updates: Partial<Door>): Promise<Door> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await firestore().collection(this.DOORS_COLLECTION).doc(doorId).update(updateData);

      // Get updated door
      const docSnap = await firestore().collection(this.DOORS_COLLECTION).doc(doorId).get();

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as Door;
    } catch (error) {
      console.error('Error updating door:', error);
      throw new Error('Failed to update door');
    }
  }

  async deleteDoor(doorId: string): Promise<void> {
    try {
      await firestore().collection(this.DOORS_COLLECTION).doc(doorId).delete();
    } catch (error) {
      console.error('Error deleting door:', error);
      throw new Error('Failed to delete door');
    }
  }

  async setDoorStatus(doorId: string, status: DoorStatus): Promise<Door> {
    try {
      await firestore().collection(this.DOORS_COLLECTION).doc(doorId).update({
        status,
        updatedAt: new Date(),
      });

      // Get updated door
      const docSnap = await firestore().collection(this.DOORS_COLLECTION).doc(doorId).get();

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as Door;
    } catch (error) {
      console.error('Error setting door status:', error);
      throw new Error('Failed to set door status');
    }
  }

  // Access Request Management
  async createAccessRequest(requestData: Partial<AccessRequest>): Promise<AccessRequest> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newRequest: Partial<AccessRequest> = {
        ...requestData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        documents: requestData.documents || [],
        messages: requestData.messages || [],
      };

      const docRef = await firestore().collection(this.ACCESS_REQUESTS_COLLECTION).add(newRequest);

      return {
        id: docRef.id,
        ...newRequest,
      } as AccessRequest;
    } catch (error) {
      console.error('Error creating access request:', error);
      throw new Error('Failed to create access request');
    }
  }

  async getAccessRequestById(requestId: string): Promise<AccessRequest | null> {
    try {
      const docSnap = await firestore().collection(this.ACCESS_REQUESTS_COLLECTION).doc(requestId).get();

      if (!docSnap.exists) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as AccessRequest;
    } catch (error) {
      console.error('Error fetching access request:', error);
      throw new Error('Failed to fetch access request');
    }
  }

  async getAccessRequestsByUser(userId: string): Promise<AccessRequest[]> {
    try {
      const q = firestore().collection(this.ACCESS_REQUESTS_COLLECTION).where('userId', '==', userId).orderBy('createdAt', 'desc');
      const snapshot = await q.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching access requests by user:', error);
      throw new Error('Failed to fetch access requests by user');
    }
  }

  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    try {
      const q = firestore().collection(this.ACCESS_REQUESTS_COLLECTION).where('status', '==', 'pending').orderBy('createdAt', 'asc');
      const snapshot = await q.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching pending access requests:', error);
      throw new Error('Failed to fetch pending access requests');
    }
  }

  async updateAccessRequest(requestId: string, updates: Partial<AccessRequest>): Promise<AccessRequest> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await firestore().collection(this.ACCESS_REQUESTS_COLLECTION).doc(requestId).update(updateData);

      // Get updated request
      const docSnap = await firestore().collection(this.ACCESS_REQUESTS_COLLECTION).doc(requestId).get();

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as AccessRequest;
    } catch (error) {
      console.error('Error updating access request:', error);
      throw new Error('Failed to update access request');
    }
  }

  async approveAccessRequest(requestId: string, approvedBy: string, notes?: string): Promise<AccessRequest> {
    try {
      const request = await this.getAccessRequestById(requestId);
      if (!request) {
        throw new Error('Access request not found');
      }

      // Generate access token/code
      const accessToken = this.generateAccessToken();
      const accessCode = this.generateAccessCode();

      const updates = {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        accessToken,
        accessCode,
        notes,
        updatedAt: new Date(),
      };

      return await this.updateAccessRequest(requestId, updates);
    } catch (error) {
      console.error('Error approving access request:', error);
      throw new Error('Failed to approve access request');
    }
  }

  async denyAccessRequest(requestId: string, deniedBy: string, reason: string): Promise<AccessRequest> {
    try {
      const updates = {
        status: 'denied',
        deniedBy,
        deniedAt: new Date(),
        denialReason: reason,
        updatedAt: new Date(),
      };

      return await this.updateAccessRequest(requestId, updates);
    } catch (error) {
      console.error('Error denying access request:', error);
      throw new Error('Failed to deny access request');
    }
  }

  async addMessageToRequest(requestId: string, message: string, senderId: string): Promise<AccessRequest> {
    try {
      const request = await this.getAccessRequestById(requestId);
      if (!request) {
        throw new Error('Access request not found');
      }

      const newMessage = {
        id: Date.now().toString(),
        message,
        senderId,
        timestamp: new Date(),
      };

      const messages = [...(request.messages || []), newMessage];

      return await this.updateAccessRequest(requestId, { messages });
    } catch (error) {
      console.error('Error adding message to request:', error);
      throw new Error('Failed to add message to request');
    }
  }

  async addDocumentToRequest(requestId: string, document: any): Promise<AccessRequest> {
    try {
      const request = await this.getAccessRequestById(requestId);
      if (!request) {
        throw new Error('Access request not found');
      }

      const documents = [...(request.documents || []), document];

      return await this.updateAccessRequest(requestId, { documents });
    } catch (error) {
      console.error('Error adding document to request:', error);
      throw new Error('Failed to add document to request');
    }
  }

  // Access Logging
  async logAccessEvent(logData: {
    doorId: string;
    userId: string;
    action: AccessAction;
    success: boolean;
    metadata?: any;
  }): Promise<void> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const accessLog = {
        ...logData,
        timestamp: new Date(),
        deviceInfo: {
          platform: 'mobile',
          appVersion: '1.0.0',
          timestamp: new Date(),
        },
      };

      await firestore().collection(this.ACCESS_LOGS_COLLECTION).add(accessLog);

      // Update door access count and last access
      if (logData.success && logData.action === AccessAction.ENTER) {
        await firestore().collection(this.DOORS_COLLECTION).doc(logData.doorId).update({
          accessCount: firebaseService.firestore.FieldValue.increment(1),
          lastAccess: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error logging access event:', error);
      throw new Error('Failed to log access event');
    }
  }

  async getAccessLogs(doorId?: string, userId?: string, limit: number = 100): Promise<any[]> {
    try {
      let q = firestore().collection(this.ACCESS_LOGS_COLLECTION).orderBy('timestamp', 'desc').limit(limit);

      if (doorId) {
        q = q.where('doorId', '==', doorId);
      }

      if (userId) {
        q = q.where('userId', '==', userId);
      }

      const snapshot = await q.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching access logs:', error);
      throw new Error('Failed to fetch access logs');
    }
  }

  // QR Code Management
  async generateQRCode(doorId: string): Promise<string> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      // Generate unique QR code
      const qrCode = `DOOR_${doorId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update door with new QR code
      await this.updateDoor(doorId, { qrCode });

      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async validateQRCode(qrCode: string): Promise<{ isValid: boolean; door?: Door; error?: string }> {
    try {
      const door = await this.getDoorByQRCode(qrCode);
      
      if (!door) {
        return { isValid: false, error: 'Invalid QR code' };
      }

      if (door.status !== DoorStatus.ACTIVE) {
        return { isValid: false, error: `Door is ${door.status}` };
      }

      return { isValid: true, door };
    } catch (error) {
      console.error('Error validating QR code:', error);
      return { isValid: false, error: 'Failed to validate QR code' };
    }
  }

  // Utility Methods
  private generateAccessToken(): string {
    return `TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAccessCode(): string {
    return Math.random().toString().substr(2, 6); // 6-digit code
  }

  // Door Statistics
  async getDoorStats(doorId: string): Promise<{
    totalAccesses: number;
    todayAccesses: number;
    lastAccess: Date | null;
    averageAccessTime: number;
  }> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLogs = await firestore()
        .collection(this.ACCESS_LOGS_COLLECTION)
        .where('doorId', '==', doorId)
        .where('action', '==', AccessAction.ENTER)
        .where('success', '==', true)
        .where('timestamp', '>=', today)
        .get();

      const todayAccesses = todayLogs.size;

      return {
        totalAccesses: door.accessCount || 0,
        todayAccesses,
        lastAccess: door.lastAccess,
        averageAccessTime: 0, // Would need to calculate from logs
      };
    } catch (error) {
      console.error('Error fetching door stats:', error);
      throw new Error('Failed to fetch door stats');
    }
  }

  async getSiteDoorStats(siteId: string): Promise<{
    totalDoors: number;
    activeDoors: number;
    totalAccesses: number;
    todayAccesses: number;
  }> {
    try {
      const doors = await this.getDoorsBySite(siteId);
      const activeDoors = doors.filter(door => door.status === DoorStatus.ACTIVE);

      let totalAccesses = 0;
      let todayAccesses = 0;

      for (const door of doors) {
        const stats = await this.getDoorStats(door.id);
        totalAccesses += stats.totalAccesses;
        todayAccesses += stats.todayAccesses;
      }

      return {
        totalDoors: doors.length,
        activeDoors: activeDoors.length,
        totalAccesses,
        todayAccesses,
      };
    } catch (error) {
      console.error('Error fetching site door stats:', error);
      throw new Error('Failed to fetch site door stats');
    }
  }

  // Saved Doors Management
  async saveDoor(doorId: string): Promise<Door> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }
      
      // In a real implementation, this would save to user's saved doors
      // For now, just return the door
      return door;
    } catch (error) {
      console.error('Error saving door:', error);
      throw new Error('Failed to save door');
    }
  }

  async removeSavedDoor(doorId: string): Promise<void> {
    try {
      // In a real implementation, this would remove from user's saved doors
      // For now, just validate the door exists
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }
    } catch (error) {
      console.error('Error removing saved door:', error);
      throw new Error('Failed to remove saved door');
    }
  }

  // Site Management
  async getSites(): Promise<any[]> {
    try {
      // This would typically come from a siteService
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw new Error('Failed to fetch sites');
    }
  }

  async getSiteById(siteId: string): Promise<any> {
    try {
      // This would typically come from a siteService
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error fetching site:', error);
      throw new Error('Failed to fetch site');
    }
  }

  // Work Orders Management
  async getWorkOrdersByTrade(tradeType: any): Promise<any[]> {
    try {
      // This would typically come from a workOrderService
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw new Error('Failed to fetch work orders');
    }
  }

  // Equipment Management
  async getEquipmentByQRCode(qrCode: string): Promise<any> {
    try {
      // This would typically come from an equipmentService
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error fetching equipment by QR code:', error);
      throw new Error('Failed to fetch equipment by QR code');
    }
  }
}

export const doorService = new DoorService();
