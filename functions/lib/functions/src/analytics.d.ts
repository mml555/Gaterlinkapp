export declare const analyticsFunctions: {
    generateAnalyticsReport: (siteId?: string, dateRange?: {
        start: Date;
        end: Date;
    }) => Promise<{
        timestamp: Date;
        siteId: string | undefined;
        dateRange: {
            start: Date;
            end: Date;
        } | undefined;
        metrics: {};
        trends: {};
        topUsers: {
            userId: string;
            count: number;
        }[];
        topDoors: {
            doorId: string;
            count: number;
        }[];
    }>;
    updateSiteStats: (siteId: string) => Promise<void>;
    generateMonthlyReport: (month: number, year: number) => Promise<{
        timestamp: Date;
        siteId: string | undefined;
        dateRange: {
            start: Date;
            end: Date;
        } | undefined;
        metrics: {};
        trends: {};
        topUsers: {
            userId: string;
            count: number;
        }[];
        topDoors: {
            doorId: string;
            count: number;
        }[];
    }>;
    trackUserActivity: (userId: string, activity: string, metadata?: any) => Promise<void>;
    exportData: (collection: string, filters?: any) => Promise<{
        id: string;
    }[]>;
};
export declare const generateAnalyticsReport: (siteId?: string, dateRange?: {
    start: Date;
    end: Date;
}) => Promise<{
    timestamp: Date;
    siteId: string | undefined;
    dateRange: {
        start: Date;
        end: Date;
    } | undefined;
    metrics: {};
    trends: {};
    topUsers: {
        userId: string;
        count: number;
    }[];
    topDoors: {
        doorId: string;
        count: number;
    }[];
}>, updateSiteStats: (siteId: string) => Promise<void>, generateMonthlyReport: (month: number, year: number) => Promise<{
    timestamp: Date;
    siteId: string | undefined;
    dateRange: {
        start: Date;
        end: Date;
    } | undefined;
    metrics: {};
    trends: {};
    topUsers: {
        userId: string;
        count: number;
    }[];
    topDoors: {
        doorId: string;
        count: number;
    }[];
}>, trackUserActivity: (userId: string, activity: string, metadata?: any) => Promise<void>, exportData: (collection: string, filters?: any) => Promise<{
    id: string;
}[]>;
//# sourceMappingURL=analytics.d.ts.map