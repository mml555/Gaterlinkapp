export declare const accessFunctions: {
    onAccessRequestCreated: (requestData: any) => Promise<void>;
    onAccessRequestUpdated: (requestData: any) => Promise<void>;
    onAccessGranted: (requestData: any) => Promise<void>;
    onAccessDenied: (requestData: any) => Promise<void>;
    logAccessEvent: (requestData: any, action: string, token?: string) => Promise<void>;
    validateAccessToken: (token: string) => Promise<{
        valid: boolean;
        reason: string;
        userId?: undefined;
        doorId?: undefined;
        siteId?: undefined;
        permissions?: undefined;
    } | {
        valid: boolean;
        userId: any;
        doorId: any;
        siteId: any;
        permissions: any;
        reason?: undefined;
    }>;
    generateAccessToken: (requestData: any) => Promise<string>;
};
export declare const onAccessRequestCreated: (requestData: any) => Promise<void>, onAccessRequestUpdated: (requestData: any) => Promise<void>, onAccessGranted: (requestData: any) => Promise<void>, onAccessDenied: (requestData: any) => Promise<void>, logAccessEvent: (requestData: any, action: string, token?: string) => Promise<void>, validateAccessToken: (token: string) => Promise<{
    valid: boolean;
    reason: string;
    userId?: undefined;
    doorId?: undefined;
    siteId?: undefined;
    permissions?: undefined;
} | {
    valid: boolean;
    userId: any;
    doorId: any;
    siteId: any;
    permissions: any;
    reason?: undefined;
}>, generateAccessToken: (requestData: any) => Promise<string>;
//# sourceMappingURL=access.d.ts.map