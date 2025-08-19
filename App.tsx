import React from 'react';
import { StatusBar } from 'react-native';
<<<<<<< Updated upstream
import { Provider as PaperProvider } from 'react-native-paper';
=======
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
>>>>>>> Stashed changes
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TestScreen from './src/screens/TestScreen';

<<<<<<< Updated upstream
// Simple theme for now
const theme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    onBackground: '#000000',
    onSurface: '#000000',
    onSurfaceVariant: '#666666',
  },
};
=======
import { store, persistor } from './src/store';
import { theme } from './src/utils/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
>>>>>>> Stashed changes

function App(): React.JSX.Element {
  return (
<<<<<<< Updated upstream
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <TestScreen />
      </SafeAreaProvider>
    </PaperProvider>
=======
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
>>>>>>> Stashed changes
  );
}

export default App;
