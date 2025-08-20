import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';

import { store, persistor } from './src/store';
import { theme } from './src/utils/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import 'react-native-reanimated';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <AuthProvider>
                <NotificationProvider>
                  <NavigationContainer>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <RootNavigator />
                    <FlashMessage position="top" />
                  </NavigationContainer>
                </NotificationProvider>
              </AuthProvider>
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

export default App;
