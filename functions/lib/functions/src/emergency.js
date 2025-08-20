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
exports.emergencyFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const messaging = admin.messaging();
exports.emergencyFunctions = {
    // Triggered when a new emergency is created
    onEmergencyCreated: functions.firestore
        .document('emergencies/{emergencyId}')
        .onCreate(async (snap, context) => {
        const emergency = snap.data();
        const emergencyId = context.params.emergencyId;
        console.log(`New emergency created: ${emergencyId}`);
        try {
            // Broadcast emergency to all affected users
            await broadcastEmergency(emergency);
            // Send notifications to site managers and affected users
            await sendEmergencyNotifications(emergency);
            // Update site status
            await updateSiteEmergencyStatus(emergency.siteId, true);
            // Log emergency event
            await logEmergencyEvent(emergency, 'created');
            console.log(`Emergency ${emergencyId} processed successfully`);
        }
        catch (error) {
            console.error(`Error processing emergency ${emergencyId}:`, error);
        }
    }),
    // Triggered when an emergency is updated
    onEmergencyUpdated: functions.firestore
        .document('emergencies/{emergencyId}')
        .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const emergencyId = context.params.emergencyId;
        console.log(`Emergency updated: ${emergencyId}`);
        try {
            // Check if status changed
            if (beforeData.status !== afterData.status) {
                if (afterData.status === 'resolved') {
                    await onEmergencyResolved(afterData);
                }
                else if (afterData.status === 'cancelled') {
                    await onEmergencyCancelled(afterData);
                }
            }
            // Update affected users if changed
            if (JSON.stringify(beforeData.affectedUsers) !== JSON.stringify(afterData.affectedUsers)) {
                await updateEmergencySubscriptions(afterData);
            }
            // Log emergency update
            await logEmergencyEvent(afterData, 'updated');
            console.log(`Emergency ${emergencyId} update processed successfully`);
        }
        catch (error) {
            console.error(`Error processing emergency update ${emergencyId}:`, error);
        }
    }),
    // Triggered when an emergency is resolved
    onEmergencyResolved: functions.firestore
        .document('emergencies/{emergencyId}')
        .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        if (beforeData.status !== 'resolved' && afterData.status === 'resolved') {
            await handleEmergencyResolution(afterData);
        }
    }),
    // Broadcast emergency to all affected users
    broadcastEmergency: functions.https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { emergencyId } = data;
        try {
            const emergencyDoc = await db.collection('emergencies').doc(emergencyId).get();
            if (!emergencyDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Emergency not found');
            }
            const emergency = emergencyDoc.data();
            await broadcastEmergency(emergency);
            return { success: true, message: 'Emergency broadcasted successfully' };
        }
        catch (error) {
            console.error('Error broadcasting emergency:', error);
            throw new functions.https.HttpsError('internal', 'Failed to broadcast emergency');
        }
    }),
    // Send emergency notifications
    sendEmergencyNotifications: functions.https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { emergencyId } = data;
        try {
            const emergencyDoc = await db.collection('emergencies').doc(emergencyId).get();
            if (!emergencyDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Emergency not found');
            }
            const emergency = emergencyDoc.data();
            await sendEmergencyNotifications(emergency);
            return { success: true, message: 'Emergency notifications sent successfully' };
        }
        catch (error) {
            console.error('Error sending emergency notifications:', error);
            throw new functions.https.HttpsError('internal', 'Failed to send emergency notifications');
        }
    }),
    // Auto-resolve old emergencies
    autoResolveEmergencies: functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
        try {
            const now = new Date();
            const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
            const oldEmergencies = await db.collection('emergencies')
                .where('status', '==', 'active')
                .where('startTime', '<', cutoffTime)
                .get();
            const batch = db.batch();
            let resolvedCount = 0;
            oldEmergencies.forEach(doc => {
                const emergencyData = doc.data();
                // Auto-resolve if emergency is older than 24 hours
                batch.update(doc.ref, {
                    status: 'resolved',
                    endTime: now,
                    resolutionNotes: 'Auto-resolved after 24 hours',
                    updatedAt: now,
                });
                resolvedCount++;
            });
            if (resolvedCount > 0) {
                await batch.commit();
                console.log(`Auto-resolved ${resolvedCount} old emergencies`);
            }
            return { resolvedCount };
        }
        catch (error) {
            console.error('Error auto-resolving emergencies:', error);
            throw error;
        }
    }),
};
// Helper functions
async function broadcastEmergency(emergency) {
    try {
        // Get FCM tokens for affected users
        const tokens = await getFCMTokensForUsers(emergency.affectedUsers);
        if (tokens.length === 0) {
            console.log('No FCM tokens found for affected users');
            return;
        }
        // Prepare notification message
        const message = {
            notification: {
                title: `Emergency: ${emergency.type.toUpperCase()}`,
                body: emergency.description,
            },
            data: {
                type: 'emergency',
                emergencyId: emergency.id,
                severity: emergency.severity,
                siteId: emergency.siteId,
                timestamp: new Date().toISOString(),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'emergency-alerts',
                    priority: 'high',
                    sound: 'emergency',
                    vibrateTimingsMillis: [0, 500, 200, 500],
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: `Emergency: ${emergency.type.toUpperCase()}`,
                            body: emergency.description,
                        },
                        sound: 'emergency.wav',
                        badge: 1,
                        category: 'EMERGENCY',
                    },
                },
            },
            tokens: tokens,
        };
        // Send notification
        const response = await messaging.sendMulticast(message);
        console.log(`Emergency broadcast sent to ${response.successCount}/${tokens.length} devices`);
        // Update emergency document
        await db.collection('emergencies').doc(emergency.id).update({
            notificationsSent: true,
            broadcastTime: new Date(),
            updatedAt: new Date(),
        });
    }
    catch (error) {
        console.error('Error broadcasting emergency:', error);
        throw error;
    }
}
async function sendEmergencyNotifications(emergency) {
    try {
        // Send to affected users
        if (emergency.affectedUsers && emergency.affectedUsers.length > 0) {
            await sendNotificationsToUsers(emergency.affectedUsers, {
                title: `Emergency: ${emergency.type.toUpperCase()}`,
                body: emergency.description,
                data: {
                    type: 'emergency',
                    emergencyId: emergency.id,
                    severity: emergency.severity,
                    siteId: emergency.siteId,
                },
            });
        }
        // Send to site managers
        await sendNotificationsToSiteManagers(emergency.siteId, {
            title: `Emergency Alert: ${emergency.type.toUpperCase()}`,
            body: `Emergency at site: ${emergency.description}`,
            data: {
                type: 'emergency_manager',
                emergencyId: emergency.id,
                severity: emergency.severity,
                siteId: emergency.siteId,
            },
        });
    }
    catch (error) {
        console.error('Error sending emergency notifications:', error);
        throw error;
    }
}
async function onEmergencyResolved(emergency) {
    try {
        // Send resolution notification
        await sendNotificationsToUsers(emergency.affectedUsers, {
            title: 'Emergency Resolved',
            body: `The emergency at ${emergency.location || 'your site'} has been resolved.`,
            data: {
                type: 'emergency_resolved',
                emergencyId: emergency.id,
                siteId: emergency.siteId,
            },
        });
        // Update site status
        await updateSiteEmergencyStatus(emergency.siteId, false);
        // Log resolution
        await logEmergencyEvent(emergency, 'resolved');
    }
    catch (error) {
        console.error('Error handling emergency resolution:', error);
        throw error;
    }
}
async function onEmergencyCancelled(emergency) {
    try {
        // Send cancellation notification
        await sendNotificationsToUsers(emergency.affectedUsers, {
            title: 'Emergency Cancelled',
            body: `The emergency at ${emergency.location || 'your site'} has been cancelled.`,
            data: {
                type: 'emergency_cancelled',
                emergencyId: emergency.id,
                siteId: emergency.siteId,
            },
        });
        // Update site status
        await updateSiteEmergencyStatus(emergency.siteId, false);
        // Log cancellation
        await logEmergencyEvent(emergency, 'cancelled');
    }
    catch (error) {
        console.error('Error handling emergency cancellation:', error);
        throw error;
    }
}
async function handleEmergencyResolution(emergency) {
    await onEmergencyResolved(emergency);
}
async function updateEmergencySubscriptions(emergency) {
    // Update real-time subscriptions for affected users
    // This would typically involve WebSocket connections
    console.log('Updating emergency subscriptions for users:', emergency.affectedUsers);
}
async function updateSiteEmergencyStatus(siteId, hasEmergency) {
    try {
        await db.collection('sites').doc(siteId).update({
            hasActiveEmergency: hasEmergency,
            lastEmergencyUpdate: new Date(),
        });
    }
    catch (error) {
        console.error('Error updating site emergency status:', error);
    }
}
async function logEmergencyEvent(emergency, action) {
    try {
        await db.collection('emergencyLogs').add({
            emergencyId: emergency.id,
            action,
            timestamp: new Date(),
            userId: emergency.createdBy,
            siteId: emergency.siteId,
            severity: emergency.severity,
            type: emergency.type,
        });
    }
    catch (error) {
        console.error('Error logging emergency event:', error);
    }
}
async function getFCMTokensForUsers(userIds) {
    var _a;
    try {
        const tokens = [];
        for (const userId of userIds) {
            const userDoc = await db.collection('users').doc(userId).get();
            const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
            if (fcmToken) {
                tokens.push(fcmToken);
            }
        }
        return tokens;
    }
    catch (error) {
        console.error('Error getting FCM tokens:', error);
        return [];
    }
}
async function sendNotificationsToUsers(userIds, notification) {
    try {
        const tokens = await getFCMTokensForUsers(userIds);
        if (tokens.length === 0)
            return;
        const message = {
            notification,
            tokens,
        };
        const response = await messaging.sendMulticast(message);
        console.log(`Sent notifications to ${response.successCount}/${tokens.length} users`);
    }
    catch (error) {
        console.error('Error sending notifications to users:', error);
    }
}
async function sendNotificationsToSiteManagers(siteId, notification) {
    try {
        const managers = await db.collection('siteMemberships')
            .where('siteId', '==', siteId)
            .where('role', '==', 'MANAGER')
            .get();
        const managerIds = managers.docs.map(doc => doc.data().userId);
        await sendNotificationsToUsers(managerIds, notification);
    }
    catch (error) {
        console.error('Error sending notifications to site managers:', error);
    }
}
//# sourceMappingURL=emergency.js.map