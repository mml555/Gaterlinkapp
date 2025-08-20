"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingTier = exports.NotificationType = exports.MessageType = exports.AccessAction = exports.EmergencyStatus = exports.EmergencySeverity = exports.EmergencyType = exports.HoldStatus = exports.ReservationStatus = exports.ChecklistType = exports.EquipmentStatus = exports.EquipmentType = exports.RequestCategory = exports.RequestPriority = exports.RequestStatus = exports.DocumentStatus = exports.DocumentType = exports.LockType = exports.AccessLevel = exports.DoorStatus = exports.DoorType = exports.PremiumFeature = exports.SiteStatus = exports.TradeType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["WORKER"] = "worker";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var TradeType;
(function (TradeType) {
    TradeType["MEP"] = "mep";
    TradeType["CARPENTRY"] = "carpentry";
    TradeType["ELECTRICAL"] = "electrical";
    TradeType["PLUMBING"] = "plumbing";
    TradeType["HVAC"] = "hvac";
    TradeType["GENERAL"] = "general";
})(TradeType || (exports.TradeType = TradeType = {}));
var SiteStatus;
(function (SiteStatus) {
    SiteStatus["ACTIVE"] = "active";
    SiteStatus["INACTIVE"] = "inactive";
    SiteStatus["MAINTENANCE"] = "maintenance";
    SiteStatus["EMERGENCY"] = "emergency";
})(SiteStatus || (exports.SiteStatus = SiteStatus = {}));
var PremiumFeature;
(function (PremiumFeature) {
    PremiumFeature["EQUIPMENT_SCHEDULING"] = "equipment_scheduling";
    PremiumFeature["TEMPORARY_HOLDS"] = "temporary_holds";
    PremiumFeature["SMART_ALERTS"] = "smart_alerts";
    PremiumFeature["API_INTEGRATIONS"] = "api_integrations";
    PremiumFeature["ADVANCED_ANALYTICS"] = "advanced_analytics";
})(PremiumFeature || (exports.PremiumFeature = PremiumFeature = {}));
var DoorType;
(function (DoorType) {
    DoorType["SITE_ENTRY"] = "site_entry";
    DoorType["SHANTY"] = "shanty";
    DoorType["UNIT_ROOM"] = "unit_room";
})(DoorType || (exports.DoorType = DoorType = {}));
var DoorStatus;
(function (DoorStatus) {
    DoorStatus["ACTIVE"] = "active";
    DoorStatus["ON_HOLD"] = "on_hold";
    DoorStatus["DISABLED"] = "disabled";
    DoorStatus["MAINTENANCE"] = "maintenance";
})(DoorStatus || (exports.DoorStatus = DoorStatus = {}));
var AccessLevel;
(function (AccessLevel) {
    AccessLevel["PUBLIC"] = "public";
    AccessLevel["RESTRICTED"] = "restricted";
    AccessLevel["PRIVATE"] = "private";
})(AccessLevel || (exports.AccessLevel = AccessLevel = {}));
var LockType;
(function (LockType) {
    LockType["QR"] = "qr";
    LockType["NFC"] = "nfc";
    LockType["PADLOCK"] = "padlock";
    LockType["SMART_LOCK"] = "smart_lock";
})(LockType || (exports.LockType = LockType = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["INSURANCE"] = "insurance";
    DocumentType["CERTIFICATION"] = "certification";
    DocumentType["SAFETY_TRAINING"] = "safety_training";
    DocumentType["WORK_PERMIT"] = "work_permit";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["VALID"] = "valid";
    DocumentStatus["EXPIRED"] = "expired";
    DocumentStatus["MISSING"] = "missing";
    DocumentStatus["PENDING_REVIEW"] = "pending_review";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "pending";
    RequestStatus["DOCUMENTATION_REQUIRED"] = "documentation_required";
    RequestStatus["IN_PROGRESS"] = "in_progress";
    RequestStatus["APPROVED"] = "approved";
    RequestStatus["DENIED"] = "denied";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["CANCELLED"] = "cancelled";
    RequestStatus["EXPIRED"] = "expired";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "low";
    RequestPriority["MEDIUM"] = "medium";
    RequestPriority["HIGH"] = "high";
    RequestPriority["URGENT"] = "urgent";
})(RequestPriority || (exports.RequestPriority = RequestPriority = {}));
var RequestCategory;
(function (RequestCategory) {
    RequestCategory["GENERAL"] = "general";
    RequestCategory["TECHNICAL"] = "technical";
    RequestCategory["BILLING"] = "billing";
    RequestCategory["ACCESS"] = "access";
    RequestCategory["MAINTENANCE"] = "maintenance";
    RequestCategory["SECURITY"] = "security";
    RequestCategory["OTHER"] = "other";
})(RequestCategory || (exports.RequestCategory = RequestCategory = {}));
var EquipmentType;
(function (EquipmentType) {
    EquipmentType["TOOLS"] = "tools";
    EquipmentType["MACHINERY"] = "machinery";
    EquipmentType["VEHICLES"] = "vehicles";
    EquipmentType["SAFETY_EQUIPMENT"] = "safety_equipment";
    EquipmentType["ELECTRONICS"] = "electronics";
    EquipmentType["OTHER"] = "other";
})(EquipmentType || (exports.EquipmentType = EquipmentType = {}));
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["AVAILABLE"] = "available";
    EquipmentStatus["IN_USE"] = "in_use";
    EquipmentStatus["MAINTENANCE"] = "maintenance";
    EquipmentStatus["OUT_OF_SERVICE"] = "out_of_service";
    EquipmentStatus["RESERVED"] = "reserved";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
