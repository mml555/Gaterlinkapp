export declare const equipmentFunctions: {
    onEquipmentCreated: (equipmentData: any) => Promise<void>;
    onEquipmentUpdated: (equipmentData: any) => Promise<void>;
    onReservationCreated: (reservationData: any) => Promise<void>;
    onReservationUpdated: (reservationData: any) => Promise<void>;
    sendEquipmentNotifications: (equipmentData: any, type: string) => Promise<void>;
    checkEquipmentAvailability: (equipmentId: string) => Promise<{
        equipmentId: string;
        isAvailable: boolean;
        status: any;
        activeReservations: number;
    }>;
    generateQRCode: (equipmentData: any) => Promise<void>;
};
export declare const onEquipmentCreated: (equipmentData: any) => Promise<void>, onEquipmentUpdated: (equipmentData: any) => Promise<void>, onReservationCreated: (reservationData: any) => Promise<void>, onReservationUpdated: (reservationData: any) => Promise<void>, sendEquipmentNotifications: (equipmentData: any, type: string) => Promise<void>, checkEquipmentAvailability: (equipmentId: string) => Promise<{
    equipmentId: string;
    isAvailable: boolean;
    status: any;
    activeReservations: number;
}>, generateQRCode: (equipmentData: any) => Promise<void>;
//# sourceMappingURL=equipment.d.ts.map