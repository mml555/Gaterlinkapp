import * as functions from 'firebase-functions';
import { onUserCreated, onUserUpdated, onEmergencyCreated, onAccessRequestCreated, scheduledCleanup } from './free-tier-functions';
export { onUserCreated, onUserUpdated, onEmergencyCreated, onAccessRequestCreated, scheduledCleanup, };
export declare const api: functions.HttpsFunction;
export declare const createNotification: functions.HttpsFunction & functions.Runnable<any>;
export declare const updateUserClaims: functions.HttpsFunction & functions.Runnable<any>;
export declare const markNotificationRead: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=index.d.ts.map