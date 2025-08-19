import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

const TestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>GaterLink Native</Text>
        <Text style={styles.subtitle}>React Native App</Text>
        <Text style={styles.description}>
          Successfully migrated from Expo to React Native CLI!
        </Text>
        <Button 
          mode="contained" 
          onPress={() => console.log('Button pressed!')}
          style={styles.button}
        >
          Test Button
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 32,
  },
});

export default TestScreen;
