import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { globalStyles } from '../styles/global';

const LoadingScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[globalStyles.centerContainer, { backgroundColor: theme.colors.background }]}>
      <Icon name="shield-lock" size={80} color={theme.colors.primary} />
      <Text variant="headlineLarge" style={{ marginTop: 16, marginBottom: 32 }}>
        GaterLink
      </Text>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

export default LoadingScreen;