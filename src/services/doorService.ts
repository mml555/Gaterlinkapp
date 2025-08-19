import { firebaseService, FirestoreDocument } from './firebaseService';
import { auth } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import CryptoJS from 'crypto-js';

export interface Door extends FirestoreDocument {
  name: string;
  location: string;
  status: 'locked' | 'unlocked' | 'offline';
  accessLevel: 'admin' | 'user' | 'guest';
  lastAccess?: Date;
  lastAccessBy?: string;
  qrCode?: string;
  nfcTag?: string;
  isActive: boolean;
  ownerId: string;
  allowedUsers: string[];
  settings: {
    autoLock: boolean;
    autoLockDelay?: number; // in seconds
    notifyOnAccess: boolean;
    requireBiometric: boolean;
  };
}

export interface DoorAccess extends FirestoreDocument {
  doorId: string;
  doorName: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
  action: 'unlock' | 'lock' | 'access_denied' | 'access_granted';
  method: 'app' | 'qr' | 'nfc' | 'biometric' | 'remote';
  success: boolean;
  failureReason?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DoorAccessRequest extends FirestoreDocument {
  doorId: string;
  doorName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAccessLevel: 'user' | 'guest';
  message?: string;
  expiresAt?: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  approvedBy?: string;
  deniedBy?: string;
  denialReason?: string;
}

class DoorService {
  private readonly DOORS_COLLECTION = 'doors';
  private readonly ACCESS_LOGS_COLLECTION = 'doorAccessLogs';
  private readonly ACCESS_REQUESTS_COLLECTION = 'doorAccessRequests';
  private readonly QR_SECRET = 'gaterlink_qr_secret_2024';

  // Door Management
  async getDoors(userId?: string): Promise<Door[]> {
    try {
      const currentUser = userId || auth.currentUser?.uid;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get doors where user is owner or in allowedUsers
      const conditions = [
        { field: 'isActive', operator: '==', value: true }
      ];

      const ownedDoors = await firebaseService.getDocuments<Door>(
        this.DOORS_COLLECTION,
        [
          ...conditions,
          { field: 'ownerId', operator: '==', value: currentUser }
        ],
        'lastAccess',
        'desc'
      );

      const allowedDoors = await firebaseService.getDocuments<Door>(
        this.DOORS_COLLECTION,
        [
          ...conditions,
          { field: 'allowedUsers', operator: 'array-contains', value: currentUser }
        ],
        'lastAccess',
        'desc'
      );

      // Combine and remove duplicates
      const doorMap = new Map<string, Door>();
      [...ownedDoors, ...allowedDoors].forEach(door => {
        doorMap.set(door.id, door);
      });

      return Array.from(doorMap.values());
    } catch (error) {
      console.error('Error getting doors:', error);
      throw error;
    }
  }

  async getDoorById(doorId: string): Promise<Door | null> {
    try {
      const door = await firebaseService.getDocument<Door>(this.DOORS_COLLECTION, doorId);
      
      if (!door || !door.isActive) {
        return null;
      }

      // Check if user has access
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const hasAccess = door.ownerId === currentUser.uid || 
                       door.allowedUsers.includes(currentUser.uid);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      return door;
    } catch (error) {
      console.error('Error getting door:', error);
      throw error;
    }
  }

  async createDoor(doorData: Omit<Door, 'id' | 'createdAt' | 'updatedAt'>): Promise<Door> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const door = await firebaseService.addDocument<Door>(
        this.DOORS_COLLECTION,
        {
          ...doorData,
          ownerId: currentUser.uid,
          status: 'locked',
          isActive: true,
          allowedUsers: doorData.allowedUsers || [],
          qrCode: this.generateQRCodeString(Date.now().toString()),
          settings: {
            autoLock: true,
            autoLockDelay: 30,
            notifyOnAccess: true,
            requireBiometric: false,
            ...doorData.settings
          }
        }
      );

