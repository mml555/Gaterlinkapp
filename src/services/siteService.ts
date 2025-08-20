import { Site, SiteStatus, PremiumFeature } from '../types';
import { firebaseService } from './firebaseService';

class SiteService {
  private readonly COLLECTION = 'sites';

  async getSites(): Promise<Site[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Site[];
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw new Error('Failed to fetch sites');
    }
  }

  async getSiteById(siteId: string): Promise<Site> {
    try {
      const doc = await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .get();

      if (!doc.exists) {
        throw new Error('Site not found');
      }

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      } as Site;
    } catch (error) {
      console.error('Error fetching site:', error);
      throw new Error('Failed to fetch site');
    }
  }

  async createSite(siteData: Partial<Site>): Promise<Site> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newSite: Partial<Site> = {
        ...siteData,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: SiteStatus.ACTIVE,
        settings: {
          autoApprovalEnabled: false,
          requireDocumentation: true,
          maxConcurrentUsers: 100,
          emergencyContacts: [],
          safetyRules: [],
          equipmentLibraryEnabled: false,
          premiumFeatures: [],
          ...siteData.settings,
        },
      };

      const docRef = await firebaseService.firestore
        .collection(this.COLLECTION)
        .add(newSite);

      return {
        id: docRef.id,
        ...newSite,
      } as Site;
    } catch (error) {
      console.error('Error creating site:', error);
      throw new Error('Failed to create site');
    }
  }

  async updateSite(siteId: string, updates: Partial<Site>): Promise<Site> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .update(updateData);

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error updating site:', error);
      throw new Error('Failed to update site');
    }
  }

  async deleteSite(siteId: string): Promise<void> {
    try {
      await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .delete();
    } catch (error) {
      console.error('Error deleting site:', error);
      throw new Error('Failed to delete site');
    }
  }

  async getUserSites(): Promise<Site[]> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get sites where user is a member
      const snapshot = await firebaseService.firestore
        .collection('userSites')
        .where('userId', '==', user.uid)
        .get();

      const siteIds = snapshot.docs.map(doc => doc.data().siteId);
      
      if (siteIds.length === 0) {
        return [];
      }

      const sitesSnapshot = await firebaseService.firestore
        .collection(this.COLLECTION)
        .where(firebaseService.firestore.FieldPath.documentId(), 'in', siteIds)
        .get();

      return sitesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Site[];
    } catch (error) {
      console.error('Error fetching user sites:', error);
      throw new Error('Failed to fetch user sites');
    }
  }

  async setSiteStatus(siteId: string, status: SiteStatus): Promise<Site> {
    try {
      await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .update({
          status,
          updatedAt: new Date(),
        });

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error setting site status:', error);
      throw new Error('Failed to set site status');
    }
  }

  async enablePremiumFeature(siteId: string, feature: PremiumFeature): Promise<Site> {
    try {
      const site = await this.getSiteById(siteId);
      const currentFeatures = site.settings.premiumFeatures || [];
      
      if (!currentFeatures.includes(feature)) {
        await firebaseService.firestore
          .collection(this.COLLECTION)
          .doc(siteId)
          .update({
            'settings.premiumFeatures': firebaseService.firestore.FieldValue.arrayUnion(feature),
            updatedAt: new Date(),
          });
      }

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error enabling premium feature:', error);
      throw new Error('Failed to enable premium feature');
    }
  }

  async addUserToSite(siteId: string, userId: string, role: string): Promise<void> {
    try {
      await firebaseService.firestore
        .collection('userSites')
        .add({
          siteId,
          userId,
          role,
          joinedAt: new Date(),
        });
    } catch (error) {
      console.error('Error adding user to site:', error);
      throw new Error('Failed to add user to site');
    }
  }

  async removeUserFromSite(siteId: string, userId: string): Promise<void> {
    try {
      const snapshot = await firebaseService.firestore
        .collection('userSites')
        .where('siteId', '==', siteId)
        .where('userId', '==', userId)
        .get();

      const batch = firebaseService.firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing user from site:', error);
      throw new Error('Failed to remove user from site');
    }
  }

  async getSiteMembers(siteId: string): Promise<any[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection('userSites')
        .where('siteId', '==', siteId)
        .get();

      const userIds = snapshot.docs.map(doc => doc.data().userId);
      
      if (userIds.length === 0) {
        return [];
      }

      const usersSnapshot = await firebaseService.firestore
        .collection('users')
        .where(firebaseService.firestore.FieldPath.documentId(), 'in', userIds)
        .get();

      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching site members:', error);
      throw new Error('Failed to fetch site members');
    }
  }

  async updateSiteSettings(siteId: string, settings: any): Promise<Site> {
    try {
      await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .update({
          settings,
          updatedAt: new Date(),
        });

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw new Error('Failed to update site settings');
    }
  }

  async addEmergencyContact(siteId: string, contact: any): Promise<Site> {
    try {
      const site = await this.getSiteById(siteId);
      const currentContacts = site.settings.emergencyContacts || [];
      
      await firebaseService.firestore
        .collection(this.COLLECTION)
        .doc(siteId)
        .update({
          'settings.emergencyContacts': firebaseService.firestore.FieldValue.arrayUnion(contact),
          updatedAt: new Date(),
        });

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw new Error('Failed to add emergency contact');
    }
  }

  async removeEmergencyContact(siteId: string, contactIndex: number): Promise<Site> {
    try {
      const site = await this.getSiteById(siteId);
      const currentContacts = site.settings.emergencyContacts || [];
      
      if (contactIndex >= 0 && contactIndex < currentContacts.length) {
        currentContacts.splice(contactIndex, 1);
        
        await firebaseService.firestore
          .collection(this.COLLECTION)
          .doc(siteId)
          .update({
            'settings.emergencyContacts': currentContacts,
            updatedAt: new Date(),
          });
      }

      return this.getSiteById(siteId);
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      throw new Error('Failed to remove emergency contact');
    }
  }
}

export const siteService = new SiteService();
