export declare const maintenanceFunctions: {
    cleanupExpiredData: () => Promise<void>;
    backupDatabase: () => Promise<void>;
    optimizeDatabase: () => Promise<void>;
    sendSystemHealthReport: () => Promise<{
        timestamp: Date;
        metrics: {
            userActivity: number;
            systemPerformance: number;
            dataIntegrity: number;
            overallHealth: number;
        };
        status: string;
        recommendations: string[];
    } | undefined>;
    monitorSystemResources: () => Promise<{
        timestamp: Date;
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        } | {
            rss?: undefined;
            heapTotal?: undefined;
            heapUsed?: undefined;
            external?: undefined;
        };
        cpu: {
            usage: number;
        };
        storage: {
            usage: number;
        };
        activeConnections: {
            count: number;
        };
    } | undefined>;
};
export declare const cleanupExpiredData: () => Promise<void>, backupDatabase: () => Promise<void>, optimizeDatabase: () => Promise<void>, sendSystemHealthReport: () => Promise<{
    timestamp: Date;
    metrics: {
        userActivity: number;
        systemPerformance: number;
        dataIntegrity: number;
        overallHealth: number;
    };
    status: string;
    recommendations: string[];
} | undefined>, monitorSystemResources: () => Promise<{
    timestamp: Date;
    memory: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    } | {
        rss?: undefined;
        heapTotal?: undefined;
        heapUsed?: undefined;
        external?: undefined;
    };
    cpu: {
        usage: number;
    };
    storage: {
        usage: number;
    };
    activeConnections: {
        count: number;
    };
} | undefined>;
//# sourceMappingURL=maintenance.d.ts.map