// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://api.gaterlink.com',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  // Add your Firebase config here
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// App Constants
export const APP_CONSTANTS = {
  APP_NAME: 'GaterLink',
  BUNDLE_ID: 'com.gaterlink.app',
  VERSION: '1.0.0',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@gaterlink_auth_token',
  USER_DATA: '@gaterlink_user_data',
  APP_SETTINGS: '@gaterlink_settings',
  BIOMETRIC_ENABLED: '@gaterlink_biometric',
  FIRST_LAUNCH: '@gaterlink_first_launch',
  FCM_TOKEN: '@gaterlink_fcm_token',
  BIOMETRIC_SETTINGS: '@gaterlink_biometric_settings',
  SECURITY_CONFIG: '@gaterlink_security_config',
  SESSION_DATA: '@gaterlink_session_data',
  LOGIN_ATTEMPTS: '@gaterlink_login_attempts',
  PRIVACY_SETTINGS: '@gaterlink_privacy_settings',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Request Priority
export const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Request Category
export const REQUEST_CATEGORY = {
  GENERAL: 'general',
  TECHNICAL: 'technical',
  BILLING: 'billing',
  OTHER: 'other',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  STATUS_UPDATE: 'status_update',
  GENERAL: 'general',
} as const;

// Theme Colors
export const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#64B5F6',
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFB74D',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  white: '#FFFFFF',
  black: '#000000',
};

// Dark Theme Colors
export const DARK_COLORS = {
  primary: '#64B5F6',
  primaryDark: '#42A5F5',
  primaryLight: '#90CAF9',
  secondary: '#FFB74D',
  secondaryDark: '#FFA726',
  secondaryLight: '#FFCC80',
  success: '#81C784',
  error: '#E57373',
  warning: '#FFD54F',
  info: '#64B5F6',
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  background: '#121212',
  surface: '#1E1E1E',
  border: '#424242',
  disabled: '#616161',
  white: '#FFFFFF',
  black: '#000000',
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 999,
};

// Animation Durations
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_NOT_FOUND: 'User not found.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  REQUIRED_FIELD: 'This field is required.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to scan QR codes.',
  BIOMETRIC_NOT_ENROLLED: 'Please enroll biometric authentication in your device settings.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  REQUEST_CREATED: 'Request created successfully.',
  REQUEST_UPDATED: 'Request updated successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_RESET_SENT: 'Password reset email sent.',
  DOOR_SAVED: 'Door saved successfully.',
  SCAN_SUCCESS: 'QR code scanned successfully.',
};

// Screen Names
export const SCREENS = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Stack
  HOME: 'Home',
  SCANNER: 'Scanner',
  REQUEST_DETAILS: 'RequestDetails',
  CHAT: 'Chat',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  
  // Admin Stack
  ADMIN_DASHBOARD: 'AdminDashboard',
  USER_MANAGEMENT: 'UserManagement',
  ANALYTICS: 'Analytics',
  
  // Tab Navigator
  DASHBOARD: 'Dashboard',
  REQUESTS: 'Requests',
  MESSAGES: 'Messages',
};

// Permissions
export const PERMISSIONS = {
  CAMERA: 'camera',
  NOTIFICATIONS: 'notifications',
  BIOMETRICS: 'biometrics',
};