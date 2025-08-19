import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const RequestsScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Requests</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Request list will be implemented here
      </Text>
    </View>
  );
};

export default RequestsScreen;