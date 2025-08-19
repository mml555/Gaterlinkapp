import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const ForgotPasswordScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Forgot Password</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Password reset form will be implemented here
      </Text>
    </View>
  );
};

export default ForgotPasswordScreen;