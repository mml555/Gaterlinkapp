import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import free-tier compatible functions
import { 
  onUserCreated, 
  onEmergencyCreated, 
  onAccessRequestCreated, 
  scheduledCleanup 
} from './free-tier-functions';

// Export all free-tier compatible functions
export {
  onUserCreated,
  onEmergencyCreated,
  onAccessRequestCreated,
  scheduledCleanup,
};

// HTTP Functions (limited to internal operations on free plan)
export const api = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { method, path } = req;

    // Route requests based on path
    switch (path) {
      case '/health':
        res.status(200).json({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          plan: 'Spark (Free)',
          features: 'Firestore triggers, internal operations only'
        });
        break;

      case '/notifications/create':
        if (method === 'POST') {
          // Create notification in Firestore (internal operation)
          const { userId, type, title, body, data } = req.body;
          
          if (!userId || !type || !title || !body) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
          }

          const notificationRef = admin.firestore().collection('notifications').doc();
          await notificationRef.set({
            userId,
            type,
            title,
            body,
            data: data || {},
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).json({ 
            message: 'Notification created', 
            notificationId: notificationRef.id 
          });
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;

      case '/users/claims':
        if (method === 'POST') {
          // Update user custom claims (internal Firebase operation)
          const { userId, claims } = req.body;
          
          if (!userId || !claims) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
          }

          await admin.auth().setCustomUserClaims(userId, claims);
          
          res.status(200).json({ 
            message: 'User claims updated', 
            userId 
          });
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;

      case '/data/cleanup':
        if (method === 'POST') {
          // Trigger manual cleanup (internal operation)
          const { collection, daysOld } = req.body;
          
          if (!collection) {
            res.status(400).json({ error: 'Collection name required' });
            return;
          }

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - (daysOld || 30));

          const query = admin.firestore().collection(collection)
            .where('createdAt', '<', cutoffDate);

          const snapshot = await query.get();
          const batch = admin.firestore().batch();
          
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();

          res.status(200).json({ 
            message: 'Cleanup completed', 
            deletedCount: snapshot.docs.length 
          });
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;

      default:
        res.status(404).json({ 
          error: 'Endpoint not found',
          availableEndpoints: [
            '/health',
            '/notifications/create',
            '/users/claims',
            '/data/cleanup'
          ]
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Callable functions (work on free plan for internal operations)
export const createNotification = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, type, title, body, data: notificationData } = data;

    if (!userId || !type || !title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const notificationRef = admin.firestore().collection('notifications').doc();
    await notificationRef.set({
      userId,
      type,
      title,
      body,
      data: notificationData || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Notification created', 
      notificationId: notificationRef.id 
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create notification');
  }
});

export const updateUserClaims = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, claims } = data;

    if (!userId || !claims) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    await admin.auth().setCustomUserClaims(userId, claims);

    return { 
      success: true, 
      message: 'User claims updated', 
      userId 
    };
  } catch (error) {
    console.error('Error updating user claims:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user claims');
  }
});

export const markNotificationRead = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Notification ID required');
    }

    await admin.firestore().collection('notifications').doc(notificationId).update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Notification marked as read' 
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new functions.https.HttpsError('internal', 'Failed to mark notification as read');
  }
});
