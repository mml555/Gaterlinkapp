"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledCleanup = exports.onAccessRequestCreated = exports.onEmergencyCreated = exports.onUserUpdated = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// These triggers work on the FREE Spark plan
// They can only access Firebase services (no external APIs)
exports.onUserCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    console.log(`New user created: ${userId}`);
    try {
        // Set custom claims based on user role from the document
        const userRole = userData.role || 'customer';
        const defaultClaims = {
            role: userRole.toLowerCase(), // Normalize to lowercase
            isActive: true,
            lastLogin: Date.now(),
        };
        await admin.auth().setCustomUserClaims(userId, defaultClaims);
        // Create default notification settings
        await snap.ref.update({
            notificationSettings: {
                pushEnabled: true,
                emailEnabled: true,
                smsEnabled: false,
                soundEnabled: true,
                badgeEnabled: true,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`User setup completed for: ${userId} with role: ${userRole}`);
    }
    catch (error) {
        console.error('Error in onUserCreated:', error);
    }
});
exports.onUserUpdated = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;
    // Check if role has changed
    if (beforeData.role !== afterData.role) {
        console.log(`User role updated for ${userId}: ${beforeData.role} -> ${afterData.role}`);
        try {
            // Update custom claims with new role
            const updatedClaims = {
                role: afterData.role.toLowerCase(), // Normalize to lowercase
                isActive: afterData.isActive !== false, // Default to true if not specified
                lastLogin: Date.now(),
            };
            await admin.auth().setCustomUserClaims(userId, updatedClaims);
            console.log(`Custom claims updated for user: ${userId}`);
        }
        catch (error) {
            console.error('Error updating custom claims:', error);
        }
    }
});
exports.onEmergencyCreated = functions.firestore
    .document('emergencies/{emergencyId}')
    .onCreate(async (snap, context) => {
    const emergency = snap.data();
    const emergencyId = context.params.emergencyId;
    console.log(`New emergency created: ${emergencyId}`);
    try {
        // Update site status (internal Firebase operation)
        await db.collection('sites').doc(emergency.siteId).update({
            hasActiveEmergency: true,
            lastEmergencyAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create notification records for affected users
        if (emergency.affectedUsers && emergency.affectedUsers.length > 0) {
            const batch = db.batch();
            emergency.affectedUsers.forEach((userId) => {
                const notificationRef = db.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId,
                    type: 'emergency',
                    title: `Emergency: ${emergency.type.toUpperCase()}`,
                    body: emergency.description,
                    data: {
                        emergencyId,
                        siteId: emergency.siteId,
                        severity: emergency.severity,
                    },
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            await batch.commit();
        }
        console.log(`Emergency ${emergencyId} processed successfully`);
    }
    catch (error) {
        console.error(`Error processing emergency ${emergencyId}:`, error);
    }
});
exports.onAccessRequestCreated = functions.firestore
    .document('accessRequests/{requestId}')
    .onCreate(async (snap, context) => {
    const request = snap.data();
    const requestId = context.params.requestId;
    console.log(`New access request created: ${requestId}`);
    try {
        // Create notifications for site managers
        const siteManagers = await db.collection('siteMemberships')
            .where('siteId', '==', request.siteId)
            .where('role', '==', 'site_manager')
            .get();
        const batch = db.batch();
        siteManagers.docs.forEach(doc => {
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
                userId: doc.data().userId,
                type: 'access_request',
                title: 'New Access Request',
                body: `${request.userName} requested access to ${request.doorName}`,
                data: {
                    requestId,
                    siteId: request.siteId,
                    doorId: request.doorId,
                },
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        console.log(`Access request ${requestId} processed successfully`);
    }
    catch (error) {
        console.error(`Error processing access request ${requestId}:`, error);
    }
});
// Scheduled function for cleanup (works on free plan)
exports.scheduledCleanup = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    try {
        console.log('Running scheduled cleanup...');
        // Clean up expired holds
        const holdsRef = db.collection('holds');
        const expiredHolds = await holdsRef
            .where('expiresAt', '<', new Date())
            .where('status', '==', 'active')
            .get();
        const batch = db.batch();
        expiredHolds.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'expired',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        if (expiredHolds.docs.length > 0) {
            await batch.commit();
            console.log(`Cleaned up ${expiredHolds.docs.length} expired holds`);
        }
        // Clean up old notifications (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const notificationsRef = db.collection('notifications');
        const oldNotifications = await notificationsRef
            .where('createdAt', '<', thirtyDaysAgo)
            .where('read', '==', true)
            .get();
        const notificationBatch = db.batch();
        oldNotifications.docs.forEach(doc => {
            notificationBatch.delete(doc.ref);
        });
        if (oldNotifications.docs.length > 0) {
            await notificationBatch.commit();
            console.log(`Cleaned up ${oldNotifications.docs.length} old notifications`);
        }
        console.log('Scheduled cleanup completed successfully');
    }
    catch (error) {
        console.error('Scheduled cleanup failed:', error);
    }
});
//# sourceMappingURL=free-tier-functions.js.map