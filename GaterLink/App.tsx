/**
 * GaterLink - Secure Door Access Management App
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider as StoreProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { lightTheme, darkTheme } from './src/styles/theme';
import DatabaseService from './src/services/database.service';
import SyncService from './src/services/sync.service';
import ApiService from './src/services/api.service';
import { API_CONFIG } from './src/constants';
import LoggingService from './src/services/logging.service';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Initialize services
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Configure API service
      ApiService.configure(API_CONFIG.BASE_URL);

      // Initialize database
      await DatabaseService.init();
      LoggingService.info('Database initialized', 'App');

      // Start sync service
      SyncService.startSync();
      LoggingService.info('Sync service started', 'App');
    } catch (error) {
      LoggingService.error('App initialization failed', 'App', error as Error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider store={store}>
        <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={isDarkMode ? darkTheme.colors.primary : lightTheme.colors.primary}
            />
            <RootNavigator />
            <FlashMessage position="top" />
          </SafeAreaProvider>
        </PaperProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

export default App;