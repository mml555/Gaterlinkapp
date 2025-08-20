# Door Types & Data Model Architecture

## Overview

The GaterLink app implements a sophisticated door access control system with three distinct door types, each serving specific purposes in construction site management. This architecture provides comprehensive access control, work order management, and digital blue taping functionality.

## 🏗️ Architecture Overview

```
Door Types System
├── Site Doors (Main Entry Points)
├── Shanty Doors (Pre-configured Access)
└── Apartment QR Codes (Digital Blue Taping)
    ├── Work Order Management
    ├── Trade Assignment System
    └── Photo Documentation
```

## 🚪 Door Type 1: Site Doors

### Purpose
Site doors serve as the main entry points to construction sites. They implement a sophisticated access control system that requires users to "sign in" to the site before accessing other doors.

### Key Features

#### **Site Sign-in System**
- **Primary Function**: Users must scan the site door QR code to register their presence on site
- **Profile Completion**: If user profile is incomplete, they're redirected to complete it
- **Temporary Access**: Allows temporary access for visitors with incomplete profiles
- **Site Registration**: Automatically registers user as "signed into site" for other door access

#### **Access Control Logic**
```typescript
// Site door access flow
1. User scans site door QR code
2. System checks user profile completion
3. If profile incomplete → Redirect to profile completion
4. If profile complete → Grant site access and register sign-in
5. User can now access other doors on the site
```

#### **Configuration Options**
- `requiresSiteSignin`: Whether users must sign in to access other doors
- `allowsProfileCompletion`: Whether incomplete profiles can be completed on-site
- `maxTemporaryAccessHours`: Maximum temporary access duration
- `requiresApproval`: Whether site access requires approval

### Data Model
```typescript
interface SiteDoor {
  id: string;
  type: DoorType.SITE;
  name: string;
  siteName: string;
  location: string;
  qrCode: string;
  requiresSiteSignin: boolean;
  allowsProfileCompletion: boolean;
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
}
```

## 🔐 Door Type 2: Shanty Doors

### Purpose
Shanty doors represent pre-configured access points within construction sites. These doors have specific access profiles and can use different lock types (padlock or NFC).

### Key Features

#### **Lock Type Support**
- **Padlock Doors**: Provide combination codes for mechanical locks
- **NFC Doors**: Support digital keys for Apple Wallet and Google Wallet
- **Hybrid Support**: Some doors support both lock types

#### **Access Profile System**
- **Pre-configured**: Admin uploads door profiles with access information
- **Role-based Access**: Different user roles have different access levels
- **Time-limited Access**: Configurable access duration limits
- **Approval Requirements**: Some doors require explicit approval

#### **NFC Key Management**
```typescript
// NFC key types
- Single Use: One-time access keys
- Permanent: Long-term access keys
- Temporary: Time-limited access keys
```

#### **Access Control Logic**
```typescript
// Shanty door access flow
1. User scans shanty door QR code
2. System checks if user is signed into site
3. If not signed in → Redirect to site sign-in
4. If signed in → Check approval requirements
5. If approved → Provide access information (combination/NFC key)
```

### Data Model
```typescript
interface ShantyDoor {
  id: string;
  type: DoorType.SHANTY;
  name: string;
  siteName: string;
  lockType: LockType;
  lockConfiguration: PadlockConfig | NFCLockConfig;
  accessProfile: {
    doorName: string;
    site: string;
    accessLevel: AccessLevel;
    allowedUserRoles: UserRole[];
    requiresApproval: boolean;
    maxAccessDuration?: number;
  };
}

interface PadlockConfig {
  lockType: LockType.PADLOCK;
  combination: string;
  instructions?: string;
  emergencyOverride?: string;
}

interface NFCLockConfig {
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
```

## 🏢 Door Type 3: Apartment QR Codes

### Purpose
Apartment QR codes implement a digital blue taping system where general contractors and site managers can manage work orders, assign trades, and track progress for individual apartment units.

### Key Features

#### **Digital Blue Taping System**
- **Work Order Management**: Create and track work orders for each apartment
- **Photo Documentation**: Before/after photos and progress documentation
- **Trade Assignment**: Assign specific trades to work orders
- **Priority Management**: Set priorities for different work items
- **Status Tracking**: Track work order completion status

#### **Trade Selection System**
- **Flexible Assignment**: Trades can choose work orders regardless of profile designation
- **Multi-trade Support**: Multiple trades can work on the same apartment
- **Priority-based Display**: Work orders displayed by priority
- **Real-time Updates**: Status updates in real-time

#### **Apartment Status Management**
- **Construction Phases**: Track apartment through construction phases
- **Temporary Shutdown**: Mark apartments as temporarily shut with reasons
- **Access Control**: Control access based on apartment status

#### **Work Order Features**
```typescript
// Work order capabilities
- Title and description
- Priority levels (Low, Medium, High, Urgent, Critical)
- Status tracking (Pending, In Progress, On Hold, Completed, Verified)
- Trade type assignment
- Photo documentation with categories
- Notes and comments
- Time tracking (estimated vs actual hours)
- Due dates and completion tracking
```

### Data Model
```typescript
interface ApartmentQRCode {
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
  apartmentInfo: {
    unitType: string;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    status: ApartmentStatus;
  };
  workOrders: WorkOrder[];
  tradeAssignments: TradeAssignment[];
}

interface WorkOrder {
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
```

## 🔄 Access Control Flow

