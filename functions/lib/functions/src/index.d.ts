import * as functions from 'firebase-functions';
export declare const onEmergencyCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>, onEmergencyUpdated: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>, onEmergencyResolved: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>, broadcastEmergency: functions.HttpsFunction & functions.Runnable<any>, sendEmergencyNotifications: functions.HttpsFunction & functions.Runnable<any>, autoResolveEmergencies: functions.CloudFunction<unknown>;
export declare const api: functions.HttpsFunction;
export declare const scheduledCleanup: functions.CloudFunction<unknown>;
export declare const config: {
    region: string;
    runtime: string;
    memory: string;
    timeoutSeconds: number;
};
//# sourceMappingURL=index.d.ts.map