import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const ProfileScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Profile</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        User profile will be implemented here
      </Text>
    </View>
  );
};

export default ProfileScreen;