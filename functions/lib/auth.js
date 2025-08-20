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
exports.verifyEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.onUserDeleted = exports.onUserCreated = exports.authFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const auth = admin.auth();
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
exports.authFunctions = {
    // User Creation Trigger
    onUserCreated: functions.auth.user().onCreate(async (user) => {
        var _a, _b;
        try {
            console.log('New user created:', user.uid);
            // Set default custom claims
            const defaultClaims = {
                role: UserRole.USER,
                isActive: true,
                lastLogin: Date.now(),
            };
            await auth.setCustomUserClaims(user.uid, defaultClaims);
            // Create user document in Firestore
            const userData = {
                id: user.uid,
                email: user.email,
                firstName: ((_a = user.displayName) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || '',
                lastName: ((_b = user.displayName) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || '',
                role: UserRole.USER,
                profilePicture: generateAvatar(user.displayName || user.email || ''),
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                biometricEnabled: false,
                notificationSettings: {
                    pushEnabled: true,
                    emailEnabled: true,
                    smsEnabled: false,
                    soundEnabled: true,
                    badgeEnabled: true,
                },
                lastLogin: admin.firestore.FieldValue.serverTimestamp(),
                loginCount: 1,
            };
            await db.collection('users').doc(user.uid).set(userData);
            // Send welcome email
            await sendWelcomeEmail(user.email, user.displayName || 'User');
            console.log('User setup completed for:', user.uid);
        }
        catch (error) {
            console.error('Error in onUserCreated:', error);
        }
    }),
    // User Deletion Trigger
    onUserDeleted: functions.auth.user().onDelete(async (user) => {
        try {
            console.log('User deleted:', user.uid);
            // Clean up user data
            await db.collection('users').doc(user.uid).delete();
            // Remove from site memberships
            const memberships = await db.collection('siteMemberships')
                .where('userId', '==', user.uid)
                .get();
            const batch = db.batch();
            memberships.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('User cleanup completed for:', user.uid);
        }
        catch (error) {
            console.error('Error in onUserDeleted:', error);
        }
    }),
    // Send welcome email
    sendWelcomeEmail: functions.https.onCall(async (data, context) => {
        try {
            const { email } = data;
            // Implementation for sending welcome email
            console.log('Sending welcome email to:', email);
            // This would integrate with your email service
            // For now, just log the action
            return { success: true, message: 'Welcome email sent' };
        }
        catch (error) {
            console.error('Error sending welcome email:', error);
            throw new functions.https.HttpsError('internal', 'Failed to send welcome email');
        }
    }),
    // Send password reset email
    sendPasswordResetEmail: functions.https.onCall(async (data, context) => {
        try {
            const { email } = data;
            // Implementation for sending password reset email
            console.log('Sending password reset email to:', email);
            // This would integrate with your email service
            // For now, just log the action
            return { success: true, message: 'Password reset email sent' };
        }
        catch (error) {
            console.error('Error sending password reset email:', error);
            throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
        }
    }),
    // Verify email
    verifyEmail: functions.https.onCall(async (data, context) => {
        try {
            const { email } = data;
            // Implementation for email verification
            console.log('Verifying email:', email);
            // This would integrate with your email verification service
            // For now, just log the action
            return { success: true, message: 'Email verification sent' };
        }
        catch (error) {
            console.error('Error verifying email:', error);
            throw new functions.https.HttpsError('internal', 'Failed to verify email');
        }
    }),
};
// Helper function to generate avatar
function generateAvatar(name) {
    // Simple avatar generation - in production, you might use a service like Gravatar
    const initials = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200`;
}
// Helper function to send welcome email
async function sendWelcomeEmail(email, displayName) {
    // Implementation for sending welcome email
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    console.log(`Sending welcome email to ${email} for user ${displayName}`);
    // For now, just log the action
    // In production, you would:
    // 1. Use a template service
    // 2. Send via email service
    // 3. Handle errors and retries
}
// Export all functions
exports.onUserCreated = exports.authFunctions.onUserCreated, exports.onUserDeleted = exports.authFunctions.onUserDeleted, sendWelcomeEmail = exports.authFunctions.sendWelcomeEmail, exports.sendPasswordResetEmail = exports.authFunctions.sendPasswordResetEmail, exports.verifyEmail = exports.authFunctions.verifyEmail;
//# sourceMappingURL=auth.js.map