var ChecklistType;
(function (ChecklistType) {
    ChecklistType["PRE_USE"] = "pre_use";
    ChecklistType["POST_USE"] = "post_use";
    ChecklistType["MAINTENANCE"] = "maintenance";
    ChecklistType["SAFETY"] = "safety";
})(ChecklistType || (exports.ChecklistType = ChecklistType = {}));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["APPROVED"] = "approved";
    ReservationStatus["DENIED"] = "denied";
    ReservationStatus["ACTIVE"] = "active";
    ReservationStatus["COMPLETED"] = "completed";
    ReservationStatus["CANCELLED"] = "cancelled";
    ReservationStatus["EXPIRED"] = "expired";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var HoldStatus;
(function (HoldStatus) {
    HoldStatus["ACTIVE"] = "active";
    HoldStatus["EXPIRED"] = "expired";
    HoldStatus["CANCELLED"] = "cancelled";
})(HoldStatus || (exports.HoldStatus = HoldStatus = {}));
var EmergencyType;
(function (EmergencyType) {
    EmergencyType["EVACUATION"] = "evacuation";
    EmergencyType["FIRE"] = "fire";
    EmergencyType["MEDICAL"] = "medical";
    EmergencyType["SECURITY"] = "security";
    EmergencyType["WEATHER"] = "weather";
    EmergencyType["OTHER"] = "other";
})(EmergencyType || (exports.EmergencyType = EmergencyType = {}));
var EmergencySeverity;
(function (EmergencySeverity) {
    EmergencySeverity["LOW"] = "low";
    EmergencySeverity["MEDIUM"] = "medium";
    EmergencySeverity["HIGH"] = "high";
    EmergencySeverity["CRITICAL"] = "critical";
})(EmergencySeverity || (exports.EmergencySeverity = EmergencySeverity = {}));
var EmergencyStatus;
(function (EmergencyStatus) {
    EmergencyStatus["ACTIVE"] = "active";
    EmergencyStatus["RESOLVED"] = "resolved";
    EmergencyStatus["CANCELLED"] = "cancelled";
})(EmergencyStatus || (exports.EmergencyStatus = EmergencyStatus = {}));
var AccessAction;
(function (AccessAction) {
    AccessAction["GRANTED"] = "granted";
    AccessAction["DENIED"] = "denied";
    AccessAction["USED"] = "used";
    AccessAction["EXPIRED"] = "expired";
    AccessAction["CANCELLED"] = "cancelled";
})(AccessAction || (exports.AccessAction = AccessAction = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["REQUEST_UPDATE"] = "request_update";
    NotificationType["NEW_MESSAGE"] = "new_message";
    NotificationType["DOOR_ACCESS"] = "door_access";
    NotificationType["EQUIPMENT_RESERVATION"] = "equipment_reservation";
    NotificationType["HOLD_NOTIFICATION"] = "hold_notification";
    NotificationType["EMERGENCY_ALERT"] = "emergency_alert";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// Pricing Tier Types
var PricingTier;
(function (PricingTier) {
    PricingTier["STARTER"] = "starter";
    PricingTier["PREMIUM"] = "premium";
    PricingTier["DEVELOPER"] = "developer";
})(PricingTier || (exports.PricingTier = PricingTier = {}));
//# sourceMappingURL=index.js.map