import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const SettingsScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Settings</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        App settings will be implemented here
      </Text>
    </View>
  );
};

export default SettingsScreen;