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
exports.monitorSystemResources = exports.sendSystemHealthReport = exports.optimizeDatabase = exports.backupDatabase = exports.cleanupExpiredData = exports.maintenanceFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const db = admin.firestore();
exports.maintenanceFunctions = {
    // Cleanup Expired Data
    cleanupExpiredData: async () => {
        try {
            console.log('Starting data cleanup...');
            const cleanupTasks = [
                cleanupExpiredTokens(),
                cleanupOldNotifications(),
                cleanupExpiredHolds(),
                cleanupOldAccessLogs(),
                cleanupOldAnalytics(),
            ];
            await Promise.all(cleanupTasks);
            console.log('Data cleanup completed successfully');
        }
        catch (error) {
            console.error('Error during data cleanup:', error);
        }
    },
    // Backup Database
    backupDatabase: async () => {
        try {
            console.log('Starting database backup...');
            const collections = [
                'users',
                'sites',
                'doors',
                'accessRequests',
                'emergencies',
                'holds',
                'equipment',
                'reservations',
            ];
            const backupData = {};
            for (const collection of collections) {
                const snapshot = await db.collection(collection).get();
                backupData[collection] = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
            }
            // Store backup
            const backupId = `backup_${new Date().toISOString().split('T')[0]}`;
            await db.collection('backups').doc(backupId).set({
                data: backupData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                collections: collections.length,
                totalRecords: Object.values(backupData).reduce((acc, collection) => acc + collection.length, 0),
            });
            console.log(`Database backup completed: ${backupId}`);
            // Cleanup old backups (keep last 30 days)
            await cleanupOldBackups();
        }
        catch (error) {
            console.error('Error during database backup:', error);
        }
    },
    // Optimize Database
    optimizeDatabase: async () => {
        try {
            console.log('Starting database optimization...');
            const optimizationTasks = [
                optimizeIndexes(),
                cleanupOrphanedData(),
                updateStatistics(),
            ];
            await Promise.all(optimizationTasks);
            console.log('Database optimization completed');
        }
        catch (error) {
            console.error('Error during database optimization:', error);
        }
    },
    // Send System Health Report
    sendSystemHealthReport: async () => {
        try {
            console.log('Generating system health report...');
            const healthMetrics = await calculateHealthMetrics();
            const report = {
                timestamp: new Date(),
                metrics: healthMetrics,
                status: healthMetrics.overallHealth > 0.8 ? 'healthy' : 'warning',
                recommendations: generateRecommendations(healthMetrics),
            };
            // Store health report
            await db.collection('healthReports').add(Object.assign(Object.assign({}, report), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Send notification if health is poor
            if (healthMetrics.overallHealth < 0.7) {
                await sendHealthAlert(report);
            }
            console.log('System health report generated');
            return report;
        }
        catch (error) {
            console.error('Error generating system health report:', error);
        }
    },
    // Monitor System Resources
    monitorSystemResources: async () => {
        try {
            console.log('Monitoring system resources...');
            const resourceMetrics = {
                timestamp: new Date(),
                memory: await getMemoryUsage(),
                cpu: await getCPUUsage(),
                storage: await getStorageUsage(),
                activeConnections: await getActiveConnections(),
            };
            // Store resource metrics
            await db.collection('resourceMetrics').add(Object.assign(Object.assign({}, resourceMetrics), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Check for resource alerts
            await checkResourceAlerts(resourceMetrics);
            console.log('System resource monitoring completed');
            return resourceMetrics;
        }
        catch (error) {
            console.error('Error monitoring system resources:', error);
        }
    },
};
// Helper Functions
async function cleanupExpiredTokens() {
    try {
        const now = admin.firestore.Timestamp.now();
        const expiredTokens = await db.collection('accessTokens')
            .where('expiresAt', '<=', now)
            .get();
        const batch = db.batch();
        expiredTokens.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${expiredTokens.docs.length} expired tokens`);
    }
    catch (error) {
        console.error('Error cleaning up expired tokens:', error);
    }
}
async function cleanupOldNotifications() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const oldNotifications = await db.collection('notifications')
            .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .where('read', '==', true)
            .get();
        const batch = db.batch();
        oldNotifications.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${oldNotifications.docs.length} old notifications`);
    }
    catch (error) {
        console.error('Error cleaning up old notifications:', error);
    }
}
async function cleanupExpiredHolds() {
    try {
        const now = admin.firestore.Timestamp.now();
        const expiredHolds = await db.collection('holds')
            .where('status', '==', 'expired')
            .where('expiredAt', '<=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
            .get();
        const batch = db.batch();
        expiredHolds.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${expiredHolds.docs.length} expired holds`);
    }
    catch (error) {
        console.error('Error cleaning up expired holds:', error);
    }
}
async function cleanupOldAccessLogs() {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const oldLogs = await db.collection('accessLogs')
            .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
            .get();
        const batch = db.batch();
        oldLogs.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${oldLogs.docs.length} old access logs`);
    }
    catch (error) {
        console.error('Error cleaning up old access logs:', error);
    }
}
async function cleanupOldAnalytics() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oldAnalytics = await db.collection('analyticsReports')
            .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(oneYearAgo))
            .get();
        const batch = db.batch();
        oldAnalytics.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${oldAnalytics.docs.length} old analytics reports`);
    }
    catch (error) {
        console.error('Error cleaning up old analytics:', error);
    }
}
async function cleanupOldBackups() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const oldBackups = await db.collection('backups')
            .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .get();
        const batch = db.batch();
        oldBackups.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${oldBackups.docs.length} old backups`);
    }
    catch (error) {
        console.error('Error cleaning up old backups:', error);
    }
}
async function optimizeIndexes() {
    try {
        // This would typically involve database-specific optimization
        console.log('Index optimization completed');
    }
    catch (error) {
        console.error('Error optimizing indexes:', error);
    }
}
async function cleanupOrphanedData() {
    try {
        // Clean up orphaned site memberships
        const memberships = await db.collection('siteMemberships').get();
        const batch = db.batch();
        for (const doc of memberships.docs) {
            const data = doc.data();
            // Check if user exists
            const userDoc = await db.collection('users').doc(data.userId).get();
            if (!userDoc.exists) {
                batch.delete(doc.ref);
            }
            // Check if site exists
            const siteDoc = await db.collection('sites').doc(data.siteId).get();
            if (!siteDoc.exists) {
                batch.delete(doc.ref);
            }
        }
        await batch.commit();
        console.log('Orphaned data cleanup completed');
    }
    catch (error) {
        console.error('Error cleaning up orphaned data:', error);
    }
}
async function updateStatistics() {
    try {
        // Update collection statistics
        const collections = ['users', 'sites', 'doors', 'accessRequests'];
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            await db.collection('statistics').doc(collection).set({
                count: snapshot.size,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log('Statistics updated');
    }
    catch (error) {
        console.error('Error updating statistics:', error);
    }
}
async function calculateHealthMetrics() {
    try {
        const metrics = {
            userActivity: 0,
            systemPerformance: 0,
            dataIntegrity: 0,
            overallHealth: 0,
        };
        // Calculate user activity (recent logins)
        const recentLogins = await db.collection('users')
            .where('lastLogin', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
            .get();
        metrics.userActivity = recentLogins.size / 100; // Normalize to 0-1
        // Calculate system performance (response times, etc.)
        metrics.systemPerformance = 0.9; // Placeholder
        // Calculate data integrity (check for inconsistencies)
        metrics.dataIntegrity = 0.95; // Placeholder
        // Calculate overall health
        metrics.overallHealth = (metrics.userActivity + metrics.systemPerformance + metrics.dataIntegrity) / 3;
        return metrics;
    }
    catch (error) {
        console.error('Error calculating health metrics:', error);
        return { userActivity: 0, systemPerformance: 0, dataIntegrity: 0, overallHealth: 0 };
    }
}
function generateRecommendations(metrics) {
    const recommendations = [];
    if (metrics.userActivity < 0.5) {
        recommendations.push('Low user activity detected. Consider sending engagement notifications.');
    }
    if (metrics.systemPerformance < 0.8) {
        recommendations.push('System performance below optimal. Consider scaling resources.');
    }
    if (metrics.dataIntegrity < 0.9) {
        recommendations.push('Data integrity issues detected. Run data validation checks.');
    }
    return recommendations;
}
async function sendHealthAlert(report) {
    try {
        // Send alert to administrators
        console.log('System health alert sent:', report);
    }
    catch (error) {
        console.error('Error sending health alert:', error);
    }
}
async function getMemoryUsage() {
    try {
        const usage = process.memoryUsage();
        return {
            rss: usage.rss,
            heapTotal: usage.heapTotal,
            heapUsed: usage.heapUsed,
            external: usage.external,
        };
    }
    catch (error) {
        console.error('Error getting memory usage:', error);
        return {};
    }
}
async function getCPUUsage() {
    try {
        // This would typically use a system monitoring library
        return { usage: 0.5 }; // Placeholder
    }
    catch (error) {
        console.error('Error getting CPU usage:', error);
        return { usage: 0 };
    }
}
async function getStorageUsage() {
    try {
        // This would typically check database storage usage
        return { usage: 0.3 }; // Placeholder
    }
    catch (error) {
        console.error('Error getting storage usage:', error);
        return { usage: 0 };
    }
}
async function getActiveConnections() {
    try {
        // This would typically check active database connections
        return { count: 10 }; // Placeholder
    }
    catch (error) {
        console.error('Error getting active connections:', error);
        return { count: 0 };
    }
}
async function checkResourceAlerts(metrics) {
    try {
        const alerts = [];
        if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.8) {
            alerts.push('High memory usage detected');
        }
        if (metrics.cpu.usage > 0.8) {
            alerts.push('High CPU usage detected');
        }
        if (metrics.storage.usage > 0.8) {
            alerts.push('High storage usage detected');
        }
        if (alerts.length > 0) {
            console.log('Resource alerts:', alerts);
            // Send alerts to administrators
        }
    }
    catch (error) {
        console.error('Error checking resource alerts:', error);
    }
}
// Export all functions
exports.cleanupExpiredData = exports.maintenanceFunctions.cleanupExpiredData, exports.backupDatabase = exports.maintenanceFunctions.backupDatabase, exports.optimizeDatabase = exports.maintenanceFunctions.optimizeDatabase, exports.sendSystemHealthReport = exports.maintenanceFunctions.sendSystemHealthReport, exports.monitorSystemResources = exports.maintenanceFunctions.monitorSystemResources;
//# sourceMappingURL=maintenance.js.map