      return door;
    } catch (error) {
      console.error('Error creating door:', error);
      throw error;
    }
  }

  async updateDoor(doorId: string, updates: Partial<Omit<Door, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Door> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      // Only owner can update door
      const currentUser = auth.currentUser;
      if (!currentUser || door.ownerId !== currentUser.uid) {
        throw new Error('Only door owner can update door');
      }

      return await firebaseService.updateDocument<Door>(
        this.DOORS_COLLECTION,
        doorId,
        updates
      );
    } catch (error) {
      console.error('Error updating door:', error);
      throw error;
    }
  }

  async deleteDoor(doorId: string): Promise<void> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      // Only owner can delete door
      const currentUser = auth.currentUser;
      if (!currentUser || door.ownerId !== currentUser.uid) {
        throw new Error('Only door owner can delete door');
      }

      // Soft delete
      await firebaseService.updateDocument<Door>(
        this.DOORS_COLLECTION,
        doorId,
        { isActive: false }
      );
    } catch (error) {
      console.error('Error deleting door:', error);
      throw error;
    }
  }

  // Door Access Control
  async unlockDoor(doorId: string, method: DoorAccess['method'] = 'app', location?: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const door = await this.getDoorById(doorId);
      if (!door) {
        await this.logAccess(doorId, 'Unknown Door', 'access_denied', method, false, 'Door not found', location);
        return false;
      }

      // Check if user has access
      const hasAccess = door.ownerId === currentUser.uid || 
                       door.allowedUsers.includes(currentUser.uid);
      
      if (!hasAccess) {
        await this.logAccess(doorId, door.name, 'access_denied', method, false, 'Unauthorized', location);
        return false;
      }

      // Update door status
      await firebaseService.updateDocument<Door>(
        this.DOORS_COLLECTION,
        doorId,
        {
          status: 'unlocked',
          lastAccess: new Date(),
          lastAccessBy: currentUser.uid
        }
      );

      // Log successful access
      await this.logAccess(doorId, door.name, 'unlock', method, true, undefined, location);

      // Schedule auto-lock if enabled
      if (door.settings.autoLock && door.settings.autoLockDelay) {
        setTimeout(() => {
          this.lockDoor(doorId, 'app').catch(console.error);
        }, door.settings.autoLockDelay * 1000);
      }

      return true;
    } catch (error) {
      console.error('Error unlocking door:', error);
      return false;
    }
  }

  async lockDoor(doorId: string, method: DoorAccess['method'] = 'app', location?: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const door = await this.getDoorById(doorId);
      if (!door) {
        return false;
      }

      // Update door status
      await firebaseService.updateDocument<Door>(
        this.DOORS_COLLECTION,
        doorId,
        {
          status: 'locked',
          lastAccess: new Date(),
          lastAccessBy: currentUser.uid
        }
      );

      // Log lock action
      await this.logAccess(doorId, door.name, 'lock', method, true, undefined, location);

      return true;
    } catch (error) {
      console.error('Error locking door:', error);
      return false;
    }
  }

  // Access Logging
  private async logAccess(
    doorId: string,
    doorName: string,
    action: DoorAccess['action'],
    method: DoorAccess['method'],
    success: boolean,
    failureReason?: string,
    location?: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await firebaseService.addDocument<DoorAccess>(
        this.ACCESS_LOGS_COLLECTION,
        {
          doorId,
          doorName,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Unknown',
          userEmail: currentUser.email || '',
          timestamp: new Date(),
          action,
          method,
          success,
          failureReason,
          location
        }
      );
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  async getDoorAccessLogs(doorId: string, limit: number = 50): Promise<DoorAccess[]> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      return await firebaseService.getDocuments<DoorAccess>(
        this.ACCESS_LOGS_COLLECTION,
        [{ field: 'doorId', operator: '==', value: doorId }],
        'timestamp',
        'desc',
        limit
      );
    } catch (error) {
      console.error('Error getting access logs:', error);
      throw error;
    }
  }

  // QR Code Management
  private generateQRCodeString(doorId: string): string {
    const timestamp = Date.now();
    const data = `${doorId}:${timestamp}`;
    const hash = CryptoJS.HmacSHA256(data, this.QR_SECRET).toString();
    return `GLD:${doorId}:${timestamp}:${hash}`;
  }

  async generateQRCode(doorId: string): Promise<string> {
    try {
      const door = await this.getDoorById(doorId);
      if (!door) {
        throw new Error('Door not found');
      }

      const qrCode = this.generateQRCodeString(doorId);
      
      // Update door with new QR code
      await firebaseService.updateDocument<Door>(
        this.DOORS_COLLECTION,
        doorId,
        { qrCode }
      );

      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async validateQRCode(qrCode: string): Promise<{ valid: boolean; doorId?: string }> {
    try {
      if (!qrCode.startsWith('GLD:')) {
        return { valid: false };
      }

      const parts = qrCode.split(':');
      if (parts.length !== 4) {
        return { valid: false };
      }

      const [prefix, doorId, timestamp, hash] = parts;
      
      // Verify hash
      const data = `${doorId}:${timestamp}`;
      const expectedHash = CryptoJS.HmacSHA256(data, this.QR_SECRET).toString();
      
      if (hash !== expectedHash) {
        return { valid: false };
      }

      // Check if QR code is not too old (24 hours)
      const age = Date.now() - parseInt(timestamp);
      if (age > 24 * 60 * 60 * 1000) {
        return { valid: false };
      }

      // Verify door exists and QR matches
      const door = await firebaseService.getDocument<Door>(this.DOORS_COLLECTION, doorId);
      if (!door || door.qrCode !== qrCode) {
        return { valid: false };
      }

      return { valid: true, doorId };
    } catch (error) {
      console.error('Error validating QR code:', error);
      return { valid: false };
    }
  }

  // Access Requests
  async requestAccess(doorId: string, message?: string, requestedAccessLevel: 'user' | 'guest' = 'user'): Promise<DoorAccessRequest> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const door = await firebaseService.getDocument<Door>(this.DOORS_COLLECTION, doorId);
      if (!door || !door.isActive) {
        throw new Error('Door not found');
      }

      // Check if user already has access
      if (door.ownerId === currentUser.uid || door.allowedUsers.includes(currentUser.uid)) {
        throw new Error('You already have access to this door');
      }

      // Check for existing pending request
      const existingRequests = await firebaseService.getDocuments<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        [
          { field: 'doorId', operator: '==', value: doorId },
          { field: 'requesterId', operator: '==', value: currentUser.uid },
          { field: 'status', operator: '==', value: 'pending' }
        ]
      );

      if (existingRequests.length > 0) {
        throw new Error('You already have a pending request for this door');
      }

      const request = await firebaseService.addDocument<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        {
          doorId,
          doorName: door.name,
          requesterId: currentUser.uid,
          requesterName: currentUser.displayName || 'Unknown',
          requesterEmail: currentUser.email || '',
          ownerId: door.ownerId,
          status: 'pending',
          requestedAccessLevel,
          message,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      );

      return request;
    } catch (error) {
      console.error('Error requesting access:', error);
      throw error;
    }
  }

  async getAccessRequests(type: 'incoming' | 'outgoing' = 'incoming'): Promise<DoorAccessRequest[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const field = type === 'incoming' ? 'ownerId' : 'requesterId';
      
      return await firebaseService.getDocuments<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        [{ field, operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );
    } catch (error) {
      console.error('Error getting access requests:', error);
      throw error;
    }
  }

  async approveAccessRequest(requestId: string): Promise<DoorAccessRequest> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const request = await firebaseService.getDocument<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        requestId
      );

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.ownerId !== currentUser.uid) {
        throw new Error('Only door owner can approve requests');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      // Add user to door's allowedUsers
      const door = await firebaseService.getDocument<Door>(this.DOORS_COLLECTION, request.doorId);
      if (door) {
        await firebaseService.updateDocument<Door>(
          this.DOORS_COLLECTION,
          request.doorId,
          {
            allowedUsers: [...door.allowedUsers, request.requesterId]
          }
        );
      }

      // Update request status
      return await firebaseService.updateDocument<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        requestId,
        {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: currentUser.uid
        }
      );
    } catch (error) {
      console.error('Error approving access request:', error);
      throw error;
    }
  }

  async denyAccessRequest(requestId: string, reason?: string): Promise<DoorAccessRequest> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const request = await firebaseService.getDocument<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        requestId
      );

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.ownerId !== currentUser.uid) {
        throw new Error('Only door owner can deny requests');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      // Update request status
      return await firebaseService.updateDocument<DoorAccessRequest>(
        this.ACCESS_REQUESTS_COLLECTION,
        requestId,
        {
          status: 'denied',
          deniedAt: new Date(),
          deniedBy: currentUser.uid,
          denialReason: reason
        }
      );
    } catch (error) {
      console.error('Error denying access request:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  subscribeToDoors(callback: (doors: Door[]) => void): () => void {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User not authenticated');
      return () => {};
    }

    // Subscribe to owned doors
    const unsubscribeOwned = firebaseService.subscribeToCollection<Door>(
      this.DOORS_COLLECTION,
      (doors) => {
        // This will be called for owned doors
        callback(doors);
      },
      [
        { field: 'ownerId', operator: '==', value: currentUser.uid },
        { field: 'isActive', operator: '==', value: true }
      ],
      'lastAccess',
      'desc'
    );

    // Note: We can't easily subscribe to array-contains queries with the current setup
    // For a complete solution, we'd need to refactor the subscription logic

    return unsubscribeOwned;
  }

  subscribeToDoorStatus(doorId: string, callback: (door: Door | null) => void): () => void {
    return firebaseService.subscribeToDocument<Door>(
      this.DOORS_COLLECTION,
      doorId,
      callback
    );
  }
}

export const doorService = new DoorService();