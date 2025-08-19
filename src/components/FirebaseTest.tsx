import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { auth, db } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  const testFirebaseConnection = async () => {
    try {
      setStatus('Testing Firebase connection...');
      setError(null);

      // Test Authentication
      setStatus('Testing Authentication...');
      const userCredential = await signInAnonymously(auth);
      console.log('Auth test successful:', userCredential.user.uid);

      // Test Firestore
      setStatus('Testing Firestore...');
      const querySnapshot = await getDocs(collection(db, 'users'));
      console.log('Firestore test successful:', querySnapshot.size, 'documents found');

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
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Configuration Test</Text>
      <Text style={styles.status}>{status}</Text>
      {error && <Text style={styles.error}>Error: {error}</Text>}
      <Button 
        mode="contained" 
        onPress={testFirebaseConnection}
        style={styles.button}
      >
        Test Again
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});

export default FirebaseTest;
