import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const AnalyticsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">AnalyticsScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default AnalyticsScreen;

