import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const RequestDetailsScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Request Details</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Request details will be implemented here
      </Text>
    </View>
  );
};

export default RequestDetailsScreen;