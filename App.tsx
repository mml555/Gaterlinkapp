import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';

import { store } from './src/store';
import { theme } from './src/utils/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <AuthProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <RootNavigator />
                  <FlashMessage position="top" />
                </NavigationContainer>
              </NotificationProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
