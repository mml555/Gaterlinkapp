import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import DashboardScreen from '../screens/main/DashboardScreen';
import RequestsScreen from '../screens/main/RequestsScreen';
import ScannerScreen from '../screens/main/ScannerScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { SCREENS } from '../constants';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export type TabParamList = {
  [SCREENS.DASHBOARD]: undefined;
  [SCREENS.REQUESTS]: undefined;
  [SCREENS.SCANNER]: undefined;
  [SCREENS.MESSAGES]: undefined;
  [SCREENS.PROFILE]: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name={SCREENS.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: isAdmin ? 'Admin Dashboard' : 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.REQUESTS}
        component={RequestsScreen}
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.SCANNER}
        component={ScannerScreen}
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Icon name="qrcode-scan" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.MESSAGES}
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-text" color={color} size={size} />
          ),
          tabBarBadge: undefined, // Will be updated with unread count
        }}
      />
      <Tab.Screen
        name={SCREENS.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;