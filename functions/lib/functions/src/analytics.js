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
exports.exportData = exports.trackUserActivity = exports.generateMonthlyReport = exports.updateSiteStats = exports.generateAnalyticsReport = exports.analyticsFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const db = admin.firestore();
exports.analyticsFunctions = {
    // Generate Analytics Report
    generateAnalyticsReport: async (siteId, dateRange) => {
        try {
            console.log('Generating analytics report...');
            const report = {
                timestamp: new Date(),
                siteId,
                dateRange,
                metrics: await calculateMetrics(siteId, dateRange),
                trends: await calculateTrends(siteId, dateRange),
                topUsers: await getTopUsers(siteId, dateRange),
                topDoors: await getTopDoors(siteId, dateRange),
            };
            // Store report
            await db.collection('analyticsReports').add(Object.assign(Object.assign({}, report), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            console.log('Analytics report generated successfully');
            return report;
        }
        catch (error) {
            console.error('Error generating analytics report:', error);
            throw error;
        }
    },
    // Update Site Stats
    updateSiteStats: async (siteId) => {
        try {
            const stats = await calculateSiteStats(siteId);
            await db.collection('siteStats').doc(siteId).set(Object.assign(Object.assign({}, stats), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
            console.log(`Site stats updated for: ${siteId}`);
        }
        catch (error) {
            console.error('Error updating site stats:', error);
        }
    },
    // Generate Monthly Report
    generateMonthlyReport: async (month, year) => {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            const report = await (0, exports.generateAnalyticsReport)(undefined, { start: startDate, end: endDate });
            // Store monthly report
            await db.collection('monthlyReports').doc(`${year}-${month.toString().padStart(2, '0')}`).set(Object.assign(Object.assign({}, report), { month,
                year, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            console.log(`Monthly report generated for ${month}/${year}`);
            return report;
        }
        catch (error) {
            console.error('Error generating monthly report:', error);
            throw error;
        }
    },
    // Track User Activity
    trackUserActivity: async (userId, activity, metadata) => {
        try {
            await db.collection('userActivity').add({
                userId,
                activity,
                metadata,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`User activity tracked: ${activity} for user ${userId}`);
        }
        catch (error) {
            console.error('Error tracking user activity:', error);
        }
    },
    // Export Data
    exportData: async (collection, filters) => {
        try {
            let query = db.collection(collection);
            // Apply filters
            if (filters) {
                Object.keys(filters).forEach(key => {
                    query = query.where(key, '==', filters[key]);
                });
            }
            const snapshot = await query.get();
            const data = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
            console.log(`Data exported from ${collection}: ${data.length} records`);
            return data;
        }
        catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    },
};
// Helper Functions
async function calculateMetrics(siteId, dateRange) {
    try {
        const metrics = {
            totalUsers: 0,
            activeUsers: 0,
            totalAccessRequests: 0,
            approvedRequests: 0,
            deniedRequests: 0,
            totalEmergencies: 0,
            resolvedEmergencies: 0,
            totalHolds: 0,
            activeHolds: 0,
            equipmentReservations: 0,
        };
        // Calculate user metrics
        let userQuery = db.collection('users');
        if (siteId) {
            userQuery = userQuery.where('siteId', '==', siteId);
        }
        const userSnapshot = await userQuery.get();
        metrics.totalUsers = userSnapshot.size;
        metrics.activeUsers = userSnapshot.docs.filter(doc => doc.data().isActive).length;
        // Calculate access request metrics
        let requestQuery = db.collection('accessRequests');
        if (siteId) {
            requestQuery = requestQuery.where('siteId', '==', siteId);
        }
        if (dateRange) {
            requestQuery = requestQuery.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            requestQuery = requestQuery.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const requestSnapshot = await requestQuery.get();
        metrics.totalAccessRequests = requestSnapshot.size;
        metrics.approvedRequests = requestSnapshot.docs.filter(doc => doc.data().status === 'approved').length;
        metrics.deniedRequests = requestSnapshot.docs.filter(doc => doc.data().status === 'denied').length;
        // Calculate emergency metrics
        let emergencyQuery = db.collection('emergencies');
        if (siteId) {
            emergencyQuery = emergencyQuery.where('siteId', '==', siteId);
        }
        if (dateRange) {
            emergencyQuery = emergencyQuery.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            emergencyQuery = emergencyQuery.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const emergencySnapshot = await emergencyQuery.get();
        metrics.totalEmergencies = emergencySnapshot.size;
        metrics.resolvedEmergencies = emergencySnapshot.docs.filter(doc => doc.data().status === 'resolved').length;
        // Calculate hold metrics
        let holdQuery = db.collection('holds');
        if (siteId) {
            holdQuery = holdQuery.where('siteId', '==', siteId);
        }
        if (dateRange) {
            holdQuery = holdQuery.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            holdQuery = holdQuery.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const holdSnapshot = await holdQuery.get();
        metrics.totalHolds = holdSnapshot.size;
        metrics.activeHolds = holdSnapshot.docs.filter(doc => doc.data().status === 'active').length;
        // Calculate equipment metrics
        let equipmentQuery = db.collection('reservations');
        if (siteId) {
            equipmentQuery = equipmentQuery.where('siteId', '==', siteId);
        }
        if (dateRange) {
            equipmentQuery = equipmentQuery.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            equipmentQuery = equipmentQuery.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const equipmentSnapshot = await equipmentQuery.get();
        metrics.equipmentReservations = equipmentSnapshot.size;
        return metrics;
    }
    catch (error) {
        console.error('Error calculating metrics:', error);
        return {};
    }
}
async function calculateTrends(siteId, dateRange) {
    try {
        const trends = {
            accessRequests: [],
            emergencies: [],
            holds: [],
            userActivity: [],
        };
        // Calculate daily trends for access requests
        if (dateRange) {
            const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
            for (let i = 0; i < days; i++) {
                const date = new Date(dateRange.start.getTime() + (i * 24 * 60 * 60 * 1000));
                const nextDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));
                let query = db.collection('accessRequests')
                    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(date))
                    .where('createdAt', '<', admin.firestore.Timestamp.fromDate(nextDate));
                if (siteId) {
                    query = query.where('siteId', '==', siteId);
                }
                const snapshot = await query.get();
                trends.accessRequests.push({
                    date: date.toISOString().split('T')[0],
                    count: snapshot.size,
                });
            }
        }
        return trends;
    }
    catch (error) {
        console.error('Error calculating trends:', error);
        return {};
    }
}
async function getTopUsers(siteId, dateRange) {
    try {
        let query = db.collection('accessRequests');
        if (siteId) {
            query = query.where('siteId', '==', siteId);
        }
        if (dateRange) {
            query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const snapshot = await query.get();
        const userCounts = {};
        snapshot.docs.forEach(doc => {
            const userId = doc.data().userId;
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        });
        const topUsers = Object.entries(userCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, count }));
        return topUsers;
    }
    catch (error) {
        console.error('Error getting top users:', error);
        return [];
    }
}
async function getTopDoors(siteId, dateRange) {
    try {
        let query = db.collection('accessRequests');
        if (siteId) {
            query = query.where('siteId', '==', siteId);
        }
        if (dateRange) {
            query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.start));
            query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.end));
        }
        const snapshot = await query.get();
        const doorCounts = {};
        snapshot.docs.forEach(doc => {
            const doorId = doc.data().doorId;
            doorCounts[doorId] = (doorCounts[doorId] || 0) + 1;
        });
        const topDoors = Object.entries(doorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([doorId, count]) => ({ doorId, count }));
        return topDoors;
    }
    catch (error) {
        console.error('Error getting top doors:', error);
        return [];
    }
}
async function calculateSiteStats(siteId) {
    try {
        const stats = {
            totalUsers: 0,
            activeUsers: 0,
            totalDoors: 0,
            totalEquipment: 0,
            activeEmergencies: 0,
            activeHolds: 0,
            lastUpdated: new Date(),
        };
        // Count users
        const userSnapshot = await db.collection('users').where('siteId', '==', siteId).get();
        stats.totalUsers = userSnapshot.size;
        stats.activeUsers = userSnapshot.docs.filter(doc => doc.data().isActive).length;
        // Count doors
        const doorSnapshot = await db.collection('doors').where('siteId', '==', siteId).get();
        stats.totalDoors = doorSnapshot.size;
        // Count equipment
        const equipmentSnapshot = await db.collection('equipment').where('siteId', '==', siteId).get();
        stats.totalEquipment = equipmentSnapshot.size;
        // Count active emergencies
        const emergencySnapshot = await db.collection('emergencies')
            .where('siteId', '==', siteId)
            .where('status', '==', 'active')
            .get();
        stats.activeEmergencies = emergencySnapshot.size;
        // Count active holds
        const holdSnapshot = await db.collection('holds')
            .where('siteId', '==', siteId)
            .where('status', '==', 'active')
            .get();
        stats.activeHolds = holdSnapshot.size;
        return stats;
    }
    catch (error) {
        console.error('Error calculating site stats:', error);
        return {};
    }
}
// Export all functions
exports.generateAnalyticsReport = exports.analyticsFunctions.generateAnalyticsReport, exports.updateSiteStats = exports.analyticsFunctions.updateSiteStats, exports.generateMonthlyReport = exports.analyticsFunctions.generateMonthlyReport, exports.trackUserActivity = exports.analyticsFunctions.trackUserActivity, exports.exportData = exports.analyticsFunctions.exportData;
//# sourceMappingURL=analytics.js.map