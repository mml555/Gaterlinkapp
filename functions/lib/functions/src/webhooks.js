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
exports.validateWebhookSignature = exports.processIntegrationWebhook = exports.processPaymentWebhook = exports.handleWebhook = exports.webhookFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
// Initialize Firebase Admin
const db = admin.firestore();
exports.webhookFunctions = {
    // Handle Webhook
    handleWebhook: async (webhookData, signature) => {
        try {
            // Validate webhook signature
            if (!(0, exports.validateWebhookSignature)(webhookData, signature)) {
                throw new Error('Invalid webhook signature');
            }
            // Process webhook based on type
            const { type, data } = webhookData;
            switch (type) {
                case 'payment':
                    return await (0, exports.processPaymentWebhook)(data);
                case 'integration':
                    return await (0, exports.processIntegrationWebhook)(data);
                case 'emergency':
                    return await processEmergencyWebhook(data);
                case 'access':
                    return await processAccessWebhook(data);
                default:
                    throw new Error(`Unknown webhook type: ${type}`);
            }
        }
        catch (error) {
            console.error('Error handling webhook:', error);
            throw error;
        }
    },
    // Process Payment Webhook
    processPaymentWebhook: async (paymentData) => {
        try {
            console.log('Processing payment webhook:', paymentData);
            const { paymentId, status, amount, userId, siteId } = paymentData;
            // Update payment record
            await db.collection('payments').doc(paymentId).update({
                status,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                webhookReceived: true,
            });
            // Handle payment status
            if (status === 'completed') {
                // Activate user subscription
                await activateUserSubscription(userId, siteId, amount);
            }
            else if (status === 'failed') {
                // Handle failed payment
                await handleFailedPayment(userId, paymentId);
            }
            return { success: true, message: 'Payment webhook processed' };
        }
        catch (error) {
            console.error('Error processing payment webhook:', error);
            throw error;
        }
    },
    // Process Integration Webhook
    processIntegrationWebhook: async (integrationData) => {
        try {
            console.log('Processing integration webhook:', integrationData);
            const { integrationId, type, data } = integrationData;
            // Update integration status
            await db.collection('integrations').doc(integrationId).update({
                lastSync: admin.firestore.FieldValue.serverTimestamp(),
                status: 'active',
            });
            // Process integration data based on type
            switch (type) {
                case 'user_sync':
                    await syncUserData(data);
                    break;
                case 'access_sync':
                    await syncAccessData(data);
                    break;
                case 'equipment_sync':
                    await syncEquipmentData(data);
                    break;
                default:
                    console.log(`Unknown integration type: ${type}`);
            }
            return { success: true, message: 'Integration webhook processed' };
        }
        catch (error) {
            console.error('Error processing integration webhook:', error);
            throw error;
        }
    },
    // Validate Webhook Signature
    validateWebhookSignature: (payload, signature) => {
        try {
            if (!signature) {
                console.warn('No webhook signature provided');
                return false;
            }
            // Get webhook secret from environment or database
            const webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
            // Create expected signature
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            // Compare signatures
            const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
            if (!isValid) {
                console.warn('Invalid webhook signature');
            }
            return isValid;
        }
        catch (error) {
            console.error('Error validating webhook signature:', error);
            return false;
        }
    },
};
// Helper Functions
async function activateUserSubscription(userId, siteId, amount) {
    try {
        // Update user subscription status
        await db.collection('users').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionAmount: amount,
            subscriptionActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update site membership
        await db.collection('siteMemberships').doc(`${userId}_${siteId}`).update({
            status: 'active',
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`User subscription activated: ${userId}`);
    }
    catch (error) {
        console.error('Error activating user subscription:', error);
    }
}
async function handleFailedPayment(userId, paymentId) {
    try {
        // Update user subscription status
        await db.collection('users').doc(userId).update({
            subscriptionStatus: 'failed',
            lastPaymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send notification to user
        await sendPaymentFailedNotification(userId, paymentId);
        console.log(`Failed payment handled: ${paymentId}`);
    }
    catch (error) {
        console.error('Error handling failed payment:', error);
    }
}
async function syncUserData(userData) {
    try {
        const { userId, data } = userData;
        // Update user profile
        await db.collection('users').doc(userId).update(Object.assign(Object.assign({}, data), { lastSync: admin.firestore.FieldValue.serverTimestamp() }));
        console.log(`User data synced: ${userId}`);
    }
    catch (error) {
        console.error('Error syncing user data:', error);
    }
}
async function syncAccessData(accessData) {
    try {
        const { siteId, accessList } = accessData;
        // Update access permissions
        const batch = db.batch();
        accessList.forEach((access) => {
            const accessRef = db.collection('accessPermissions').doc(`${access.userId}_${access.doorId}`);
            batch.set(accessRef, Object.assign(Object.assign({}, access), { siteId, lastSync: admin.firestore.FieldValue.serverTimestamp() }));
        });
        await batch.commit();
        console.log(`Access data synced for site: ${siteId}`);
    }
    catch (error) {
        console.error('Error syncing access data:', error);
    }
}
async function syncEquipmentData(equipmentData) {
    try {
        const { siteId, equipmentList } = equipmentData;
        // Update equipment data
        const batch = db.batch();
        equipmentList.forEach((equipment) => {
            const equipmentRef = db.collection('equipment').doc(equipment.id);
            batch.set(equipmentRef, Object.assign(Object.assign({}, equipment), { siteId, lastSync: admin.firestore.FieldValue.serverTimestamp() }));
        });
        await batch.commit();
        console.log(`Equipment data synced for site: ${siteId}`);
    }
    catch (error) {
        console.error('Error syncing equipment data:', error);
    }
}
async function sendPaymentFailedNotification(userId, paymentId) {
    try {
        // This would integrate with your notification service
        console.log(`Payment failed notification sent to user: ${userId}`);
    }
    catch (error) {
        console.error('Error sending payment failed notification:', error);
    }
}
async function processEmergencyWebhook(emergencyData) {
    try {
        console.log('Processing emergency webhook:', emergencyData);
        // Handle emergency alerts from external systems
        const { emergencyId, type, severity, location, description } = emergencyData;
        // Create emergency record
        await db.collection('emergencies').doc(emergencyId).set({
            id: emergencyId,
            type,
            severity,
            location,
            description,
            source: 'webhook',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send emergency notifications
        // This would trigger the emergency notification system
        return { success: true, message: 'Emergency webhook processed' };
    }
    catch (error) {
        console.error('Error processing emergency webhook:', error);
        throw error;
    }
}
async function processAccessWebhook(accessData) {
    try {
        console.log('Processing access webhook:', accessData);
        // Handle access events from external systems
        const { userId, doorId, action, timestamp } = accessData;
        // Log access event
        await db.collection('accessLogs').add({
            userId,
            doorId,
            action,
            timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
            source: 'webhook',
        });
        return { success: true, message: 'Access webhook processed' };
    }
    catch (error) {
        console.error('Error processing access webhook:', error);
        throw error;
    }
}
// Export all functions
exports.handleWebhook = exports.webhookFunctions.handleWebhook, exports.processPaymentWebhook = exports.webhookFunctions.processPaymentWebhook, exports.processIntegrationWebhook = exports.webhookFunctions.processIntegrationWebhook, exports.validateWebhookSignature = exports.webhookFunctions.validateWebhookSignature;
//# sourceMappingURL=webhooks.js.map