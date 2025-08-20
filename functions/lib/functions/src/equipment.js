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
exports.generateQRCode = exports.checkEquipmentAvailability = exports.sendEquipmentNotifications = exports.onReservationUpdated = exports.onReservationCreated = exports.onEquipmentUpdated = exports.onEquipmentCreated = exports.equipmentFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("./notifications");
// Initialize Firebase Admin
const db = admin.firestore();
exports.equipmentFunctions = {
    // Equipment Creation Trigger
    onEquipmentCreated: async (equipmentData) => {
        try {
            console.log('New equipment created:', equipmentData.id);
            // Generate QR code for equipment
            await (0, exports.generateQRCode)(equipmentData);
            // Send notifications to site users
            await (0, exports.sendEquipmentNotifications)(equipmentData, 'created');
        }
        catch (error) {
            console.error('Error in onEquipmentCreated:', error);
        }
    },
    // Equipment Update Trigger
    onEquipmentUpdated: async (equipmentData) => {
        try {
            console.log('Equipment updated:', equipmentData.id);
            // Send update notifications
            await (0, exports.sendEquipmentNotifications)(equipmentData, 'updated');
        }
        catch (error) {
            console.error('Error in onEquipmentUpdated:', error);
        }
    },
    // Reservation Creation Trigger
    onReservationCreated: async (reservationData) => {
        try {
            console.log('New reservation created:', reservationData.id);
            // Update equipment availability
            await updateEquipmentAvailability(reservationData.equipmentId, 'reserved');
            // Send reservation notifications
            await (0, exports.sendEquipmentNotifications)(reservationData, 'reservation');
        }
        catch (error) {
            console.error('Error in onReservationCreated:', error);
        }
    },
    // Reservation Update Trigger
    onReservationUpdated: async (reservationData) => {
        try {
            console.log('Reservation updated:', reservationData.id);
            // Handle reservation status changes
            if (reservationData.status === 'completed') {
                await updateEquipmentAvailability(reservationData.equipmentId, 'available');
            }
            else if (reservationData.status === 'cancelled') {
                await updateEquipmentAvailability(reservationData.equipmentId, 'available');
            }
        }
        catch (error) {
            console.error('Error in onReservationUpdated:', error);
        }
    },
    // Send Equipment Notifications
    sendEquipmentNotifications: async (equipmentData, type) => {
        try {
            const payload = {
                title: `Equipment ${type === 'created' ? 'Added' : type === 'updated' ? 'Updated' : 'Reservation'}: ${equipmentData.name}`,
                body: getEquipmentNotificationBody(equipmentData, type),
                data: {
                    type: 'equipment',
                    equipmentId: equipmentData.id,
                    siteId: equipmentData.siteId,
                    notificationType: type,
                },
                priority: 'normal',
                sound: 'default',
                channelId: 'equipment-updates',
            };
            const target = {
                siteId: equipmentData.siteId,
            };
            await notifications_1.notificationFunctions.sendPushNotification(target, payload);
        }
        catch (error) {
            console.error('Error sending equipment notifications:', error);
        }
    },
    // Check Equipment Availability
    checkEquipmentAvailability: async (equipmentId) => {
        try {
            const equipmentDoc = await db.collection('equipment').doc(equipmentId).get();
            if (!equipmentDoc.exists) {
                throw new Error('Equipment not found');
            }
            const equipmentData = equipmentDoc.data();
            // Check for active reservations
            const activeReservations = await db.collection('reservations')
                .where('equipmentId', '==', equipmentId)
                .where('status', 'in', ['active', 'pending'])
                .get();
            const isAvailable = activeReservations.empty && equipmentData.status === 'available';
            return {
                equipmentId,
                isAvailable,
                status: equipmentData.status,
                activeReservations: activeReservations.docs.length,
            };
        }
        catch (error) {
            console.error('Error checking equipment availability:', error);
            throw error;
        }
    },
    // Generate QR Code
    generateQRCode: async (equipmentData) => {
        try {
            // Generate QR code data
            const qrData = {
                type: 'equipment',
                id: equipmentData.id,
                siteId: equipmentData.siteId,
                name: equipmentData.name,
            };
            // Store QR code data
            await db.collection('qrCodes').doc(equipmentData.id).set(Object.assign(Object.assign({}, qrData), { createdAt: admin.firestore.FieldValue.serverTimestamp(), isActive: true }));
            console.log(`QR code generated for equipment: ${equipmentData.id}`);
        }
        catch (error) {
            console.error('Error generating QR code:', error);
        }
    },
};
// Helper Functions
async function updateEquipmentAvailability(equipmentId, status) {
    try {
        await db.collection('equipment').doc(equipmentId).update({
            status,
            lastStatusUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Equipment ${equipmentId} status updated to ${status}`);
    }
    catch (error) {
        console.error('Error updating equipment availability:', error);
    }
}
function getEquipmentNotificationBody(equipmentData, type) {
    switch (type) {
        case 'created':
            return `New equipment "${equipmentData.name}" has been added to the site`;
        case 'updated':
            return `Equipment "${equipmentData.name}" has been updated`;
        case 'reservation':
            return `New reservation for "${equipmentData.name}"`;
        case 'maintenance':
            return `Equipment "${equipmentData.name}" requires maintenance`;
        case 'available':
            return `Equipment "${equipmentData.name}" is now available`;
        default:
            return `Update for equipment "${equipmentData.name}"`;
    }
}
// Export all functions
exports.onEquipmentCreated = exports.equipmentFunctions.onEquipmentCreated, exports.onEquipmentUpdated = exports.equipmentFunctions.onEquipmentUpdated, exports.onReservationCreated = exports.equipmentFunctions.onReservationCreated, exports.onReservationUpdated = exports.equipmentFunctions.onReservationUpdated, exports.sendEquipmentNotifications = exports.equipmentFunctions.sendEquipmentNotifications, exports.checkEquipmentAvailability = exports.equipmentFunctions.checkEquipmentAvailability, exports.generateQRCode = exports.equipmentFunctions.generateQRCode;
//# sourceMappingURL=equipment.js.map