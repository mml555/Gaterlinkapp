import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const MessagesScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Messages</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Message list will be implemented here
      </Text>
    </View>
  );
};

export default MessagesScreen;