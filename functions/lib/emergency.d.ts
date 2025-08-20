import * as functions from 'firebase-functions';
export declare const emergencyFunctions: {
    onEmergencyCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
    onEmergencyUpdated: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
    onEmergencyResolved: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
    broadcastEmergency: functions.HttpsFunction & functions.Runnable<any>;
    sendEmergencyNotifications: functions.HttpsFunction & functions.Runnable<any>;
    autoResolveEmergencies: functions.CloudFunction<unknown>;
};
//# sourceMappingURL=emergency.d.ts.map