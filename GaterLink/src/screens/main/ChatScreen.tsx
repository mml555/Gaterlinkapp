import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { globalStyles } from '../../styles/global';

const ChatScreen: React.FC = () => {
  return (
    <View style={globalStyles.centerContainer}>
      <Text variant="headlineMedium">Chat</Text>
      <Text variant="bodyMedium" style={{ marginTop: 16 }}>
        Chat interface will be implemented here
      </Text>
    </View>
  );
};

export default ChatScreen;