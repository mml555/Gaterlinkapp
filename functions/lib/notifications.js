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
exports.markNotificationAsRead = exports.updateNotificationPreferences = exports.batchSendNotifications = exports.sendSMSNotification = exports.sendEmailNotification = exports.sendPushNotification = exports.notificationFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const messaging = admin.messaging();
const db = admin.firestore();
// Define UserRole enum for Cloud Functions
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["SITE_MANAGER"] = "site_manager";
    UserRole["EMERGENCY_RESPONDER"] = "emergency_responder";
    UserRole["EQUIPMENT_MANAGER"] = "equipment_manager";
})(UserRole || (UserRole = {}));
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
                            badge: payload.badge,
                            category: ((_a = payload.data) === null || _a === void 0 ? void 0 : _a.category) || 'default',
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
                        badge: (_b = payload.badge) === null || _b === void 0 ? void 0 : _b.toString(),
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
                console.log(`Email would be sent to: ${email}`);
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
            // This would integrate with your SMS service (Twilio, etc.)
            console.log(`Sending SMS to ${phoneNumbers.length} recipients`);
            for (const phone of phoneNumbers) {
                // await smsService.send({
                //   to: phone,
                //   message,
                // });
                console.log(`SMS would be sent to: ${phone}`);
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
            const promises = notifications.map(notification => {
                switch (notification.type) {
                    case 'push':
                        return exports.notificationFunctions.sendPushNotification(notification.target, notification.payload);
                    case 'email':
                        return exports.notificationFunctions.sendEmailNotification(notification.target, notification.payload.title, notification.payload.body);
                    case 'sms':
                        return exports.notificationFunctions.sendSMSNotification(notification.target, notification.payload.body);
                    default:
                        throw new Error(`Unknown notification type: ${notification.type}`);
                }
            });
            await Promise.all(promises);
            console.log(`Successfully sent ${notifications.length} notifications`);
        }
        catch (error) {
            console.error('Error in batch send notifications:', error);
            throw error;
        }
    },
    // Update Notification Preferences
    updateNotificationPreferences: functions.https.onCall(async (data, context) => {
        try {
            if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
            }
            const userId = context.auth.uid;
            const { preferences } = data;
            await db.collection('users').doc(userId).update({
                'notificationSettings': preferences,
                'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, message: 'Notification preferences updated' };
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            throw new functions.https.HttpsError('internal', 'Failed to update preferences');
        }
    }),
    // Mark Notification as Read
    markNotificationAsRead: functions.https.onCall(async (data, context) => {
        try {
            if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
            }
            const { notificationId } = data;
            await db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, message: 'Notification marked as read' };
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw new functions.https.HttpsError('internal', 'Failed to mark notification as read');
        }
    }),
};
// Helper function to get FCM tokens for a target
async function getFCMTokens(target) {
    var _a;
    const tokens = [];
    try {
        if (target.userId) {
            // Get token for specific user
            const userDoc = await db.collection('users').doc(target.userId).get();
            if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken)) {
                tokens.push(userDoc.data().fcmToken);
            }
        }
        else if (target.userIds && target.userIds.length > 0) {
            // Get tokens for multiple users
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldPath.documentId(), 'in', target.userIds)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken) {
                    tokens.push(doc.data().fcmToken);
                }
            });
        }
        else if (target.siteId) {
            // Get tokens for site members
            const siteMembers = await db.collection('siteMemberships')
                .where('siteId', '==', target.siteId)
                .get();
            const userIds = siteMembers.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldPath.documentId(), 'in', userIds)
                    .get();
                userDocs.docs.forEach(doc => {
                    var _a;
                    if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken) {
                        tokens.push(doc.data().fcmToken);
                    }
                });
            }
        }
        else if (target.role) {
            // Get tokens for users with specific role
            const userDocs = await db.collection('users')
                .where('role', '==', target.role)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken) {
                    tokens.push(doc.data().fcmToken);
                }
            });
        }
        return tokens;
    }
    catch (error) {
        console.error('Error getting FCM tokens:', error);
        return [];
    }
}
// Helper function to get email addresses for a target
async function getEmails(target) {
    var _a;
    const emails = [];
    try {
        if (target.userId) {
            const userDoc = await db.collection('users').doc(target.userId).get();
            if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.email)) {
                emails.push(userDoc.data().email);
            }
        }
        else if (target.userIds && target.userIds.length > 0) {
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldPath.documentId(), 'in', target.userIds)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.email) {
                    emails.push(doc.data().email);
                }
            });
        }
        else if (target.siteId) {
            const siteMembers = await db.collection('siteMemberships')
                .where('siteId', '==', target.siteId)
                .get();
            const userIds = siteMembers.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldPath.documentId(), 'in', userIds)
                    .get();
                userDocs.docs.forEach(doc => {
                    var _a;
                    if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.email) {
                        emails.push(doc.data().email);
                    }
                });
            }
        }
        else if (target.role) {
            const userDocs = await db.collection('users')
                .where('role', '==', target.role)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.email) {
                    emails.push(doc.data().email);
                }
            });
        }
        return emails;
    }
    catch (error) {
        console.error('Error getting email addresses:', error);
        return [];
    }
}
// Helper function to get phone numbers for a target
async function getPhoneNumbers(target) {
    var _a;
    const phoneNumbers = [];
    try {
        if (target.userId) {
            const userDoc = await db.collection('users').doc(target.userId).get();
            if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.phone)) {
                phoneNumbers.push(userDoc.data().phone);
            }
        }
        else if (target.userIds && target.userIds.length > 0) {
            const userDocs = await db.collection('users')
                .where(admin.firestore.FieldPath.documentId(), 'in', target.userIds)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.phone) {
                    phoneNumbers.push(doc.data().phone);
                }
            });
        }
        else if (target.siteId) {
            const siteMembers = await db.collection('siteMemberships')
                .where('siteId', '==', target.siteId)
                .get();
            const userIds = siteMembers.docs.map(doc => doc.data().userId);
            if (userIds.length > 0) {
                const userDocs = await db.collection('users')
                    .where(admin.firestore.FieldPath.documentId(), 'in', userIds)
                    .get();
                userDocs.docs.forEach(doc => {
                    var _a;
                    if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.phone) {
                        phoneNumbers.push(doc.data().phone);
                    }
                });
            }
        }
        else if (target.role) {
            const userDocs = await db.collection('users')
                .where('role', '==', target.role)
                .get();
            userDocs.docs.forEach(doc => {
                var _a;
                if ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.phone) {
                    phoneNumbers.push(doc.data().phone);
                }
            });
        }
        return phoneNumbers;
    }
    catch (error) {
        console.error('Error getting phone numbers:', error);
        return [];
    }
}
// Helper function to remove invalid FCM tokens
async function removeInvalidTokens(tokens) {
    try {
        const batch = db.batch();
        for (const token of tokens) {
            const userDocs = await db.collection('users')
                .where('fcmToken', '==', token)
                .get();
            userDocs.docs.forEach(doc => {
                batch.update(doc.ref, { fcmToken: null });
            });
        }
        await batch.commit();
        console.log(`Removed ${tokens.length} invalid FCM tokens`);
    }
    catch (error) {
        console.error('Error removing invalid tokens:', error);
    }
}
// Export all functions
exports.sendPushNotification = exports.notificationFunctions.sendPushNotification, exports.sendEmailNotification = exports.notificationFunctions.sendEmailNotification, exports.sendSMSNotification = exports.notificationFunctions.sendSMSNotification, exports.batchSendNotifications = exports.notificationFunctions.batchSendNotifications, exports.updateNotificationPreferences = exports.notificationFunctions.updateNotificationPreferences, exports.markNotificationAsRead = exports.notificationFunctions.markNotificationAsRead;
//# sourceMappingURL=notifications.js.map