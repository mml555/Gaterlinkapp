import * as functions from 'firebase-functions';
import { UserRecord } from 'firebase-admin/auth';
export declare const authFunctions: {
    onUserCreated: functions.CloudFunction<UserRecord>;
    onUserDeleted: functions.CloudFunction<UserRecord>;
    onUserUpdated: any;
    sendWelcomeEmail: functions.HttpsFunction & functions.Runnable<any>;
    sendPasswordResetEmail: functions.HttpsFunction & functions.Runnable<any>;
    verifyEmail: functions.HttpsFunction & functions.Runnable<any>;
};
export declare const setUserRole: functions.HttpsFunction & functions.Runnable<any>;
export declare const getUserClaims: functions.HttpsFunction & functions.Runnable<any>;
export declare const updateUserPermissions: functions.HttpsFunction & functions.Runnable<any>;
export declare const deactivateUser: functions.HttpsFunction & functions.Runnable<any>;
export declare const reactivateUser: functions.HttpsFunction & functions.Runnable<any>;
export declare const onUserCreated: functions.CloudFunction<UserRecord>, onUserDeleted: functions.CloudFunction<UserRecord>, onUserUpdated: any, sendWelcomeEmail: functions.HttpsFunction & functions.Runnable<any>, sendPasswordResetEmail: functions.HttpsFunction & functions.Runnable<any>, verifyEmail: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=auth.d.ts.map