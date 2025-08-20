export declare const webhookFunctions: {
    handleWebhook: (webhookData: any, signature?: string) => Promise<{
        success: boolean;
        message: string;
    }>;
    processPaymentWebhook: (paymentData: any) => Promise<{
        success: boolean;
        message: string;
    }>;
    processIntegrationWebhook: (integrationData: any) => Promise<{
        success: boolean;
        message: string;
    }>;
    validateWebhookSignature: (payload: any, signature?: string) => boolean;
};
export declare const handleWebhook: (webhookData: any, signature?: string) => Promise<{
    success: boolean;
    message: string;
}>, processPaymentWebhook: (paymentData: any) => Promise<{
    success: boolean;
    message: string;
}>, processIntegrationWebhook: (integrationData: any) => Promise<{
    success: boolean;
    message: string;
}>, validateWebhookSignature: (payload: any, signature?: string) => boolean;
//# sourceMappingURL=webhooks.d.ts.map