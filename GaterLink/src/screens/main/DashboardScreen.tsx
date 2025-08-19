import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const DashboardScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Dashboard</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Dashboard content will be implemented here
      </Text>
    </View>
  );
};

export default DashboardScreen;