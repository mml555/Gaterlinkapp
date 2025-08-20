import * as functions from 'firebase-functions';
declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    SITE_MANAGER = "site_manager",
    EMERGENCY_RESPONDER = "emergency_responder",
    EQUIPMENT_MANAGER = "equipment_manager"
}
interface NotificationTarget {
    userId?: string;
    siteId?: string;
    role?: UserRole;
    userIds?: string[];
}
interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    priority?: 'low' | 'high' | 'normal';
    sound?: string;
    channelId?: string;
    badge?: number;
    imageUrl?: string;
    clickAction?: string;
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
    updateNotificationPreferences: functions.HttpsFunction & functions.Runnable<any>;
    markNotificationAsRead: functions.HttpsFunction & functions.Runnable<any>;
};
export declare const sendPushNotification: (target: NotificationTarget, payload: NotificationPayload) => Promise<void>, sendEmailNotification: (target: NotificationTarget, subject: string, htmlBody: string, textBody?: string) => Promise<void>, sendSMSNotification: (target: NotificationTarget, message: string) => Promise<void>, batchSendNotifications: (notifications: Array<{
    target: NotificationTarget;
    payload: NotificationPayload;
    type: "push" | "email" | "sms";
}>) => Promise<void>, updateNotificationPreferences: functions.HttpsFunction & functions.Runnable<any>, markNotificationAsRead: functions.HttpsFunction & functions.Runnable<any>;
export {};
//# sourceMappingURL=notifications.d.ts.map