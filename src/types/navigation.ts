import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: { email: string; type: 'register' | 'reset-password' };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  QRScanner: undefined;
  DoorDetails: { doorId: string };
  RequestHistory: undefined;
  SavedDoors: undefined;
  AdminDashboard: undefined;
  RequestManagement: undefined;
  UserManagement: undefined;
  Analytics: undefined;
};

// Chat Stack
export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; userName?: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Notifications: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Navigation Prop Types
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>;
export type ChatNavigationProp = StackNavigationProp<ChatStackParamList>;
export type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList>;
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// Route Prop Types
export type LoginRouteProp = RouteProp<AuthStackParamList, 'Login'>;
export type RegisterRouteProp = RouteProp<AuthStackParamList, 'Register'>;
export type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;
export type VerificationRouteProp = RouteProp<AuthStackParamList, 'Verification'>;
export type DoorDetailsRouteProp = RouteProp<HomeStackParamList, 'DoorDetails'>;
export type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;