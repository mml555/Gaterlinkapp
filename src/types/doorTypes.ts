// Door Types and Data Models for GaterLink App

// ============================================================================
// CORE DOOR TYPES
// ============================================================================

export enum DoorType {
  SITE = 'site',
  SHANTY = 'shanty',
  APARTMENT = 'apartment',
}

export enum LockType {
  PADLOCK = 'padlock',
  NFC_LOCK = 'nfc_lock',
  ELECTRONIC = 'electronic',
  MECHANICAL = 'mechanical',
}

export enum AccessStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING_APPROVAL = 'pending_approval',
  REQUIRES_SITE_SIGNIN = 'requires_site_signin',
  REQUIRES_PROFILE_COMPLETION = 'requires_profile_completion',
}

// ============================================================================
// SITE DOOR - Main building entry point
// ============================================================================

export interface SiteDoor {
  id: string;
  type: DoorType.SITE;
  name: string;
  siteName: string;
  location: string;
  qrCode: string;
  description?: string;
  isActive: boolean;
  requiresSiteSignin: boolean;
  allowsProfileCompletion: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  siteInfo: {
    siteId: string;
    siteName: string;
    siteAddress: string;
    siteManager?: string;
    sitePhone?: string;
    siteEmail?: string;
    emergencyContact?: string;
  };
  accessRules: {
    requiresProfileCompletion: boolean;
    allowsTemporaryAccess: boolean;
    maxTemporaryAccessHours: number;
    requiresApproval: boolean;
    allowedUserRoles: UserRole[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

// ============================================================================
// SHANTY DOOR - Pre-configured access points
// ============================================================================

export interface ShantyDoor {
  id: string;
  type: DoorType.SHANTY;
  name: string;
  siteName: string;
  location: string;
  qrCode: string;
  description?: string;
  isActive: boolean;
  lockType: LockType;
  lockConfiguration: PadlockConfig | NFCLockConfig;
  accessProfile: {
    doorName: string;
    site: string;
    accessLevel: AccessLevel;
    allowedUserRoles: UserRole[];
    requiresApproval: boolean;
    maxAccessDuration?: number; // in hours
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

export interface PadlockConfig {
  lockType: LockType.PADLOCK;
  combination: string;
  instructions?: string;
  emergencyOverride?: string;
}

export interface NFCLockConfig {
  lockType: LockType.NFC_LOCK;
  supportsAppleWallet: boolean;
  supportsGoogleWallet: boolean;
  keyTypes: {
    singleUse: boolean;
    permanent: boolean;
    temporary: boolean;
  };
  nfcConfiguration: {
    deviceId: string;
    encryptionKey?: string;
    maxActiveKeys: number;
  };
}

// ============================================================================
// APARTMENT QR CODE - Digital blue taping system
// ============================================================================

export interface ApartmentQRCode {
  id: string;
  type: DoorType.APARTMENT;
  apartmentNumber: string;
  buildingName: string;
  floorNumber: number;
  qrCode: string;
  isActive: boolean;
  isTemporarilyShut: boolean;
  shutReason?: string;
  shutUntil?: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  apartmentInfo: {
    unitType: string;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    status: ApartmentStatus;
  };
  workOrders: WorkOrder[];
  tradeAssignments: TradeAssignment[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

export enum ApartmentStatus {
  UNDER_CONSTRUCTION = 'under_construction',
  PUNCH_LIST = 'punch_list',
  FINAL_INSPECTION = 'final_inspection',
  COMPLETED = 'completed',
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  tradeType: TradeType;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  photos: WorkOrderPhoto[];
  notes: WorkOrderNote[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum WorkOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  VERIFIED = 'verified',
}

export enum TradeType {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  CARPENTRY = 'carpentry',
  PAINTING = 'painting',
  FLOORING = 'flooring',
  ROOFING = 'roofing',
  MASONRY = 'masonry',
  LANDSCAPING = 'landscaping',
  CLEANING = 'cleaning',
  INSPECTION = 'inspection',
  GENERAL = 'general',
}

export interface WorkOrderPhoto {
  id: string;
  url: string;
  caption?: string;
  takenAt: Date;
  takenBy: string;
  category: PhotoCategory;
}

export enum PhotoCategory {
  BEFORE = 'before',
  AFTER = 'after',
  ISSUE = 'issue',
  PROGRESS = 'progress',
  COMPLETION = 'completion',
}

export interface WorkOrderNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  isInternal: boolean;
}

export interface TradeAssignment {
  tradeType: TradeType;
  assignedUsers: string[];
  priority: WorkOrderPriority;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: TradeAssignmentStatus;
}

export enum TradeAssignmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

// ============================================================================
// ACCESS CONTROL & PERMISSIONS
// ============================================================================

export interface AccessControl {
  id: string;
  userId: string;
  doorId: string;
  doorType: DoorType;
  accessLevel: AccessLevel;
  grantedAt: Date;
  expiresAt?: Date;
  grantedBy?: string;
  reason?: string;
  isActive: boolean;
  accessHistory: AccessEvent[];
}

export interface AccessEvent {
  id: string;
  accessControlId: string;
  eventType: AccessEventType;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  metadata?: Record<string, any>;
}

export enum AccessEventType {
  GRANTED = 'granted',
  USED = 'used',
  DENIED = 'denied',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  RENEWED = 'renewed',
}

// ============================================================================
// SITE MANAGEMENT
// ============================================================================

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  siteManager: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    email?: string;
  };
  siteInfo: {
    projectType: string;
    startDate: Date;
    estimatedCompletion: Date;
    actualCompletion?: Date;
    totalUnits?: number;
    totalFloors?: number;
  };
  accessConfiguration: {
    requiresSiteSignin: boolean;
    allowsProfileCompletion: boolean;
    maxTemporaryAccessHours: number;
    requiresApproval: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER PROFILE & TRADE INFORMATION
// ============================================================================

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  tradeTypes: TradeType[];
  certifications: Certification[];
  insurance: InsuranceInfo;
  emergencyContact: EmergencyContact;
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  isActive: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  expiryDate: Date;
  certificateUrl?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// ============================================================================
// NFC KEY MANAGEMENT
// ============================================================================

export interface NFCKey {
  id: string;
  userId: string;
  doorId: string;
  keyType: NFCKeyType;
  keyData: string;
  isActive: boolean;
  issuedAt: Date;
  expiresAt?: Date;
  usedAt?: Date;
  revokedAt?: Date;
  metadata: {
    deviceId?: string;
    walletType?: 'apple' | 'google';
    encryptionKey?: string;
  };
}

export enum NFCKeyType {
  SINGLE_USE = 'single_use',
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
}

// ============================================================================
// UNION TYPE FOR ALL DOOR TYPES
// ============================================================================

export type Door = SiteDoor | ShantyDoor | ApartmentQRCode;

// ============================================================================
// QR CODE SCANNING RESPONSE
// ============================================================================

export interface QRCodeScanResult {
  success: boolean;
  doorType: DoorType;
  door: Door;
  accessStatus: AccessStatus;
  requiredActions: RequiredAction[];
  message: string;
  redirectTo?: string;
}

export interface RequiredAction {
  type: RequiredActionType;
  description: string;
  isBlocking: boolean;
  actionUrl?: string;
}

export enum RequiredActionType {
  COMPLETE_PROFILE = 'complete_profile',
  SITE_SIGNIN = 'site_signin',
  APPROVAL_REQUIRED = 'approval_required',
  PAYMENT_REQUIRED = 'payment_required',
  CERTIFICATION_EXPIRED = 'certification_expired',
  INSURANCE_EXPIRED = 'insurance_expired',
}

// ============================================================================
// ENUMS FROM EXISTING TYPES
// ============================================================================

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TRADE_WORKER = 'trade_worker',
  SITE_MANAGER = 'site_manager',
  GENERAL_CONTRACTOR = 'general_contractor',
}

export enum AccessLevel {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  PRIVATE = 'private',
  ADMIN_ONLY = 'admin_only',
  TRADE_ONLY = 'trade_only',
}
