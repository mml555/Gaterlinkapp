import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TestScreen from './src/screens/TestScreen';

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

function App(): React.JSX.Element {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <TestScreen />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
