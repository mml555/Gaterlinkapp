import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { auth, db } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTestScreen: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>({});

  const testFirebaseConnection = async () => {
    try {
      setStatus('Testing Firebase connection...');
      setError(null);
      setTestResults({});

      // Test Authentication
      setStatus('Testing Authentication...');
      const userCredential = await signInAnonymously(auth);
      console.log('Auth test successful:', userCredential.user.uid);
      setTestResults(prev => ({ ...prev, auth: '✅ Success' }));

      // Test Firestore
      setStatus('Testing Firestore...');
      const querySnapshot = await getDocs(collection(db, 'users'));
      console.log('Firestore test successful:', querySnapshot.size, 'documents found');
      setTestResults(prev => ({ ...prev, firestore: '✅ Success' }));

      setStatus('✅ Firebase configuration is working!');
    } catch (err: any) {
      console.error('Firebase test failed:', err);
      setError(err.message);
      setStatus('❌ Firebase test failed');
    }
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Firebase Configuration Test</Text>
          <Text style={styles.subtitle}>Testing your Firebase setup</Text>
        </View>

        <Card style={styles.statusCard}>
          <Card.Content>
            <Text style={styles.statusTitle}>Status</Text>
            <Text style={styles.status}>{status}</Text>
            {error && <Text style={styles.error}>Error: {error}</Text>}
          </Card.Content>
        </Card>

        {Object.keys(testResults).length > 0 && (
          <Card style={styles.resultsCard}>
            <Card.Content>
              <Text style={styles.resultsTitle}>Test Results</Text>
              {Object.entries(testResults).map(([test, result]) => (
                <View key={test} style={styles.resultItem}>
                  <Text style={styles.resultLabel}>{test}:</Text>
                  <Text style={styles.resultValue}>{String(result)}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        <Button 
          mode="contained" 
          onPress={testFirebaseConnection}
          style={styles.button}
          icon="refresh"
        >
          Test Again
        </Button>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Firebase Services</Text>
            <View style={styles.serviceItem}>
              <MaterialIcons name="security" size={20} color={theme.colors.primary} />
              <Text style={styles.serviceText}>Authentication</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialIcons name="storage" size={20} color={theme.colors.primary} />
              <Text style={styles.serviceText}>Firestore Database</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialIcons name="cloud-upload" size={20} color={theme.colors.primary} />
              <Text style={styles.serviceText}>Storage</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialIcons name="analytics" size={20} color={theme.colors.primary} />
              <Text style={styles.serviceText}>Analytics</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  statusCard: {
    margin: 24,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
  },
  resultsCard: {
    margin: 24,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultValue: {
    fontSize: 14,
  },
  button: {
    margin: 24,
    marginBottom: 16,
  },
  infoCard: {
    margin: 24,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default FirebaseTestScreen;
