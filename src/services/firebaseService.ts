import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  // Generic CRUD operations
  async getDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
      let q: Query<DocumentData> = collection(db, collectionName);

      // Apply conditions
      if (conditions && conditions.length > 0) {
        conditions.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, collectionName), docData);
      const newDoc = await getDoc(docRef);

      return {
        id: docRef.id,
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
      const docRef = doc(db, collectionName, documentId);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, updateData);
      return await this.getDocument<T>(collectionName, documentId) as T;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
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
    const docRef = doc(db, collectionName, documentId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const document: T = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
    let q: Query<DocumentData> = collection(db, collectionName);

    // Apply conditions
    if (conditions && conditions.length > 0) {
      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });
    }

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
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
}

export const firebaseService = new FirebaseService();
