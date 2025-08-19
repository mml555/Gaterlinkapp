import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const ScannerScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">QR Scanner</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        QR code scanner will be implemented here
      </Text>
    </View>
  );
};

export default ScannerScreen;