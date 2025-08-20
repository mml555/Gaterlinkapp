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
exports.markNotificationAsRead = exports.updateNotificationPreferences = exports.batchSendNotifications = exports.sendSMSNotification = exports.sendEmailNotification = exports.sendPushNotification = exports.sendAccessRequestNotification = exports.sendEquipmentNotification = exports.sendHoldNotification = exports.sendEmergencyNotification = exports.notificationFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const db = admin.firestore();
const messaging = admin.messaging();
exports.notificationFunctions = {
    // Send Push Notification
    sendPushNotification: async (target, payload) => {
        var _a, _b;
        try {
            const tokens = await getFCMTokens(target);
            if (tokens.length === 0) {
                console.log('No FCM tokens found for target');
                return;
            }
            const message = {
                tokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.imageUrl,
                },
                data: payload.data,
                android: {
                    priority: (payload.priority === 'high' ? 'high' : 'normal'),
                    notification: {
                        channelId: payload.channelId || 'default',
                        sound: payload.sound || 'default',
                        priority: (payload.priority === 'high' ? 'high' : 'default'),
                        defaultSound: true,
                        defaultVibrateTimings: true,
                        defaultLightSettings: true,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body,
                            },
                            sound: payload.sound || 'default',
                            badge: (_a = payload.badge) === null || _a === void 0 ? void 0 : _a.toString(),
                            category: ((_b = payload.data) === null || _b === void 0 ? void 0 : _b.category) || 'default',
                        },
                        data: payload.data,
                    },
                    headers: {
                        'apns-priority': payload.priority === 'high' ? '10' : '5',
                        'apns-push-type': 'alert',
                    },
                },
                webpush: {
                    notification: {
                        title: payload.title,
                        body: payload.body,
                        icon: '/icon-192x192.png',
                        badge: payload.badge,
                        data: payload.data,
                    },
                    fcmOptions: {
                        link: payload.clickAction || '/',
                    },
                },
            };
            const response = await messaging.sendMulticast(message);
            console.log(`Successfully sent ${response.successCount} notifications`);
            console.log(`Failed to send ${response.failureCount} notifications`);
            // Handle failed tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        console.error('Failed to send notification:', resp.error);
                    }
                });
                // Remove invalid tokens
                await removeInvalidTokens(failedTokens);
            }
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    },
    // Send Email Notification
    sendEmailNotification: async (target, subject, htmlBody, textBody) => {
        try {
            const emails = await getEmails(target);
            if (emails.length === 0) {
                console.log('No email addresses found for target');
                return;
            }
            // This would integrate with your email service (SendGrid, Mailgun, etc.)
            console.log(`Sending email to ${emails.length} recipients`);
            for (const email of emails) {
                // await emailService.send({
                //   to: email,
                //   subject,
                //   html: htmlBody,
                //   text: textBody,
                // });
                console.log(`Email sent to ${email}: ${subject}`);
            }
        }
        catch (error) {
            console.error('Error sending email notification:', error);
            throw error;
        }
    },
    // Send SMS Notification
    sendSMSNotification: async (target, message) => {
        try {
            const phoneNumbers = await getPhoneNumbers(target);
            if (phoneNumbers.length === 0) {
                console.log('No phone numbers found for target');
                return;
            }
            // This would integrate with your SMS service (Twilio, AWS SNS, etc.)
            console.log(`Sending SMS to ${phoneNumbers.length} recipients`);
            for (const phone of phoneNumbers) {
                // await smsService.send({
                //   to: phone,
                //   message,
                // });
                console.log(`SMS sent to ${phone}: ${message}`);
            }
        }
        catch (error) {
            console.error('Error sending SMS notification:', error);
            throw error;
        }
    },
    // Batch Send Notifications
    batchSendNotifications: async (notifications) => {
        try {
            const promises = notifications.map(async (notification) => {
                switch (notification.type) {
                    case 'push':
                        return this.sendPushNotification(notification.target, notification.payload);
                    case 'email':
                        return this.sendEmailNotification(notification.target, notification.payload.title, notification.payload.body);
                    case 'sms':
                        return this.sendSMSNotification(notification.target, notification.payload.body);
                    default:
                        throw new Error(`Unknown notification type: ${notification.type}`);
                }
            });
            await Promise.all(promises);
            console.log(`Successfully sent ${notifications.length} batch notifications`);
        }
        catch (error) {
            console.error('Error in batch send notifications:', error);
            throw error;
        }
    },
    // Update Notification Preferences
    updateNotificationPreferences: async (userId, preferences) => {
        try {
            await db.collection('users').doc(userId).update({
                'notificationSettings': preferences,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Updated notification preferences for user: ${userId}`);
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    },
    // Mark Notification as Read
    markNotificationAsRead: async (userId, notificationId) => {
        try {
            await db.collection('users').doc(userId)
                .collection('notifications').doc(notificationId)
                .update({
                read: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Marked notification ${notificationId} as read for user: ${userId}`);
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },
};
// HTTP Functions for Notification Management
// Send Emergency Notification
exports.sendEmergencyNotification = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { emergency, siteId } = data;
        if (!emergency || !siteId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        const payload = {
            title: `Emergency: ${emergency.type}`,
            body: emergency.description,
            data: {
                type: 'emergency',
                emergencyId: emergency.id,
                siteId: emergency.siteId,
                severity: emergency.severity,
            },
            priority: 'high',
            sound: 'emergency',
            channelId: 'emergency-alerts',
        };
        const target = {
            siteId,
            role: 'site_manager', // Send to site managers
        };
        await exports.notificationFunctions.sendPushNotification(target, payload);
        return { success: true, message: 'Emergency notification sent successfully' };
    }
    catch (error) {
        console.error('Error sending emergency notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send emergency notification');
    }
});
// Send Hold Notification
exports.sendHoldNotification = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { hold, affectedUsers } = data;
        if (!hold) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        const payload = {
            title: 'Area on Hold',
            body: `${hold.areaId} is now on hold: ${hold.reason}`,
            data: {
                type: 'hold',
                holdId: hold.id,
                siteId: hold.siteId,
                areaId: hold.areaId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'hold-notifications',
        };
        const target = {
            userIds: affectedUsers,
        };
        await exports.notificationFunctions.sendPushNotification(target, payload);
        return { success: true, message: 'Hold notification sent successfully' };
    }
    catch (error) {
        console.error('Error sending hold notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send hold notification');
    }
});
// Send Equipment Notification
exports.sendEquipmentNotification = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { equipment, type, siteId } = data;
        if (!equipment || !type || !siteId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        const payload = {
            title: `Equipment Update: ${equipment.name}`,
            body: getEquipmentNotificationBody(equipment, type),
            data: {
                type: 'equipment',
                equipmentId: equipment.id,
                siteId: equipment.siteId,
                notificationType: type,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'equipment-updates',
        };
        const target = {
            siteId,
        };
        await exports.notificationFunctions.sendPushNotification(target, payload);
        return { success: true, message: 'Equipment notification sent successfully' };
    }
    catch (error) {
        console.error('Error sending equipment notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send equipment notification');
    }
});
// Send Access Request Notification
exports.sendAccessRequestNotification = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { request, managers } = data;
        if (!request || !managers) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        const payload = {
            title: 'New Access Request',
            body: `${request.userName} requested access to ${request.doorName}`,
            data: {
                type: 'access_request',
                requestId: request.id,
                siteId: request.siteId,
                doorId: request.doorId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'access-requests',
        };
        const target = {
            userIds: managers,
        };
        await exports.notificationFunctions.sendPushNotification(target, payload);
        return { success: true, message: 'Access request notification sent successfully' };
    }
    catch (error) {
        console.error('Error sending access request notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send access request notification');
    }
});
// Helper Functions
async function getFCMTokens(target) {
    try {
        const tokens = [];
        if (target.fcmTokens) {
            tokens.push(...target.fcmTokens);
        }
        if (target.userIds && target.userIds.length > 0) {
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldValue.arrayUnion(target.userIds))
                .get();
            userDocs.docs.forEach(doc => {
                const fcmToken = doc.data().fcmToken;
                if (fcmToken) {
                    tokens.push(fcmToken);
                }
            });
        }
        if (target.siteId) {
            let query = db.collection('siteMemberships').where('siteId', '==', target.siteId);
            if (target.role) {
                query = query.where('role', '==', target.role);
            }
            const memberships = await query.get();
            const userIds = memberships.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldValue.arrayUnion(userIds))
                    .get();
                userDocs.docs.forEach(doc => {
                    const fcmToken = doc.data().fcmToken;
                    if (fcmToken) {
                        tokens.push(fcmToken);
                    }
                });
            }
        }
        return [...new Set(tokens)]; // Remove duplicates
    }
    catch (error) {
        console.error('Error getting FCM tokens:', error);
        return [];
    }
}
async function getEmails(target) {
    try {
        const emails = [];
        if (target.userIds && target.userIds.length > 0) {
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldValue.arrayUnion(target.userIds))
                .get();
            userDocs.docs.forEach(doc => {
                const email = doc.data().email;
                if (email) {
                    emails.push(email);
                }
            });
        }
        if (target.siteId) {
            let query = db.collection('siteMemberships').where('siteId', '==', target.siteId);
            if (target.role) {
                query = query.where('role', '==', target.role);
            }
            const memberships = await query.get();
            const userIds = memberships.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldValue.arrayUnion(userIds))
                    .get();
                userDocs.docs.forEach(doc => {
                    const email = doc.data().email;
                    if (email) {
                        emails.push(email);
                    }
                });
            }
        }
        return [...new Set(emails)]; // Remove duplicates
    }
    catch (error) {
        console.error('Error getting emails:', error);
        return [];
    }
}
async function getPhoneNumbers(target) {
    try {
        const phones = [];
        if (target.userIds && target.userIds.length > 0) {
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldValue.arrayUnion(target.userIds))
                .get();
            userDocs.docs.forEach(doc => {
                const phone = doc.data().phoneNumber;
                if (phone) {
                    phones.push(phone);
                }
            });
        }
        if (target.siteId) {
            let query = db.collection('siteMemberships').where('siteId', '==', target.siteId);
            if (target.role) {
                query = query.where('role', '==', target.role);
            }
            const memberships = await query.get();
            const userIds = memberships.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldValue.arrayUnion(userIds))
                    .get();
                userDocs.docs.forEach(doc => {
                    const phone = doc.data().phoneNumber;
                    if (phone) {
                        phones.push(phone);
                    }
                });
            }
        }
        return [...new Set(phones)]; // Remove duplicates
    }
    catch (error) {
        console.error('Error getting phone numbers:', error);
        return [];
    }
}
async function removeInvalidTokens(tokens) {
    try {
        const batch = db.batch();
        for (const token of tokens) {
            const userDocs = await db.collection('users')
                .where('fcmToken', '==', token)
                .get();
            userDocs.docs.forEach(doc => {
                batch.update(doc.ref, {
                    fcmToken: null,
                    lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
        }
        await batch.commit();
        console.log(`Removed ${tokens.length} invalid FCM tokens`);
    }
    catch (error) {
        console.error('Error removing invalid tokens:', error);
    }
}
function getEquipmentNotificationBody(equipment, type) {
    switch (type) {
        case 'status':
            return `${equipment.name} status changed to ${equipment.status}`;
        case 'reservation':
            return `New reservation for ${equipment.name}`;
        case 'maintenance':
            return `${equipment.name} requires maintenance`;
        case 'available':
            return `${equipment.name} is now available`;
        default:
            return `Update for ${equipment.name}`;
    }
}
// Export all functions
exports.sendPushNotification = exports.notificationFunctions.sendPushNotification, exports.sendEmailNotification = exports.notificationFunctions.sendEmailNotification, exports.sendSMSNotification = exports.notificationFunctions.sendSMSNotification, exports.batchSendNotifications = exports.notificationFunctions.batchSendNotifications, exports.updateNotificationPreferences = exports.notificationFunctions.updateNotificationPreferences, exports.markNotificationAsRead = exports.notificationFunctions.markNotificationAsRead;
//# sourceMappingURL=notifications.js.map