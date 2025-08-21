import { 
  Equipment, 
  Reservation, 
  EquipmentStatus, 
  ReservationStatus,
  ChecklistResponse,
  DamageReport
} from '../types';
import { firebaseService } from './firebaseService';

class EquipmentService {
  private readonly EQUIPMENT_COLLECTION = 'equipment';
  private readonly RESERVATIONS_COLLECTION = 'reservations';
  private readonly CHECKLISTS_COLLECTION = 'checklistResponses';
  private readonly DAMAGE_REPORTS_COLLECTION = 'damageReports';

  // Equipment Management
  async getEquipment(): Promise<Equipment[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        maintenanceSchedule: {
          ...doc.data().maintenanceSchedule,
          lastMaintenance: doc.data().maintenanceSchedule?.lastMaintenance?.toDate() || new Date(),
          nextMaintenance: doc.data().maintenanceSchedule?.nextMaintenance?.toDate() || new Date(),
        },
      })) as Equipment[];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async getEquipmentBySite(siteId: string): Promise<Equipment[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .where('siteId', '==', siteId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        maintenanceSchedule: {
          ...doc.data().maintenanceSchedule,
          lastMaintenance: doc.data().maintenanceSchedule?.lastMaintenance?.toDate() || new Date(),
          nextMaintenance: doc.data().maintenanceSchedule?.nextMaintenance?.toDate() || new Date(),
        },
      })) as Equipment[];
    } catch (error) {
      console.error('Error fetching equipment by site:', error);
      throw new Error('Failed to fetch equipment by site');
    }
  }

  async getEquipmentById(equipmentId: string): Promise<Equipment> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const doc = await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .doc(equipmentId)
        .get();

      if (!doc.exists) {
        throw new Error('Equipment not found');
      }

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        maintenanceSchedule: {
          ...doc.data()?.maintenanceSchedule,
          lastMaintenance: doc.data()?.maintenanceSchedule?.lastMaintenance?.toDate() || new Date(),
          nextMaintenance: doc.data()?.maintenanceSchedule?.nextMaintenance?.toDate() || new Date(),
        },
      } as Equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async createEquipment(equipmentData: Partial<Equipment>): Promise<Equipment> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newEquipment: Partial<Equipment> = {
        ...equipmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: EquipmentStatus.AVAILABLE,
        maintenanceSchedule: {
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          maintenanceInterval: 30,
          maintenanceType: 'routine',
          ...equipmentData.maintenanceSchedule,
        },
        checklists: equipmentData.checklists || [],
      };

      const docRef = await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .add(newEquipment);

      return {
        id: docRef.id,
        ...newEquipment,
      } as Equipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw new Error('Failed to create equipment');
    }
  }

  async updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<Equipment> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .doc(equipmentId)
        .update(updateData);

      return this.getEquipmentById(equipmentId);
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw new Error('Failed to update equipment');
    }
  }

  async deleteEquipment(equipmentId: string): Promise<void> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .doc(equipmentId)
        .delete();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw new Error('Failed to delete equipment');
    }
  }

  async setEquipmentStatus(equipmentId: string, status: EquipmentStatus): Promise<Equipment> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .doc(equipmentId)
        .update({
          status,
          updatedAt: new Date(),
        });

      return this.getEquipmentById(equipmentId);
    } catch (error) {
      console.error('Error setting equipment status:', error);
      throw new Error('Failed to set equipment status');
    }
  }

  // Reservation Management
  async getReservations(): Promise<Reservation[]> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        deniedAt: doc.data().deniedAt?.toDate(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw new Error('Failed to fetch reservations');
    }
  }

  async getUserReservations(): Promise<Reservation[]> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        deniedAt: doc.data().deniedAt?.toDate(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw new Error('Failed to fetch user reservations');
    }
  }

  async createReservation(reservationData: Partial<Reservation>): Promise<Reservation> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newReservation: Partial<Reservation> = {
        ...reservationData,
        userId: user.uid,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        needsApproval: true, // Default to requiring approval
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .add(newReservation);

      return {
        id: docRef.id,
        ...newReservation,
      } as Reservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw new Error('Failed to create reservation');
    }
  }

  async updateReservation(reservationId: string, updates: Partial<Reservation>): Promise<Reservation> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .update(updateData);

      // Get updated reservation
      const doc = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        approvedAt: doc.data()?.approvedAt?.toDate(),
        deniedAt: doc.data()?.deniedAt?.toDate(),
      } as Reservation;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw new Error('Failed to update reservation');
    }
  }

  async cancelReservation(reservationId: string): Promise<Reservation> {
    try {
      if (!firebaseService.firestore) {
        throw new Error('Firestore not initialized');
      }

      await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .update({
          status: ReservationStatus.CANCELLED,
          updatedAt: new Date(),
        });

      // Get updated reservation
      const doc = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        approvedAt: doc.data()?.approvedAt?.toDate(),
        deniedAt: doc.data()?.deniedAt?.toDate(),
      } as Reservation;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw new Error('Failed to cancel reservation');
    }
  }

  async approveReservation(reservationId: string): Promise<Reservation> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .update({
          status: ReservationStatus.APPROVED,
          approvedBy: user.uid,
          approvedAt: new Date(),
          updatedAt: new Date(),
        });

      // Get updated reservation
      const doc = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        approvedAt: doc.data()?.approvedAt?.toDate(),
        deniedAt: doc.data()?.deniedAt?.toDate(),
      } as Reservation;
    } catch (error) {
      console.error('Error approving reservation:', error);
      throw new Error('Failed to approve reservation');
    }
  }

  async denyReservation(reservationId: string, reason: string): Promise<Reservation> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .update({
          status: ReservationStatus.DENIED,
          deniedBy: user.uid,
          deniedAt: new Date(),
          denialReason: reason,
          updatedAt: new Date(),
        });

      // Get updated reservation
      const doc = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .doc(reservationId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data()?.startTime?.toDate() || new Date(),
        endTime: doc.data()?.endTime?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        approvedAt: doc.data()?.approvedAt?.toDate(),
        deniedAt: doc.data()?.deniedAt?.toDate(),
      } as Reservation;
    } catch (error) {
      console.error('Error denying reservation:', error);
      throw new Error('Failed to deny reservation');
    }
  }

  // Checklist Management
  async submitChecklist(reservationId: string, checklistResponse: ChecklistResponse): Promise<any> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { id, ...checklistResponseData } = checklistResponse;
      const checklistData = {
        ...checklistResponseData,
        reservationId,
        completedBy: user.uid,
        completedAt: new Date(),
      };

      const docRef = await firebaseService.firestore
        .collection(this.CHECKLISTS_COLLECTION)
        .add(checklistData);

      return {
        reservationId,
        checklistResponse: {
          id: docRef.id,
          ...checklistData,
        },
      };
    } catch (error) {
      console.error('Error submitting checklist:', error);
      throw new Error('Failed to submit checklist');
    }
  }

  // Damage Report Management
  async submitDamageReport(reservationId: string, damageReport: Partial<DamageReport>): Promise<any> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const reportData = {
        ...damageReport,
        reservationId,
        reportedBy: user.uid,
        reportedAt: new Date(),
      };

      const docRef = await firebaseService.firestore
        .collection(this.DAMAGE_REPORTS_COLLECTION)
        .add(reportData);

      return {
        reservationId,
        damageReport: {
          id: docRef.id,
          ...reportData,
        },
      };
    } catch (error) {
      console.error('Error submitting damage report:', error);
      throw new Error('Failed to submit damage report');
    }
  }

  // Equipment QR Code Lookup
  async getEquipmentByQRCode(qrCode: string): Promise<Equipment | null> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.EQUIPMENT_COLLECTION)
        .where('qrCode', '==', qrCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        maintenanceSchedule: {
          ...doc.data().maintenanceSchedule,
          lastMaintenance: doc.data().maintenanceSchedule?.lastMaintenance?.toDate() || new Date(),
          nextMaintenance: doc.data().maintenanceSchedule?.nextMaintenance?.toDate() || new Date(),
        },
      } as Equipment;
    } catch (error) {
      console.error('Error fetching equipment by QR code:', error);
      throw new Error('Failed to fetch equipment by QR code');
    }
  }

  // Check for reservation conflicts
  async checkReservationConflicts(equipmentId: string, startTime: Date, endTime: Date): Promise<Reservation[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.RESERVATIONS_COLLECTION)
        .where('equipmentId', '==', equipmentId)
        .where('status', 'in', [ReservationStatus.APPROVED, ReservationStatus.ACTIVE])
        .get();

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))
        .filter(reservation => {
          // Check for time overlap
          return (
            (startTime >= reservation.startTime && startTime < reservation.endTime) ||
            (endTime > reservation.startTime && endTime <= reservation.endTime) ||
            (startTime <= reservation.startTime && endTime >= reservation.endTime)
          );
        }) as Reservation[];
    } catch (error) {
      console.error('Error checking reservation conflicts:', error);
      throw new Error('Failed to check reservation conflicts');
    }
  }
}

export const equipmentService = new EquipmentService();
