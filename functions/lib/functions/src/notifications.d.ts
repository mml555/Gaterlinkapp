import * as functions from 'firebase-functions';
import { UserRole } from '../../src/types';
interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
    clickAction?: string;
    priority?: 'high' | 'normal' | 'low';
    sound?: string;
    badge?: number;
    channelId?: string;
}
interface NotificationTarget {
    userIds?: string[];
    siteId?: string;
    role?: UserRole;
    fcmTokens?: string[];
}
export declare const notificationFunctions: {
    sendPushNotification: (target: NotificationTarget, payload: NotificationPayload) => Promise<void>;
    sendEmailNotification: (target: NotificationTarget, subject: string, htmlBody: string, textBody?: string) => Promise<void>;
    sendSMSNotification: (target: NotificationTarget, message: string) => Promise<void>;
    batchSendNotifications: (notifications: Array<{
        target: NotificationTarget;
        payload: NotificationPayload;
        type: "push" | "email" | "sms";
    }>) => Promise<void>;
    updateNotificationPreferences: (userId: string, preferences: {
        pushEnabled?: boolean;
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        soundEnabled?: boolean;
        badgeEnabled?: boolean;
    }) => Promise<void>;
    markNotificationAsRead: (userId: string, notificationId: string) => Promise<void>;
};
export declare const sendEmergencyNotification: functions.HttpsFunction & functions.Runnable<any>;
export declare const sendHoldNotification: functions.HttpsFunction & functions.Runnable<any>;
export declare const sendEquipmentNotification: functions.HttpsFunction & functions.Runnable<any>;
export declare const sendAccessRequestNotification: functions.HttpsFunction & functions.Runnable<any>;
export declare const sendPushNotification: (target: NotificationTarget, payload: NotificationPayload) => Promise<void>, sendEmailNotification: (target: NotificationTarget, subject: string, htmlBody: string, textBody?: string) => Promise<void>, sendSMSNotification: (target: NotificationTarget, message: string) => Promise<void>, batchSendNotifications: (notifications: Array<{
    target: NotificationTarget;
    payload: NotificationPayload;
    type: "push" | "email" | "sms";
}>) => Promise<void>, updateNotificationPreferences: (userId: string, preferences: {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    soundEnabled?: boolean;
    badgeEnabled?: boolean;
}) => Promise<void>, markNotificationAsRead: (userId: string, notificationId: string) => Promise<void>;
export {};
//# sourceMappingURL=notifications.d.ts.map