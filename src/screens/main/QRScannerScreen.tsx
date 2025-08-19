import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const QRScannerScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">QR Scanner Screen</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Camera implementation coming soon
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  subtitle: {
    marginTop: 10,
    color: '#666666',
  },
});

export default QRScannerScreen;