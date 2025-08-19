import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const RegisterScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Register Screen</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Registration form will be implemented here
      </Text>
    </View>
  );
};

export default RegisterScreen;