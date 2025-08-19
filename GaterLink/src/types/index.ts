// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Door and Access Types
export interface Door {
  id: string;
  name: string;
  location: string;
  qrCode: string;
  lastAccessed?: Date;
  isSaved?: boolean;
}

export interface ScanHistory {
  id: string;
  doorId: string;
  userId: string;
  timestamp: Date;
  status: 'success' | 'failed';
}

// Request Types
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RequestPriority = 'low' | 'medium' | 'high';
export type RequestCategory = 'general' | 'technical' | 'billing' | 'other';

export interface AccessRequest {
  id: string;
  userId: string;
  doorId?: string;
  name: string;
  phone: string;
  reason: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: RequestCategory;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  adminNotes?: string;
}

// Chat Types
export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
  };
}

export interface ChatRoom {
  id: string;
  requestId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'status_update' | 'general';
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// App Settings Types
export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  language: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Scanner: undefined;
  RequestDetails: { requestId: string };
  Chat: { chatRoomId: string };
  Profile: undefined;
  Settings: undefined;
  AdminDashboard: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  Scanner: undefined;
  Messages: undefined;
  Profile: undefined;
};