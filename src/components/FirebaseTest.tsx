import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { firebaseService } from '../services/firebaseService';
import { serviceInitializer } from '../services/serviceInitializer';

const FirebaseTest: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      setUserInfo(currentUser);
      
      const userPermissions = await firebaseAuthService.checkUserPermissions();
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFirestorePermissions = async () => {
    setIsLoading(true);
    addTestResult('Testing Firestore permissions...');
    
    try {
      // Test basic read permission
      const testQuery = firebaseService.firestore
        .collection('notifications')
        .where('userId', '==', userInfo?.id || 'test')
        .limit(1);

      const snapshot = await testQuery.get();
      addTestResult(`✅ Firestore read test passed. Found ${snapshot.docs.length} documents`);
      
      // Test real-time listener
      const unsubscribe = testQuery.onSnapshot(
        (snapshot) => {
          addTestResult(`✅ Firestore real-time listener working. ${snapshot.docs.length} documents`);
        },
        (error: any) => {
          addTestResult(`❌ Firestore real-time listener failed: ${error.code} - ${error.message}`);
        }
      );

      // Clean up listener after 5 seconds
      setTimeout(() => {
        unsubscribe();
        addTestResult('✅ Firestore listener cleanup completed');
      }, 5000);

    } catch (error: any) {
      addTestResult(`❌ Firestore test failed: ${error.code} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserToken = async () => {
    setIsLoading(true);
    addTestResult('Refreshing user token...');
    
    try {
      const newToken = await firebaseAuthService.refreshUserToken();
      if (newToken) {
        addTestResult('✅ Token refreshed successfully');
        await checkUserStatus(); // Refresh the display
      } else {
        addTestResult('❌ Token refresh failed');
      }
    } catch (error: any) {
      addTestResult(`❌ Token refresh error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testServiceInitialization = async () => {
    setIsLoading(true);
    addTestResult('Testing service initialization...');
    
    try {
      await serviceInitializer.initializeServices();
      const status = serviceInitializer.getDetailedStatus();
      addTestResult(`✅ Service initialization completed. Status: ${JSON.stringify(status)}`);
    } catch (error: any) {
      addTestResult(`❌ Service initialization failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Debug Panel</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        {userInfo ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>ID: {userInfo.id}</Text>
            <Text style={styles.infoText}>Email: {userInfo.email}</Text>
            <Text style={styles.infoText}>Role: {userInfo.role}</Text>
            <Text style={styles.infoText}>Name: {userInfo.firstName} {userInfo.lastName}</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No user information available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions & Claims</Text>
        {permissions ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>UID: {permissions.uid}</Text>
            <Text style={styles.infoText}>Custom Claims: {JSON.stringify(permissions.customClaims)}</Text>
            <Text style={styles.infoText}>Permissions: {permissions.permissions.join(', ')}</Text>
            <Text style={styles.infoText}>Token: {permissions.token.substring(0, 20)}...</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No permissions information available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testFirestorePermissions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Firestore Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={refreshUserToken}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Refresh User Token</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testServiceInitialization}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Service Initialization</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearTestResults}
        >
          <Text style={styles.buttonText}>Clear Test Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testResults.length > 0 ? (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))
        ) : (
          <Text style={styles.infoText}>No test results yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default FirebaseTest;
