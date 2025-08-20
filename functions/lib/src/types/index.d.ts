export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    profilePicture?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    biometricEnabled: boolean;
    notificationSettings: NotificationSettings;
    trade?: TradeType;
    siteMemberships: SiteMembership[];
}
export declare enum UserRole {
    WORKER = "worker",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum TradeType {
    MEP = "mep",
    CARPENTRY = "carpentry",
    ELECTRICAL = "electrical",
    PLUMBING = "plumbing",
    HVAC = "hvac",
    GENERAL = "general"
}
export interface SiteMembership {
    siteId: string;
    role: UserRole;
    permissions: Permission[];
    joinedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
}
export interface NotificationSettings {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    soundEnabled: boolean;
    badgeEnabled: boolean;
}
export interface Site {
    id: string;
    name: string;
    address: string;
    description?: string;
    coordinates?: Coordinates;
    settings: SiteSettings;
    status: SiteStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface SiteSettings {
    autoApprovalEnabled: boolean;
    requireDocumentation: boolean;
    maxConcurrentUsers: number;
    emergencyContacts: EmergencyContact[];
    safetyRules: string[];
    equipmentLibraryEnabled: boolean;
    premiumFeatures: PremiumFeature[];
}
export declare enum SiteStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    EMERGENCY = "emergency"
}
export interface EmergencyContact {
    name: string;
    phone: string;
    email?: string;
    role: string;
}
export declare enum PremiumFeature {
    EQUIPMENT_SCHEDULING = "equipment_scheduling",
    TEMPORARY_HOLDS = "temporary_holds",
    SMART_ALERTS = "smart_alerts",
    API_INTEGRATIONS = "api_integrations",
    ADVANCED_ANALYTICS = "advanced_analytics"
}
export interface Door {
    id: string;
    siteId: string;
    name: string;
    location: string;
    type: DoorType;
    qrCode: string;
    nfcId?: string;
    description?: string;
    isActive: boolean;
    status: DoorStatus;
    accessLevel: AccessLevel;
    lockProfile: LockProfile;
    coordinates?: Coordinates;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt?: Date;
    accessCount: number;
    visibleTrades: TradeType[];
    approvers: string[];
}
export declare enum DoorType {
    SITE_ENTRY = "site_entry",
    SHANTY = "shanty",
    UNIT_ROOM = "unit_room"
}
export declare enum DoorStatus {
    ACTIVE = "active",
    ON_HOLD = "on_hold",
    DISABLED = "disabled",
    MAINTENANCE = "maintenance"
}
export declare enum AccessLevel {
    PUBLIC = "public",
    RESTRICTED = "restricted",
    PRIVATE = "private"
}
export interface LockProfile {
    id: string;
    type: LockType;
    code?: string;
    qrId: string;
    nfcId?: string;
    padlockCode?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum LockType {
    QR = "qr",
    NFC = "nfc",
    PADLOCK = "padlock",
    SMART_LOCK = "smart_lock"
}
export interface AccessRequest {
    id: string;
    userId: string;
    doorId: string;
    siteId: string;
    status: RequestStatus;
    priority: RequestPriority;
    category: RequestCategory;
    title: string;
    description: string;
    reason: string;
    note?: string;
    documents?: Document[];
    autoApproved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    deniedBy?: string;
    deniedAt?: Date;
    denialReason?: string;
    requestedAt: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    assignedTo?: string;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    accessToken?: string;
    accessCode?: string;
    expiresAt?: Date;
}
export interface Document {
    id: string;
    name: string;
    type: DocumentType;
    url: string;
    uploadedAt: Date;
    expiresAt?: Date;
    status: DocumentStatus;
}
export declare enum DocumentType {
    INSURANCE = "insurance",
    CERTIFICATION = "certification",
    SAFETY_TRAINING = "safety_training",
    WORK_PERMIT = "work_permit",
    OTHER = "other"
}
export declare enum DocumentStatus {
    VALID = "valid",
    EXPIRED = "expired",
    MISSING = "missing",
    PENDING_REVIEW = "pending_review"
}
export declare enum RequestStatus {
    PENDING = "pending",
    DOCUMENTATION_REQUIRED = "documentation_required",
    IN_PROGRESS = "in_progress",
    APPROVED = "approved",
    DENIED = "denied",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export declare enum RequestPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum RequestCategory {
    GENERAL = "general",
    TECHNICAL = "technical",
    BILLING = "billing",
    ACCESS = "access",
    MAINTENANCE = "maintenance",
    SECURITY = "security",
    OTHER = "other"
}
export interface Equipment {
    id: string;
    siteId: string;
    name: string;
    type: EquipmentType;
    description?: string;
    qrCode: string;
    status: EquipmentStatus;
    currentReservationId?: string;
    maintenanceSchedule: MaintenanceSchedule;
    checklists: Checklist[];
    location?: string;
    specifications?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum EquipmentType {
    TOOLS = "tools",
    MACHINERY = "machinery",
    VEHICLES = "vehicles",
    SAFETY_EQUIPMENT = "safety_equipment",
    ELECTRONICS = "electronics",
    OTHER = "other"
}
export declare enum EquipmentStatus {
    AVAILABLE = "available",
    IN_USE = "in_use",
    MAINTENANCE = "maintenance",
    OUT_OF_SERVICE = "out_of_service",
    RESERVED = "reserved"
}
export interface MaintenanceSchedule {
    lastMaintenance: Date;
    nextMaintenance: Date;
    maintenanceInterval: number;
    maintenanceType: string;
    performedBy?: string;
}
export interface Checklist {
    id: string;
    name: string;
    type: ChecklistType;
    items: ChecklistItem[];
    required: boolean;
    createdAt: Date;
}
export declare enum ChecklistType {
    PRE_USE = "pre_use",
    POST_USE = "post_use",
    MAINTENANCE = "maintenance",
    SAFETY = "safety"
}
export interface ChecklistItem {
    id: string;
    question: string;
    type: 'boolean' | 'text' | 'photo';
    required: boolean;
    order: number;
}
export interface ChecklistResponse {
    id: string;
    checklistId: string;
    reservationId: string;
    responses: ChecklistItemResponse[];
    completedAt: Date;
    completedBy: string;
}
export interface ChecklistItemResponse {
    itemId: string;
    response: boolean | string;
    photoUrl?: string;
    notes?: string;
}
export interface Reservation {
    id: string;
    equipmentId: string;
    userId: string;
    siteId: string;
    startTime: Date;
    endTime: Date;
    reason: string;
    status: ReservationStatus;
    needsApproval: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    deniedBy?: string;
    deniedAt?: Date;
    denialReason?: string;
    preUseChecklist?: ChecklistResponse;
    postUseChecklist?: ChecklistResponse;
    damageReport?: DamageReport;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ReservationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    DENIED = "denied",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export interface DamageReport {
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    photos: string[];
    reportedAt: Date;
    reportedBy: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolutionNotes?: string;
}
export interface Hold {
    id: string;
    siteId: string;
    areaId: string;
    areaType: 'door' | 'equipment' | 'site';
    reason: string;
    startTime: Date;
    endTime: Date;
    status: HoldStatus;
    createdBy: string;
    createdAt: Date;
    affectedUsers: string[];
    notificationsSent: boolean;
}
export declare enum HoldStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export interface EmergencyEvent {
    id: string;
    siteId: string;
    type: EmergencyType;
    severity: EmergencySeverity;
    description: string;
    location?: string;
    startTime: Date;
    endTime?: Date;
    status: EmergencyStatus;
    createdBy: string;
    createdAt: Date;
    affectedUsers: string[];
    notificationsSent: boolean;
    readAcknowledgments: ReadAcknowledgment[];
}
export declare enum EmergencyType {
    EVACUATION = "evacuation",
    FIRE = "fire",
    MEDICAL = "medical",
    SECURITY = "security",
    WEATHER = "weather",
    OTHER = "other"
}
export declare enum EmergencySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum EmergencyStatus {
    ACTIVE = "active",
    RESOLVED = "resolved",
    CANCELLED = "cancelled"
}
export interface ReadAcknowledgment {
    userId: string;
    acknowledgedAt: Date;
    deviceInfo?: string;
}
export interface AccessLog {
    id: string;
    userId: string;
    doorId: string;
    siteId: string;
    action: AccessAction;
    timestamp: Date;
    immutable: boolean;
    metadata: AccessLogMetadata;
    accessToken?: string;
    accessCode?: string;
    reason?: string;
    note?: string;
}
export declare enum AccessAction {
    GRANTED = "granted",
    DENIED = "denied",
    USED = "used",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export interface AccessLogMetadata {
    deviceInfo: DeviceInfo;
    location?: Coordinates;
    userAgent: string;
    ipAddress?: string;
    biometricUsed?: boolean;
}
export interface DeviceInfo {
    platform: string;
    version: string;
    model?: string;
    uniqueId: string;
}
export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    messageType: MessageType;
    content: string;
    timestamp: Date;
    isRead: boolean;
    attachments?: MessageAttachment[];
    replyTo?: string;
}
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    FILE = "file",
    SYSTEM = "system"
}
export interface MessageAttachment {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
}
export interface Chat {
    id: string;
    requestId?: string;
    siteId: string;
    participants: string[];
    lastMessage?: ChatMessage;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    biometricEnabled: boolean;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    trade?: TradeType;
}
export interface RequestForm {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    doorId: string;
    doorName: string;
    type: 'temporary' | 'permanent';
    duration?: string;
    reason?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: PaginationInfo;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    Home: undefined;
    QRScanner: undefined;
    DoorDetails: {
        doorId: string;
    };
    RequestDetails: {
        requestId: string;
    };
    NewRequest: undefined;
    Chat: {
        chatId: string;
    };
    Profile: undefined;
    Settings: undefined;
    AdminDashboard: undefined;
    UserManagement: undefined;
    Analytics: undefined;
    EquipmentList: undefined;
    EquipmentDetails: {
        equipmentId: string;
    };
    EquipmentReservation: {
        equipmentId?: string;
    };
    SiteManagement: undefined;
    EmergencyDashboard: undefined;
    EmergencyManagement: undefined;
    HoldManagement: undefined;
};
export interface AppState {
    auth: AuthState;
    doors: DoorState;
    requests: RequestState;
    chat: ChatState;
    notifications: NotificationState;
    sites: SiteState;
    equipment: EquipmentState;
    holds: HoldState;
    emergencies: EmergencyState;
}
export interface DoorState {
    doors: Door[];
    savedDoors: Door[];
    siteDoors: Record<string, Door[]>;
    isLoading: boolean;
    error: string | null;
    selectedDoor: Door | null;
    lastScanResult: QRCodeScanResult | null;
    scanHistory: QRCodeScanResult[];
}
export interface QRCodeScanResult {
    id: string;
    qrCode: string;
    doorId?: string;
    equipmentId?: string;
    scannedAt: Date;
    success: boolean;
    error?: string;
}
export interface RequestState {
    requests: AccessRequest[];
    userRequests: AccessRequest[];
    pendingRequests: AccessRequest[];
    isLoading: boolean;
    error: string | null;
    selectedRequest: AccessRequest | null;
    filters: RequestFilters;
}
export interface RequestFilters {
    status?: RequestStatus[];
    priority?: RequestPriority[];
    category?: RequestCategory[];
    siteId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export interface ChatState {
    chats: Chat[];
    messages: Record<string, ChatMessage[]>;
    isLoading: boolean;
    error: string | null;
    activeChat: Chat | null;
}
export interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    timestamp: Date;
    data?: Record<string, any>;
}
export declare enum NotificationType {
    REQUEST_UPDATE = "request_update",
    NEW_MESSAGE = "new_message",
    DOOR_ACCESS = "door_access",
    EQUIPMENT_RESERVATION = "equipment_reservation",
    HOLD_NOTIFICATION = "hold_notification",
    EMERGENCY_ALERT = "emergency_alert",
    SYSTEM = "system"
}
export interface SiteState {
    sites: Site[];
    selectedSite: Site | null;
    isLoading: boolean;
    error: string | null;
    userSites: Site[];
}
export interface EquipmentState {
    equipment: Equipment[];
    reservations: Reservation[];
    userReservations: Reservation[];
    isLoading: boolean;
    error: string | null;
    selectedEquipment: Equipment | null;
    selectedReservation: Reservation | null;
}
export interface HoldState {
    holds: Hold[];
    activeHolds: Hold[];
    isLoading: boolean;
    error: string | null;
}
export interface EmergencyState {
    emergencies: EmergencyEvent[];
    activeEmergencies: EmergencyEvent[];
    isLoading: boolean;
    error: string | null;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface FileUpload {
    uri: string;
    type: string;
    name: string;
    size: number;
}
export interface BiometricResult {
    success: boolean;
    error?: string;
}
export interface LoginForm {
    email: string;
    password: string;
    rememberMe: boolean;
}
export interface RequestFormData {
    title: string;
    description: string;
    category: RequestCategory;
    priority: RequestPriority;
    doorId?: string;
    attachments?: FileUpload[];
}
export interface ProfileForm {
    firstName: string;
    lastName: string;
    phone?: string;
    profilePicture?: FileUpload;
    trade?: TradeType;
}
export interface AnalyticsData {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    averageResponseTime: number;
    requestsByCategory: Record<RequestCategory, number>;
    requestsByStatus: Record<RequestStatus, number>;
    requestsByPriority: Record<RequestPriority, number>;
    monthlyTrends: MonthlyTrend[];
    siteStats: SiteStats;
}
export interface SiteStats {
    totalDoors: number;
    activeUsers: number;
    equipmentUtilization: number;
    accessLogs: number;
    holds: number;
    emergencies: number;
}
export interface MonthlyTrend {
    month: string;
    requests: number;
    completed: number;
    averageResponseTime: number;
}
export declare enum PricingTier {
    STARTER = "starter",
    PREMIUM = "premium",
    DEVELOPER = "developer"
}
export interface PricingLimits {
    maxDoors: number;
    maxManagers: number;
    features: PremiumFeature[];
    apiAccess: boolean;
    integrations: boolean;
}
//# sourceMappingURL=index.d.ts.map