import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList, HomeStackParamList, ChatStackParamList, ProfileStackParamList } from '../types/navigation';

// Import main screens
import HomeScreen from '../screens/main/HomeScreen';
import QRScannerScreen from '../screens/main/QRScannerScreen';
import DoorDetailsScreen from '../screens/main/DoorDetailsScreen';
import RequestHistoryScreen from '../screens/main/RequestHistoryScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SavedDoorsScreen from '../screens/main/SavedDoorsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import RequestManagementScreen from '../screens/admin/RequestManagementScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';

// Equipment screens
import EquipmentListScreen from '../screens/equipment/EquipmentListScreen';
import EquipmentDetailsScreen from '../screens/equipment/EquipmentDetailsScreen';

// Emergency screens
import EmergencyDashboardScreen from '../screens/emergency/EmergencyDashboardScreen';

// Hold screens
import HoldManagementScreen from '../screens/holds/HoldManagementScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const HomeStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ title: 'GaterLink' }}
      />
      <HomeStack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <HomeStack.Screen 
        name="DoorDetails" 
        component={DoorDetailsScreen}
        options={{ title: 'Door Details' }}
      />
      <HomeStack.Screen 
        name="RequestHistory" 
        component={RequestHistoryScreen}
        options={{ title: 'Request History' }}
      />
      <HomeStack.Screen 
        name="SavedDoors" 
        component={SavedDoorsScreen}
        options={{ title: 'Saved Doors' }}
      />
      <HomeStack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <HomeStack.Screen 
        name="RequestManagement" 
        component={RequestManagementScreen}
        options={{ title: 'Manage Requests' }}
      />
      <HomeStack.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{ title: 'Manage Users' }}
      />
      <HomeStack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <HomeStack.Screen 
        name="EquipmentList" 
        component={EquipmentListScreen}
        options={{ title: 'Equipment' }}
      />
      <HomeStack.Screen 
        name="EquipmentDetails" 
        component={EquipmentDetailsScreen}
        options={{ title: 'Equipment Details' }}
      />
      <HomeStack.Screen 
        name="EmergencyDashboard" 
        component={EmergencyDashboardScreen}
        options={{ title: 'Emergency Dashboard' }}
      />
      <HomeStack.Screen 
        name="HoldManagement" 
        component={HoldManagementScreen}
        options={{ title: 'Hold Management' }}
      />
    </HomeStack.Navigator>
  );
};

const ChatStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ChatStack.Screen 
        name="ChatList" 
        component={ChatListScreen}
        options={{ title: 'Messages' }}
      />
      <ChatStack.Screen 
        name="ChatDetail" 
        component={ChatScreen}
        options={({ route }) => ({ 
          title: route.params?.userName || 'Chat' 
        })}
      />
    </ChatStack.Navigator>
  );
};

const ProfileStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </ProfileStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" color={color} size={size} />
          ),
          tabBarBadge: undefined, // Will be set dynamically based on unread messages
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;