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
exports.config = exports.scheduledCleanup = exports.api = exports.autoResolveEmergencies = exports.sendEmergencyNotifications = exports.broadcastEmergency = exports.onEmergencyResolved = exports.onEmergencyUpdated = exports.onEmergencyCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Import function modules
const emergency_1 = require("./emergency");
// Export emergency functions
exports.onEmergencyCreated = emergency_1.emergencyFunctions.onEmergencyCreated, exports.onEmergencyUpdated = emergency_1.emergencyFunctions.onEmergencyUpdated, exports.onEmergencyResolved = emergency_1.emergencyFunctions.onEmergencyResolved, exports.broadcastEmergency = emergency_1.emergencyFunctions.broadcastEmergency, exports.sendEmergencyNotifications = emergency_1.emergencyFunctions.sendEmergencyNotifications, exports.autoResolveEmergencies = emergency_1.emergencyFunctions.autoResolveEmergencies;
// HTTP Functions
exports.api = functions.https.onRequest(async (req, res) => {
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
                res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
                break;
            case '/emergency/broadcast':
                if (method === 'POST') {
                    // Handle emergency broadcast
                    const { emergencyId } = req.body;
                    // Implementation would go here
                    res.status(200).json({ message: 'Emergency broadcast sent', emergencyId });
                }
                else {
                    res.status(405).json({ error: 'Method not allowed' });
                }
                break;
            case '/notifications/send':
                if (method === 'POST') {
                    // Handle notification sending
                    const { userId, type } = req.body;
                    // Implementation would go here
                    res.status(200).json({ message: 'Notification sent', userId, type });
                }
                else {
                    res.status(405).json({ error: 'Method not allowed' });
                }
                break;
            default:
                res.status(404).json({ error: 'Endpoint not found' });
        }
    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Scheduled Functions
exports.scheduledCleanup = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    try {
        console.log('Running scheduled cleanup...');
        // Clean up expired data
        await cleanupExpiredData();
        // Send system health report
        await sendSystemHealthReport();
        console.log('Scheduled cleanup completed successfully');
    }
    catch (error) {
        console.error('Scheduled cleanup failed:', error);
    }
});
// Helper functions
async function cleanupExpiredData() {
    const db = admin.firestore();
    // Clean up expired holds
    const holdsRef = db.collection('holds');
    const expiredHolds = await holdsRef
        .where('expiresAt', '<', new Date())
        .where('status', '==', 'active')
        .get();
    const batch = db.batch();
    expiredHolds.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired', updatedAt: new Date() });
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
}
async function sendSystemHealthReport() {
    const db = admin.firestore();
    // Get system statistics
    const stats = {
        timestamp: new Date().toISOString(),
        totalUsers: 0,
        totalSites: 0,
        activeEmergencies: 0,
        pendingRequests: 0,
    };
    try {
        // Count users
        const usersSnapshot = await db.collection('users').count().get();
        stats.totalUsers = usersSnapshot.data().count;
        // Count sites
        const sitesSnapshot = await db.collection('sites').count().get();
        stats.totalSites = sitesSnapshot.data().count;
        // Count active emergencies
        const emergenciesSnapshot = await db.collection('emergencies')
            .where('status', '==', 'active')
            .count()
            .get();
        stats.activeEmergencies = emergenciesSnapshot.data().count;
        // Count pending requests
        const requestsSnapshot = await db.collection('accessRequests')
            .where('status', '==', 'pending')
            .count()
            .get();
        stats.pendingRequests = requestsSnapshot.data().count;
        // Store health report
        await db.collection('systemHealth').add(stats);
        console.log('System health report generated:', stats);
    }
    catch (error) {
        console.error('Error generating system health report:', error);
    }
}
// Export configuration
exports.config = {
    region: 'us-central1',
    runtime: 'nodejs18',
    memory: '256MB',
    timeoutSeconds: 540,
};
//# sourceMappingURL=index.js.map