import { AccessRequest, Document, DocumentType, DocumentStatus } from '../types';
import { firebaseService } from './firebaseService';

class RequestService {
  private readonly REQUESTS_COLLECTION = 'accessRequests';
  private readonly DOCUMENTS_COLLECTION = 'documents';
  private readonly MESSAGES_COLLECTION = 'messages';

  // Request Management
  async getRequests(): Promise<AccessRequest[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw new Error('Failed to fetch requests');
    }
  }

  async getRequestById(requestId: string): Promise<AccessRequest | null> {
    try {
      const doc = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .doc(requestId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      } as AccessRequest;
    } catch (error) {
      console.error('Error fetching request:', error);
      throw new Error('Failed to fetch request');
    }
  }

  async getRequestsByUser(userId: string): Promise<AccessRequest[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching requests by user:', error);
      throw new Error('Failed to fetch requests by user');
    }
  }

  async getRequestsBySite(siteId: string): Promise<AccessRequest[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .where('siteId', '==', siteId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching requests by site:', error);
      throw new Error('Failed to fetch requests by site');
    }
  }

  async getPendingRequests(): Promise<AccessRequest[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw new Error('Failed to fetch pending requests');
    }
  }

  async getRequestsByStatus(status: string): Promise<AccessRequest[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];
    } catch (error) {
      console.error('Error fetching requests by status:', error);
      throw new Error('Failed to fetch requests by status');
    }
  }

  async createRequest(requestData: Partial<AccessRequest>): Promise<AccessRequest> {
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

      const docRef = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .add(newRequest);

      const request = {
        id: docRef.id,
        ...newRequest,
      } as AccessRequest;

      // Client-side trigger: Handle access request creation effects
      await this.onAccessRequestCreated(request);

      return request;
    } catch (error) {
      console.error('Error creating request:', error);
      throw new Error('Failed to create request');
    }
  }

  // Client-side trigger for access request creation (free tier alternative to Cloud Functions)
  private async onAccessRequestCreated(request: AccessRequest): Promise<void> {
    try {
      console.log(`Client-side trigger: New access request created: ${request.id}`);

      // Create notifications for site managers
      const siteManagers = await firebaseService.firestore
        .collection('siteMemberships')
        .where('siteId', '==', request.siteId)
        .where('role', '==', 'site_manager')
        .get();

      if (!siteManagers.empty) {
        const batch = firebaseService.firestore.batch();
        
        siteManagers.docs.forEach(doc => {
          const notificationRef = firebaseService.firestore.collection('notifications').doc();
          batch.set(notificationRef, {
            userId: doc.data().userId,
            type: 'access_request',
            title: 'New Access Request',
            body: `${request.userName || 'User'} requested access to ${request.doorName || 'door'}`,
            data: {
              requestId: request.id,
              siteId: request.siteId,
              doorId: request.doorId,
            },
            read: false,
            createdAt: new Date(),
          });
        });

        await batch.commit();
        console.log(`Created notifications for ${siteManagers.docs.length} site managers`);
      }

      console.log(`Access request ${request.id} processed successfully`);
    } catch (error) {
      console.error(`Error in client-side access request creation trigger:`, error);
    }
  }

  async updateRequest(requestId: string, updates: Partial<AccessRequest>): Promise<AccessRequest> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .doc(requestId)
        .update(updateData);

      // Get updated request
      const doc = await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .doc(requestId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      } as AccessRequest;
    } catch (error) {
      console.error('Error updating request:', error);
      throw new Error('Failed to update request');
    }
  }

  async deleteRequest(requestId: string): Promise<void> {
    try {
      await firebaseService.firestore
        .collection(this.REQUESTS_COLLECTION)
        .doc(requestId)
        .delete();
    } catch (error) {
      console.error('Error deleting request:', error);
      throw new Error('Failed to delete request');
    }
  }

  // Request Approval Workflow
  async approveRequest(requestId: string, approvedBy: string, notes?: string): Promise<AccessRequest> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        throw new Error('Request not found');
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

      return await this.updateRequest(requestId, updates);
    } catch (error) {
      console.error('Error approving request:', error);
      throw new Error('Failed to approve request');
    }
  }

  async denyRequest(requestId: string, deniedBy: string, reason: string): Promise<AccessRequest> {
    try {
      const updates = {
        status: 'denied',
        deniedBy,
        deniedAt: new Date(),
        denialReason: reason,
        updatedAt: new Date(),
      };

      return await this.updateRequest(requestId, updates);
    } catch (error) {
      console.error('Error denying request:', error);
      throw new Error('Failed to deny request');
    }
  }

  async requestMoreInfo(requestId: string, requestedBy: string, infoNeeded: string): Promise<AccessRequest> {
    try {
      const updates = {
        status: 'info_required',
        infoRequestedBy: requestedBy,
        infoRequestedAt: new Date(),
        infoNeeded,
        updatedAt: new Date(),
      };

      return await this.updateRequest(requestId, updates);
    } catch (error) {
      console.error('Error requesting more info:', error);
      throw new Error('Failed to request more info');
    }
  }

  // Messaging
  async sendMessage(requestId: string, message: string, senderId: string): Promise<AccessRequest> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const newMessage = {
        id: Date.now().toString(),
        message,
        senderId,
        timestamp: new Date(),
        isRead: false,
      };

      const messages = [...(request.messages || []), newMessage];

      return await this.updateRequest(requestId, { messages });
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async markMessageAsRead(requestId: string, messageId: string): Promise<void> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const messages = request.messages?.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ) || [];

      await this.updateRequest(requestId, { messages });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  async getUnreadMessageCount(requestId: string, userId: string): Promise<number> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return 0;
      }

      return request.messages?.filter(msg => 
        msg.senderId !== userId && !msg.isRead
      ).length || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw new Error('Failed to get unread message count');
    }
  }

  // Document Management
  async uploadDocument(requestId: string, documentData: Partial<Document>): Promise<Document> {
    try {
      const user = firebaseService.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newDocument: Partial<Document> = {
        ...documentData,
        requestId,
        uploadedBy: user.uid,
        uploadedAt: new Date(),
        status: DocumentStatus.PENDING,
      };

      const docRef = await firebaseService.firestore
        .collection(this.DOCUMENTS_COLLECTION)
        .add(newDocument);

      // Add document to request
      const request = await this.getRequestById(requestId);
      if (request) {
        const documents = [...(request.documents || []), { id: docRef.id, ...newDocument }];
        await this.updateRequest(requestId, { documents });
      }

      return {
        id: docRef.id,
        ...newDocument,
      } as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async getDocumentsByRequest(requestId: string): Promise<Document[]> {
    try {
      const snapshot = await firebaseService.firestore
        .collection(this.DOCUMENTS_COLLECTION)
        .where('requestId', '==', requestId)
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      })) as Document[];
    } catch (error) {
      console.error('Error fetching documents by request:', error);
      throw new Error('Failed to fetch documents by request');
    }
  }

  async updateDocumentStatus(documentId: string, status: DocumentStatus, reviewedBy?: string): Promise<Document> {
    try {
      const updateData = {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      };

      await firebaseService.firestore
        .collection(this.DOCUMENTS_COLLECTION)
        .doc(documentId)
        .update(updateData);

      // Get updated document
      const doc = await firebaseService.firestore
        .collection(this.DOCUMENTS_COLLECTION)
        .doc(documentId)
        .get();

      return {
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data()?.uploadedAt?.toDate() || new Date(),
      } as Document;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error('Failed to update document status');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await firebaseService.firestore
        .collection(this.DOCUMENTS_COLLECTION)
        .doc(documentId)
        .delete();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  // Request Validation
  async validateDocuments(requestId: string): Promise<{
    isValid: boolean;
    missingDocuments: string[];
    invalidDocuments: string[];
  }> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const documents = await this.getDocumentsByRequest(requestId);
      const requiredDocuments = request.requiredDocuments || [];
      const missingDocuments: string[] = [];
      const invalidDocuments: string[] = [];

      // Check for missing required documents
      requiredDocuments.forEach(requiredDoc => {
        const hasDocument = documents.some(doc => doc.type === requiredDoc.type);
        if (!hasDocument) {
          missingDocuments.push(requiredDoc.type);
        }
      });

      // Check for invalid documents
      documents.forEach(doc => {
        if (doc.status === DocumentStatus.REJECTED) {
          invalidDocuments.push(doc.type);
        }
      });

      const isValid = missingDocuments.length === 0 && invalidDocuments.length === 0;

      return {
        isValid,
        missingDocuments,
        invalidDocuments,
      };
    } catch (error) {
      console.error('Error validating documents:', error);
      throw new Error('Failed to validate documents');
    }
  }

  // Request Statistics
  async getRequestStats(siteId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
    infoRequired: number;
    averageProcessingTime: number;
  }> {
    try {
      let query = firebaseService.firestore.collection(this.REQUESTS_COLLECTION);
      
      if (siteId) {
        query = query.where('siteId', '==', siteId);
      }

      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => doc.data()) as AccessRequest[];

      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        denied: requests.filter(r => r.status === 'denied').length,
        infoRequired: requests.filter(r => r.status === 'info_required').length,
        averageProcessingTime: 0,
      };

      // Calculate average processing time for completed requests
      const completedRequests = requests.filter(r => 
        r.status === 'approved' || r.status === 'denied'
      );

      if (completedRequests.length > 0) {
        const totalTime = completedRequests.reduce((sum, req) => {
          const approvedAt = req.approvedAt || req.deniedAt;
          if (approvedAt && req.createdAt) {
            return sum + (approvedAt.getTime() - req.createdAt.getTime());
          }
          return sum;
        }, 0);
        stats.averageProcessingTime = totalTime / completedRequests.length;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching request stats:', error);
      throw new Error('Failed to fetch request stats');
    }
  }

  // Utility Methods
  private generateAccessToken(): string {
    return `TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAccessCode(): string {
    return Math.random().toString().substr(2, 6); // 6-digit code
  }

  // Search and Filter
  async searchRequests(query: string, filters?: {
    status?: string;
    siteId?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AccessRequest[]> {
    try {
      let requestsQuery = firebaseService.firestore.collection(this.REQUESTS_COLLECTION);

      // Apply filters
      if (filters?.status) {
        requestsQuery = requestsQuery.where('status', '==', filters.status);
      }
      if (filters?.siteId) {
        requestsQuery = requestsQuery.where('siteId', '==', filters.siteId);
      }
      if (filters?.userId) {
        requestsQuery = requestsQuery.where('userId', '==', filters.userId);
      }

      const snapshot = await requestsQuery.orderBy('createdAt', 'desc').get();
      let requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AccessRequest[];

      // Apply date filters
      if (filters?.dateFrom) {
        requests = requests.filter(req => req.createdAt >= filters.dateFrom!);
      }
      if (filters?.dateTo) {
        requests = requests.filter(req => req.createdAt <= filters.dateTo!);
      }

      // Apply text search
      if (query) {
        const searchTerm = query.toLowerCase();
        requests = requests.filter(req => 
          req.reason?.toLowerCase().includes(searchTerm) ||
          req.notes?.toLowerCase().includes(searchTerm) ||
          req.doorName?.toLowerCase().includes(searchTerm)
        );
      }

      return requests;
    } catch (error) {
      console.error('Error searching requests:', error);
      throw new Error('Failed to search requests');
    }
  }

  // Bulk Operations
  async bulkApproveRequests(requestIds: string[], approvedBy: string, notes?: string): Promise<AccessRequest[]> {
    try {
      const approvedRequests: AccessRequest[] = [];
      
      for (const requestId of requestIds) {
        try {
          const approvedRequest = await this.approveRequest(requestId, approvedBy, notes);
          approvedRequests.push(approvedRequest);
        } catch (error) {
          console.error(`Error approving request ${requestId}:`, error);
          // Continue with other requests
        }
      }

      return approvedRequests;
    } catch (error) {
      console.error('Error bulk approving requests:', error);
      throw new Error('Failed to bulk approve requests');
    }
  }

  async bulkDenyRequests(requestIds: string[], deniedBy: string, reason: string): Promise<AccessRequest[]> {
    try {
      const deniedRequests: AccessRequest[] = [];
      
      for (const requestId of requestIds) {
        try {
          const deniedRequest = await this.denyRequest(requestId, deniedBy, reason);
          deniedRequests.push(deniedRequest);
        } catch (error) {
          console.error(`Error denying request ${requestId}:`, error);
          // Continue with other requests
        }
      }

      return deniedRequests;
    } catch (error) {
      console.error('Error bulk denying requests:', error);
      throw new Error('Failed to bulk deny requests');
    }
  }
}

export const requestService = new RequestService();
