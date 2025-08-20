export declare const holdFunctions: {
    onHoldCreated: (holdData: any) => Promise<void>;
    onHoldUpdated: (holdData: any) => Promise<void>;
    onHoldExpired: (holdData: any) => Promise<void>;
    sendHoldNotifications: (holdData: any) => Promise<void>;
    autoExpireHolds: () => Promise<void>;
    extendHold: (holdId: string, extensionMinutes: number) => Promise<{
        success: boolean;
        newExpiresAt: Date;
    }>;
};
export declare const onHoldCreated: (holdData: any) => Promise<void>, onHoldUpdated: (holdData: any) => Promise<void>, onHoldExpired: (holdData: any) => Promise<void>, sendHoldNotifications: (holdData: any) => Promise<void>, autoExpireHolds: () => Promise<void>, extendHold: (holdId: string, extensionMinutes: number) => Promise<{
    success: boolean;
    newExpiresAt: Date;
}>;
//# sourceMappingURL=holds.d.ts.map