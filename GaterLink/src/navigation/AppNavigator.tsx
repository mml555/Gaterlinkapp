import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import RequestDetailsScreen from '../screens/main/RequestDetailsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import { SCREENS } from '../constants';

export type AppStackParamList = {
  Main: undefined;
  [SCREENS.REQUEST_DETAILS]: { requestId: string };
  [SCREENS.CHAT]: { chatRoomId: string; requestId?: string };
  [SCREENS.SETTINGS]: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name={SCREENS.REQUEST_DETAILS}
        component={RequestDetailsScreen}
        options={{
          headerShown: true,
          title: 'Request Details',
        }}
      />
      <Stack.Screen
        name={SCREENS.CHAT}
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
        }}
      />
      <Stack.Screen
        name={SCREENS.SETTINGS}
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;