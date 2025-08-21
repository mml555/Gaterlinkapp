import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  // Expose auth instance
  get auth() {
    return auth();
  }

  // Expose firestore instance for legacy compatibility
  get firestore() {
    return {
      collection: (collectionName: string) => {
        const collectionRef = firestore().collection(collectionName);
        
        return {
          doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
          add: (data: any) => firestore().collection(collectionName).add(data),
          where: (field: string, operator: any, value: any) => {
            const q = firestore().collection(collectionName).where(field, operator, value);
            return {
              doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
              add: (data: any) => firestore().collection(collectionName).add(data),
              where: (field2: string, operator2: any, value2: any) => {
                const q2 = firestore().collection(collectionName).where(field2, operator2, value2);
                return {
                  doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                  add: (data: any) => firestore().collection(collectionName).add(data),
                  where: (field3: string, operator3: any, value3: any) => {
                    const q3 = firestore().collection(collectionName).where(field3, operator3, value3);
                    return {
                      doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                      add: (data: any) => firestore().collection(collectionName).add(data),
                      orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
                        const q4 = firestore().collection(collectionName).orderBy(orderField, direction);
                        return {
                          doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                          add: (data: any) => firestore().collection(collectionName).add(data),
                          limit: (count: number) => {
                            const q5 = firestore().collection(collectionName).limit(count);
                            return {
                              doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                              add: (data: any) => firestore().collection(collectionName).add(data),
                              get: () => q5.get(),
                              onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q5.onSnapshot(callback, errorCallback),
                            };
                          },
                          get: () => q4.get(),
                          onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q4.onSnapshot(callback, errorCallback),
                        };
                      },
                      limit: (count: number) => {
                        const q4 = firestore().collection(collectionName).limit(count);
                        return {
                          doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                          add: (data: any) => firestore().collection(collectionName).add(data),
                          get: () => q4.get(),
                          onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q4.onSnapshot(callback, errorCallback),
                        };
                      },
                      get: () => q3.get(),
                      onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q3.onSnapshot(callback, errorCallback),
                    };
                  },
                  orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
                    const q3 = firestore().collection(collectionName).orderBy(orderField, direction);
                    return {
                      doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                      add: (data: any) => firestore().collection(collectionName).add(data),
                      limit: (count: number) => {
                        const q4 = firestore().collection(collectionName).limit(count);
                        return {
                          doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                          add: (data: any) => firestore().collection(collectionName).add(data),
                          get: () => q4.get(),
                          onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q4.onSnapshot(callback, errorCallback),
                        };
                      },
                      get: () => q3.get(),
                      onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q3.onSnapshot(callback, errorCallback),
                    };
                  },
                  limit: (count: number) => {
                    const q3 = firestore().collection(collectionName).limit(count);
                    return {
                      doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                      add: (data: any) => firestore().collection(collectionName).add(data),
                      get: () => q3.get(),
                      onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q3.onSnapshot(callback, errorCallback),
                    };
                  },
                  get: () => q2.get(),
                  onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q2.onSnapshot(callback, errorCallback),
                };
              },
              orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
                const q2 = firestore().collection(collectionName).orderBy(orderField, direction);
                return {
                  doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                  add: (data: any) => firestore().collection(collectionName).add(data),
                  limit: (count: number) => {
                    const q3 = firestore().collection(collectionName).limit(count);
                    return {
                      doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                      add: (data: any) => firestore().collection(collectionName).add(data),
                      get: () => q3.get(),
                      onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q3.onSnapshot(callback, errorCallback),
                    };
                  },
                  get: () => q2.get(),
                  onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q2.onSnapshot(callback, errorCallback),
                };
              },
              limit: (count: number) => {
                const q2 = firestore().collection(collectionName).limit(count);
                return {
                  doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                  add: (data: any) => firestore().collection(collectionName).add(data),
                  get: () => q2.get(),
                  onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q2.onSnapshot(callback, errorCallback),
                };
              },
              get: () => q.get(),
              onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q.onSnapshot(callback, errorCallback),
            };
          },
          orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
            const q = firestore().collection(collectionName).orderBy(field, direction);
            return {
              doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
              add: (data: any) => firestore().collection(collectionName).add(data),
              limit: (count: number) => {
                const q2 = firestore().collection(collectionName).limit(count);
                return {
                  doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
                  add: (data: any) => firestore().collection(collectionName).add(data),
                  get: () => q2.get(),
                  onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q2.onSnapshot(callback, errorCallback),
                };
              },
              get: () => q.get(),
              onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q.onSnapshot(callback, errorCallback),
            };
          },
          limit: (count: number) => {
            const q = firestore().collection(collectionName).limit(count);
            return {
              doc: (docId?: string) => docId ? firestore().collection(collectionName).doc(docId) : null,
              add: (data: any) => firestore().collection(collectionName).add(data),
              get: () => q.get(),
              onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => q.onSnapshot(callback, errorCallback),
            };
          },
          get: () => firestore().collection(collectionName).get(),
          onSnapshot: (callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => firestore().collection(collectionName).onSnapshot(callback, errorCallback),
        };
      },
      batch: () => firestore().batch(),
      FieldValue: {
        arrayUnion: (value: any) => (firestore() as any).FieldValue.arrayUnion(value),
        arrayRemove: (value: any) => (firestore() as any).FieldValue.arrayRemove(value),
        increment: (value: number) => ({ increment: value }), // Legacy increment support
        serverTimestamp: () => (firestore() as any).FieldValue.serverTimestamp(),
      },
      FieldPath: {
        documentId: () => (firestore() as any).FieldPath.documentId(),
      },
    };
  }

  // Generic CRUD operations
  async getDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = firestore().collection(collectionName).doc(documentId);
      const docSnap = await docRef.get();

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocuments<T extends FirestoreDocument>(
    collectionName: string,
    conditions?: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = firestore().collection(collectionName);

      // Apply conditions
      if (conditions && conditions.length > 0) {
        conditions.forEach(({ field, operator, value }) => {
          q = q.where(field, operator, value);
        });
      }

      // Apply ordering
      if (orderByField) {
        q = q.orderBy(orderByField, orderDirection);
      }

      // Apply limit
      if (limitCount) {
        q = q.limit(limitCount);
      }

      const querySnapshot = await q.get();
      const documents: T[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as T);
      });

      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  async addDocument<T extends FirestoreDocument>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    try {
      const docData = {
        ...data,
        createdAt: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
        updatedAt: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
      };

      const docRef = await firestore().collection(collectionName).add(docData);
      const newDoc = await docRef.get();

      return {
        id: newDoc.id,
        ...newDoc.data(),
        createdAt: newDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: newDoc.data()?.updatedAt?.toDate() || new Date(),
      } as T;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T> {
    try {
      const docRef = firestore().collection(collectionName).doc(documentId);
      const updateData = {
        ...data,
        updatedAt: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);
      return await this.getDocument<T>(collectionName, documentId) as T;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = firestore().collection(collectionName).doc(documentId);
      await docRef.delete();
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    callback: (document: T | null) => void
  ): () => void {
    const docRef = firestore().collection(collectionName).doc(documentId);
    
    return docRef.onSnapshot((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const document: T = {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        } as T;
        callback(document);
      } else {
        callback(null);
      }
    });
  }

  subscribeToCollection<T extends FirestoreDocument>(
    collectionName: string,
    callback: (documents: T[]) => void,
    conditions?: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): () => void {
    let q: any = firestore().collection(collectionName);

    // Apply conditions
    if (conditions && conditions.length > 0) {
      conditions.forEach(({ field, operator, value }) => {
        q = q.where(field, operator, value);
      });
    }

    // Apply ordering
    if (orderByField) {
      q = q.orderBy(orderByField, orderDirection);
    }

    return q.onSnapshot((querySnapshot: any) => {
      const documents: T[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as T);
      });
      callback(documents);
    });
  }

  // Batch operations
  async batchAddDocuments<T extends FirestoreDocument>(
    collectionName: string,
    documents: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T[]> {
    try {
      const promises = documents.map(doc => this.addDocument(collectionName, doc));
      return await Promise.all(promises);
    } catch (error) {
      console.error(`Error batch adding documents to ${collectionName}:`, error);
      throw error;
    }
  }

  async batchUpdateDocuments<T extends FirestoreDocument>(
    collectionName: string,
    updates: Array<{ id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }>
  ): Promise<T[]> {
    try {
      const promises = updates.map(({ id, data }) => 
        this.updateDocument(collectionName, id, data)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error(`Error batch updating documents in ${collectionName}:`, error);
      throw error;
    }
  }

  async batchDeleteDocuments(
    collectionName: string,
    documentIds: string[]
  ): Promise<void> {
    try {
      const promises = documentIds.map(id => this.deleteDocument(collectionName, id));
      await Promise.all(promises);
    } catch (error) {
      console.error(`Error batch deleting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Test Firestore permissions
  async testFirestorePermissions(): Promise<void> {
    try {
      console.log('🧪 Testing Firestore permissions...');
      
      // Test 1: Try to read from notifications collection
      const notificationsQuery = firestore().collection('notifications').limit(1);
      
      const snapshot = await notificationsQuery.get();
      console.log('✅ Notifications collection access: SUCCESS');
      
      // Test 2: Try to read from sites collection
      const sitesQuery = firestore().collection('sites').limit(1);
      const sitesSnapshot = await sitesQuery.get();
      console.log('✅ Sites collection access: SUCCESS');
      
      // Test 3: Try to read from doors collection
      const doorsQuery = firestore().collection('doors').limit(1);
      const doorsSnapshot = await doorsQuery.get();
      console.log('✅ Doors collection access: SUCCESS');
      
      // Test 4: Try to read from users collection
      const usersQuery = firestore().collection('users').limit(1);
      const usersSnapshot = await usersQuery.get();
      console.log('✅ Users collection access: SUCCESS');
      
      console.log('🎉 All Firestore permission tests passed!');
    } catch (error: any) {
      console.error('❌ Firestore permission test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.warn('🔒 Permission denied - check Firestore rules');
      } else if (error.code === 'failed-precondition') {
        console.warn('📊 Missing index - check Firestore indexes');
      }
    }
  }
}

export const firebaseService = new FirebaseService();
