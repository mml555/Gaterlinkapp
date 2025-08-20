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
exports.extendHold = exports.autoExpireHolds = exports.sendHoldNotifications = exports.onHoldExpired = exports.onHoldUpdated = exports.onHoldCreated = exports.holdFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("./notifications");
// Initialize Firebase Admin
const db = admin.firestore();
exports.holdFunctions = {
    // Hold Creation Trigger
    onHoldCreated: async (holdData) => {
        try {
            console.log('New hold created:', holdData.id);
            // Send notifications to affected users
            await (0, exports.sendHoldNotifications)(holdData);
            // Set up auto-expiration
            await scheduleHoldExpiration(holdData);
        }
        catch (error) {
            console.error('Error in onHoldCreated:', error);
        }
    },
    // Hold Update Trigger
    onHoldUpdated: async (holdData) => {
        try {
            console.log('Hold updated:', holdData.id);
            // Send update notifications if needed
            if (holdData.status === 'extended') {
                await sendHoldExtensionNotification(holdData);
            }
        }
        catch (error) {
            console.error('Error in onHoldUpdated:', error);
        }
    },
    // Hold Expiration Trigger
    onHoldExpired: async (holdData) => {
        try {
            console.log('Hold expired:', holdData.id);
            // Update hold status
            await db.collection('holds').doc(holdData.id).update({
                status: 'expired',
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Send expiration notifications
            await sendHoldExpirationNotification(holdData);
        }
        catch (error) {
            console.error('Error in onHoldExpired:', error);
        }
    },
    // Send Hold Notifications
    sendHoldNotifications: async (holdData) => {
        try {
            const payload = {
                title: 'Area on Hold',
                body: `${holdData.areaId} is now on hold: ${holdData.reason}`,
                data: {
                    type: 'hold',
                    holdId: holdData.id,
                    siteId: holdData.siteId,
                    areaId: holdData.areaId,
                },
                priority: 'normal',
                sound: 'default',
                channelId: 'hold-notifications',
            };
            const target = {
                siteId: holdData.siteId,
            };
            await notifications_1.notificationFunctions.sendPushNotification(target, payload);
        }
        catch (error) {
            console.error('Error sending hold notifications:', error);
        }
    },
    // Auto Expire Holds
    autoExpireHolds: async () => {
        try {
            const now = admin.firestore.Timestamp.now();
            const expiredHolds = await db.collection('holds')
                .where('status', '==', 'active')
                .where('expiresAt', '<=', now)
                .get();
            const batch = db.batch();
            expiredHolds.docs.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'expired',
                    expiredAt: now,
                });
            });
            await batch.commit();
            console.log(`Auto-expired ${expiredHolds.docs.length} holds`);
            // Send expiration notifications
            for (const doc of expiredHolds.docs) {
                await sendHoldExpirationNotification(doc.data());
            }
        }
        catch (error) {
            console.error('Error auto-expiring holds:', error);
        }
    },
    // Extend Hold
    extendHold: async (holdId, extensionMinutes) => {
        try {
            const holdRef = db.collection('holds').doc(holdId);
            const holdDoc = await holdRef.get();
            if (!holdDoc.exists) {
                throw new Error('Hold not found');
            }
            const holdData = holdDoc.data();
            const newExpiresAt = new Date(holdData.expiresAt.toDate().getTime() + (extensionMinutes * 60 * 1000));
            await holdRef.update({
                expiresAt: admin.firestore.Timestamp.fromDate(newExpiresAt),
                status: 'extended',
                extendedAt: admin.firestore.FieldValue.serverTimestamp(),
                extensionMinutes: (holdData.extensionMinutes || 0) + extensionMinutes,
            });
            // Send extension notification
            await sendHoldExtensionNotification(Object.assign(Object.assign({}, holdData), { expiresAt: admin.firestore.Timestamp.fromDate(newExpiresAt), extensionMinutes }));
            return { success: true, newExpiresAt };
        }
        catch (error) {
            console.error('Error extending hold:', error);
            throw error;
        }
    },
};
// Helper Functions
async function sendHoldExtensionNotification(holdData) {
    try {
        const payload = {
            title: 'Hold Extended',
            body: `Hold for ${holdData.areaId} has been extended by ${holdData.extensionMinutes} minutes`,
            data: {
                type: 'hold_extension',
                holdId: holdData.id,
                siteId: holdData.siteId,
                areaId: holdData.areaId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'hold-notifications',
        };
        const target = {
            siteId: holdData.siteId,
        };
        await notifications_1.notificationFunctions.sendPushNotification(target, payload);
    }
    catch (error) {
        console.error('Error sending hold extension notification:', error);
    }
}
async function sendHoldExpirationNotification(holdData) {
    try {
        const payload = {
            title: 'Hold Expired',
            body: `Hold for ${holdData.areaId} has expired`,
            data: {
                type: 'hold_expired',
                holdId: holdData.id,
                siteId: holdData.siteId,
                areaId: holdData.areaId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'hold-notifications',
        };
        const target = {
            siteId: holdData.siteId,
        };
        await notifications_1.notificationFunctions.sendPushNotification(target, payload);
    }
    catch (error) {
        console.error('Error sending hold expiration notification:', error);
    }
}
async function scheduleHoldExpiration(holdData) {
    try {
        // This would typically use a task queue or scheduled function
        // For now, we'll just log the expiration time
        console.log(`Hold ${holdData.id} will expire at ${holdData.expiresAt}`);
    }
    catch (error) {
        console.error('Error scheduling hold expiration:', error);
    }
}
// Export all functions
exports.onHoldCreated = exports.holdFunctions.onHoldCreated, exports.onHoldUpdated = exports.holdFunctions.onHoldUpdated, exports.onHoldExpired = exports.holdFunctions.onHoldExpired, exports.sendHoldNotifications = exports.holdFunctions.sendHoldNotifications, exports.autoExpireHolds = exports.holdFunctions.autoExpireHolds, exports.extendHold = exports.holdFunctions.extendHold;
//# sourceMappingURL=holds.js.map