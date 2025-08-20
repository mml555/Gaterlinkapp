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
exports.generateAccessToken = exports.validateAccessToken = exports.logAccessEvent = exports.onAccessDenied = exports.onAccessGranted = exports.onAccessRequestUpdated = exports.onAccessRequestCreated = exports.accessFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("./notifications");
// Initialize Firebase Admin
const db = admin.firestore();
exports.accessFunctions = {
    // Access Request Creation Trigger
    onAccessRequestCreated: async (requestData) => {
        try {
            console.log('New access request created:', requestData.id);
            // Send notifications to site managers
            await sendAccessRequestNotifications(requestData);
        }
        catch (error) {
            console.error('Error in onAccessRequestCreated:', error);
        }
    },
    // Access Request Update Trigger
    onAccessRequestUpdated: async (requestData) => {
        try {
            console.log('Access request updated:', requestData.id);
            // Handle status changes
            if (requestData.status === 'approved') {
                await (0, exports.onAccessGranted)(requestData);
            }
            else if (requestData.status === 'denied') {
                await (0, exports.onAccessDenied)(requestData);
            }
        }
        catch (error) {
            console.error('Error in onAccessRequestUpdated:', error);
        }
    },
    // Access Granted Trigger
    onAccessGranted: async (requestData) => {
        try {
            console.log('Access granted:', requestData.id);
            // Generate access token
            const accessToken = await (0, exports.generateAccessToken)(requestData);
            // Log access event
            await (0, exports.logAccessEvent)(requestData, 'granted', accessToken);
            // Send approval notification
            await sendAccessApprovalNotification(requestData);
        }
        catch (error) {
            console.error('Error in onAccessGranted:', error);
        }
    },
    // Access Denied Trigger
    onAccessDenied: async (requestData) => {
        try {
            console.log('Access denied:', requestData.id);
            // Log access event
            await (0, exports.logAccessEvent)(requestData, 'denied');
            // Send denial notification
            await sendAccessDenialNotification(requestData);
        }
        catch (error) {
            console.error('Error in onAccessDenied:', error);
        }
    },
    // Log Access Event
    logAccessEvent: async (requestData, action, token) => {
        try {
            await db.collection('accessLogs').add({
                requestId: requestData.id,
                userId: requestData.userId,
                doorId: requestData.doorId,
                siteId: requestData.siteId,
                action,
                token,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    userAgent: requestData.userAgent,
                    ipAddress: requestData.ipAddress,
                    location: requestData.location,
                },
            });
            console.log(`Access event logged: ${action} for request ${requestData.id}`);
        }
        catch (error) {
            console.error('Error logging access event:', error);
        }
    },
    // Validate Access Token
    validateAccessToken: async (token) => {
        try {
            const tokenDoc = await db.collection('accessTokens').doc(token).get();
            if (!tokenDoc.exists) {
                return { valid: false, reason: 'Token not found' };
            }
            const tokenData = tokenDoc.data();
            // Check if token is expired
            if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
                return { valid: false, reason: 'Token expired' };
            }
            // Check if token is revoked
            if (tokenData.revoked) {
                return { valid: false, reason: 'Token revoked' };
            }
            return {
                valid: true,
                userId: tokenData.userId,
                doorId: tokenData.doorId,
                siteId: tokenData.siteId,
                permissions: tokenData.permissions,
            };
        }
        catch (error) {
            console.error('Error validating access token:', error);
            return { valid: false, reason: 'Validation error' };
        }
    },
    // Generate Access Token
    generateAccessToken: async (requestData) => {
        try {
            const token = generateSecureToken();
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
            await db.collection('accessTokens').doc(token).set({
                requestId: requestData.id,
                userId: requestData.userId,
                doorId: requestData.doorId,
                siteId: requestData.siteId,
                permissions: requestData.permissions || ['read'],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                revoked: false,
            });
            console.log(`Access token generated: ${token}`);
            return token;
        }
        catch (error) {
            console.error('Error generating access token:', error);
            throw error;
        }
    },
};
// Helper Functions
async function sendAccessRequestNotifications(requestData) {
    try {
        // Get site managers
        const managers = await getSiteManagers(requestData.siteId);
        if (managers.length === 0) {
            console.log('No managers found for site:', requestData.siteId);
            return;
        }
        const payload = {
            title: 'New Access Request',
            body: `${requestData.userName} requested access to ${requestData.doorName}`,
            data: {
                type: 'access_request',
                requestId: requestData.id,
                siteId: requestData.siteId,
                doorId: requestData.doorId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'access-requests',
        };
        const target = {
            userIds: managers,
        };
        await notifications_1.notificationFunctions.sendPushNotification(target, payload);
    }
    catch (error) {
        console.error('Error sending access request notifications:', error);
    }
}
async function sendAccessApprovalNotification(requestData) {
    try {
        const payload = {
            title: 'Access Request Approved',
            body: `Your access request for ${requestData.doorName} has been approved`,
            data: {
                type: 'access_approved',
                requestId: requestData.id,
                siteId: requestData.siteId,
                doorId: requestData.doorId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'access-requests',
        };
        const target = {
            userIds: [requestData.userId],
        };
        await notifications_1.notificationFunctions.sendPushNotification(target, payload);
    }
    catch (error) {
        console.error('Error sending access approval notification:', error);
    }
}
async function sendAccessDenialNotification(requestData) {
    try {
        const payload = {
            title: 'Access Request Denied',
            body: `Your access request for ${requestData.doorName} has been denied`,
            data: {
                type: 'access_denied',
                requestId: requestData.id,
                siteId: requestData.siteId,
                doorId: requestData.doorId,
            },
            priority: 'normal',
            sound: 'default',
            channelId: 'access-requests',
        };
        const target = {
            userIds: [requestData.userId],
        };
        await notifications_1.notificationFunctions.sendPushNotification(target, payload);
    }
    catch (error) {
        console.error('Error sending access denial notification:', error);
    }
}
async function getSiteManagers(siteId) {
    try {
        const memberships = await db.collection('siteMemberships')
            .where('siteId', '==', siteId)
            .where('role', '==', 'MANAGER')
            .get();
        return memberships.docs.map(doc => doc.data().userId);
    }
    catch (error) {
        console.error('Error getting site managers:', error);
        return [];
    }
}
function generateSecureToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// Export all functions
exports.onAccessRequestCreated = exports.accessFunctions.onAccessRequestCreated, exports.onAccessRequestUpdated = exports.accessFunctions.onAccessRequestUpdated, exports.onAccessGranted = exports.accessFunctions.onAccessGranted, exports.onAccessDenied = exports.accessFunctions.onAccessDenied, exports.logAccessEvent = exports.accessFunctions.logAccessEvent, exports.validateAccessToken = exports.accessFunctions.validateAccessToken, exports.generateAccessToken = exports.accessFunctions.generateAccessToken;
//# sourceMappingURL=access.js.map