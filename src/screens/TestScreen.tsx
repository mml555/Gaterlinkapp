import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { notificationService } from '../services/notificationService';
import { firebaseService } from '../services/firebaseService';

const TestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testFirestoreAccess = async () => {
    setIsLoading(true);
    try {
      addResult('Testing Firestore access...');
      
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      // Test basic access
      const testRef = doc(db, 'users', 'test');
      await getDoc(testRef);
      addResult('✅ Basic Firestore access successful');
      
      // Test notifications collection
      const notificationsRef = doc(db, 'notifications', 'test');
      await getDoc(notificationsRef);
      addResult('✅ Notifications collection access successful');
      
    } catch (error: any) {
      addResult(`❌ Firestore access failed: ${error.code} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserAuthentication = async () => {
    setIsLoading(true);
    try {
      addResult('Testing user authentication...');
      
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (currentUser) {
        addResult(`✅ User authenticated: ${currentUser.email}`);
        addResult(`User ID: ${currentUser.id}`);
        addResult(`User role: ${currentUser.role}`);
      } else {
        addResult('❌ No authenticated user found');
      }
      
      // Test token claims
      if (firebaseService.auth.currentUser) {
        const tokenResult = await firebaseService.auth.currentUser.getIdTokenResult();
        addResult(`Token claims: ${JSON.stringify(tokenResult.claims)}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Authentication test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotificationAccess = async () => {
    setIsLoading(true);
    try {
      addResult('Testing notification access...');
      
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        addResult('❌ No authenticated user for notification test');
        return;
      }
      
      await notificationService.testNotificationAccess(currentUser.id);
      addResult('✅ Notification access test completed');
      
    } catch (error: any) {
      addResult(`❌ Notification test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserDocument = async () => {
    setIsLoading(true);
    try {
      addResult('Testing user document...');
      
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        addResult('❌ No authenticated user for document test');
        return;
      }
      
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const userRef = doc(db, 'users', currentUser.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        addResult(`✅ User document exists`);
        addResult(`Role: ${userData.role || 'not set'}`);
        addResult(`Email: ${userData.email}`);
        addResult(`Active: ${userData.isActive}`);
      } else {
        addResult('❌ User document does not exist');
      }
      
    } catch (error: any) {
      addResult(`❌ User document test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addResult('Starting comprehensive tests...');
    
    await testUserAuthentication();
    await testFirestoreAccess();
    await testUserDocument();
    await testNotificationAccess();
    
    addResult('All tests completed');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Debug Tests</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testUserAuthentication}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Authentication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testFirestoreAccess}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Firestore Access</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testUserDocument}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test User Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testNotificationAccess}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {testResults.length === 0 && (
          <Text style={styles.noResults}>No test results yet. Run a test to see results.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
    color: '#333',
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TestScreen;