### Site Door Flow
```
User scans site door QR
    ↓
Check profile completion
    ↓
If incomplete → Redirect to profile completion
    ↓
If complete → Grant access and register site sign-in
    ↓
User can now access other doors
```

### Shanty Door Flow
```
User scans shanty door QR
    ↓
Check if signed into site
    ↓
If not signed in → Redirect to site sign-in
    ↓
If signed in → Check approval requirements
    ↓
If approved → Provide access information
    ↓
User gets combination or NFC key
```

### Apartment QR Flow
```
User scans apartment QR
    ↓
Check if apartment is shut
    ↓
If shut → Show shutdown message
    ↓
If active → Check site sign-in
    ↓
If signed in → Show work orders
    ↓
User selects trade and work orders
```

## 🛡️ Security & Access Control

### User Roles
```typescript
enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TRADE_WORKER = 'trade_worker',
  SITE_MANAGER = 'site_manager',
  GENERAL_CONTRACTOR = 'general_contractor',
}
```

### Access Levels
```typescript
enum AccessLevel {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  PRIVATE = 'private',
  ADMIN_ONLY = 'admin_only',
  TRADE_ONLY = 'trade_only',
}
```

### Access Status
```typescript
enum AccessStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING_APPROVAL = 'pending_approval',
  REQUIRES_SITE_SIGNIN = 'requires_site_signin',
  REQUIRES_PROFILE_COMPLETION = 'requires_profile_completion',
}
```

## 📱 NFC Key Management

### Key Types
- **Single Use**: One-time access, expires after use
- **Permanent**: Long-term access, no expiration
- **Temporary**: Time-limited access with configurable duration

### Wallet Integration
- **Apple Wallet**: iOS device integration
- **Google Wallet**: Android device integration
- **Encryption**: Secure key data transmission

### Key Lifecycle
```
Generate NFC Key
    ↓
Add to Wallet
    ↓
Use for Access
    ↓
Track Usage
    ↓
Revoke if needed
```

## 🏗️ Site Management

### Site Configuration
- **Project Information**: Type, dates, unit counts
- **Access Rules**: Sign-in requirements, profile completion
- **Emergency Contacts**: Site manager and emergency information
- **Geographic Data**: Coordinates and address information

### Site Hierarchy
```
Site
├── Site Doors (Entry points)
├── Shanty Doors (Internal access)
└── Apartment QR Codes (Unit-specific)
```

## 📊 Work Order Management

### Trade Types
```typescript
enum TradeType {
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
```

### Work Order Status
```typescript
enum WorkOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  VERIFIED = 'verified',
}
```

### Photo Documentation
```typescript
enum PhotoCategory {
  BEFORE = 'before',
  AFTER = 'after',
  ISSUE = 'issue',
  PROGRESS = 'progress',
  COMPLETION = 'completion',
}
```

## 🔧 Implementation Details

### Service Layer
- **DoorService**: Handles all door operations and access control
- **QR Code Validation**: Validates and processes QR code scans
- **Access Control**: Manages user permissions and access rules
- **Work Order Management**: Handles work order CRUD operations
- **NFC Key Generation**: Creates and manages NFC keys

### State Management
- **Redux Store**: Centralized state management
- **Door Collections**: Separate collections for each door type
- **Work Orders**: Organized by apartment and trade
- **User Profile**: Manages user information and completion status
- **Site Sign-in**: Tracks user site access status

### Data Flow
```
QR Code Scan
    ↓
Service Validation
    ↓
Access Control Check
    ↓
State Update
    ↓
UI Response
```

## 🚀 Future Enhancements

### Planned Features
- **Real-time Updates**: Live work order status updates
- **Offline Support**: Work without internet connection
- **Advanced Analytics**: Site progress and efficiency metrics
- **Integration APIs**: Connect with external construction management systems
- **Mobile Wallet**: Enhanced NFC key management
- **Voice Commands**: Hands-free operation
- **AR Integration**: Augmented reality for work order visualization

### Scalability Considerations
- **Multi-site Support**: Manage multiple construction sites
- **User Management**: Advanced user role and permission system
- **Data Export**: Export work order and access data
- **API Integration**: Connect with external systems
- **Performance Optimization**: Handle large numbers of doors and work orders

## 📋 Usage Examples

### Site Door Usage
```typescript
// Scan site door
const result = await doorService.scanQRCode('SITE_MAIN_ENTRANCE_001', userId, userProfile);

if (result.success) {
  // User is now signed into site
  console.log('Access granted to site');
} else {
  // Handle access requirements
  console.log('Access requirements:', result.requiredActions);
}
```

### Shanty Door Usage
```typescript
// Scan shanty door
const result = await doorService.scanQRCode('SHANTY_ELECTRICAL_001', userId, userProfile);

if (result.success) {
  // Provide access information
  if (result.door.lockType === LockType.PADLOCK) {
    console.log('Combination:', result.door.lockConfiguration.combination);
  } else if (result.door.lockType === LockType.NFC_LOCK) {
    // Generate NFC key
    const nfcKey = await doorService.generateNFCKey(userId, result.door.id, NFCKeyType.SINGLE_USE);
  }
}
```

### Apartment QR Usage
```typescript
// Scan apartment QR
const result = await doorService.scanQRCode('APT_101_001', userId, userProfile);

if (result.success) {
  // Show work orders
  const workOrders = await doorService.getWorkOrdersByApartment(result.door.id);
  console.log('Available work orders:', workOrders);
}
```

This architecture provides a comprehensive solution for construction site access control, work order management, and digital blue taping, with robust security, scalability, and user experience considerations.
