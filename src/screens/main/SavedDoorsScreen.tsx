import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const SavedDoorsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">SavedDoorsScreen</Text>
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

export default SavedDoorsScreen;
