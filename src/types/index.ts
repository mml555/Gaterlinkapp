// User Types
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
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  badgeEnabled: boolean;
}

// Door Types
export interface Door {
  id: string;
  name: string;
  location: string;
  qrCode: string;
  description?: string;
  isActive: boolean;
  accessLevel: AccessLevel;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export enum AccessLevel {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  PRIVATE = 'private',
}

// Request Types
export interface AccessRequest {
  id: string;
  userId: string;
  doorId: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: RequestCategory;
  title: string;
  description: string;
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  assignedTo?: string;
  notes?: string;
  attachments?: string[];
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

export enum RequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  DENIED = 'denied',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum RequestCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCESS = 'access',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  OTHER = 'other',
}

// Chat Types
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

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
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
  requestId: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication Types
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
}

// API Response Types
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

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  QRScanner: undefined;
  DoorDetails: { doorId: string };
  RequestDetails: { requestId: string };
  NewRequest: undefined;
  Chat: { chatId: string };
  Profile: undefined;
  Settings: undefined;
  AdminDashboard: undefined;
  UserManagement: undefined;
  Analytics: undefined;
};

// App State Types
export interface AppState {
  auth: AuthState;
  doors: DoorState;
  requests: RequestState;
  chat: ChatState;
  notifications: NotificationState;
}

export interface DoorState {
  doors: Door[];
  savedDoors: Door[];
  isLoading: boolean;
  error: string | null;
  selectedDoor: Door | null;
}

export interface RequestState {
  requests: AccessRequest[];
  userRequests: AccessRequest[];
  isLoading: boolean;
  error: string | null;
  selectedRequest: AccessRequest | null;
  filters: RequestFilters;
}

export interface RequestFilters {
  status?: RequestStatus[];
  priority?: RequestPriority[];
  category?: RequestCategory[];
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

export enum NotificationType {
  REQUEST_UPDATE = 'request_update',
  NEW_MESSAGE = 'new_message',
  DOOR_ACCESS = 'door_access',
  SYSTEM = 'system',
}

// Utility Types
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

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RequestForm {
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
}

// Analytics Types
export interface AnalyticsData {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  averageResponseTime: number;
  requestsByCategory: Record<RequestCategory, number>;
  requestsByStatus: Record<RequestStatus, number>;
  requestsByPriority: Record<RequestPriority, number>;
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  requests: number;
  completed: number;
  averageResponseTime: number;
}
