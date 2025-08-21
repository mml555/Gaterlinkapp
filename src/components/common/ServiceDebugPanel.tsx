import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { serviceInitializer } from '../../services/serviceInitializer';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { auth } from '../../config/firebase';

interface ServiceDebugPanelProps {
  visible?: boolean;
}

export const ServiceDebugPanel: React.FC<ServiceDebugPanelProps> = ({ 
  visible = false 
}) => {
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    currentUser: any;
    authReady: boolean;
  }>({
    isAuthenticated: false,
    currentUser: null,
    authReady: false
  });

  const [serviceStatus, setServiceStatus] = useState<{
    isInitialized: boolean;
    attempts: number;
    maxAttempts: number;
  }>({
    isInitialized: false,
    attempts: 0,
    maxAttempts: 3
  });

  useEffect(() => {
    const updateStatus = async () => {
      // Update service status
      const currentServiceStatus = serviceInitializer.getDetailedStatus();
      setServiceStatus(currentServiceStatus);

      // Update auth status
      try {
        const currentUser = await firebaseAuthService.getCurrentUser();
        setAuthStatus({
          isAuthenticated: !!currentUser,
          currentUser: currentUser,
          authReady: !!auth
        });
      } catch (error) {
        console.error('Error getting auth status:', error);
        setAuthStatus(prev => ({
          ...prev,
          authReady: !!auth
        }));
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReinitialize = async () => {
    try {
      await serviceInitializer.reinitialize();
    } catch (error) {
      console.error('Error reinitializing services:', error);
    }
  };

  const handleTestAuth = async () => {
    try {
      const user = await firebaseAuthService.getCurrentUser();
      console.log('Current user:', user);
      alert(`Auth test: ${user ? 'User authenticated' : 'No user'}`);
    } catch (error) {
      console.error('Auth test failed:', error);
      alert('Auth test failed');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Service Debug Panel</Text>
      
      {/* Firebase Auth Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firebase Auth Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Auth Ready:</Text>
          <View style={[styles.statusDot, { 
            backgroundColor: authStatus.authReady ? '#4CAF50' : '#F44336' 
          }]} />
          <Text style={styles.value}>{authStatus.authReady ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Authenticated:</Text>
          <View style={[styles.statusDot, { 
            backgroundColor: authStatus.isAuthenticated ? '#4CAF50' : '#F44336' 
          }]} />
          <Text style={styles.value}>{authStatus.isAuthenticated ? 'Yes' : 'No'}</Text>
        </View>
        {authStatus.currentUser && (
          <View style={styles.userInfo}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{authStatus.currentUser.id}</Text>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{authStatus.currentUser.email}</Text>
          </View>
        )}
      </View>

      {/* Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Initialized:</Text>
          <View style={[styles.statusDot, { 
            backgroundColor: serviceStatus.isInitialized ? '#4CAF50' : '#F44336' 
          }]} />
          <Text style={styles.value}>{serviceStatus.isInitialized ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Attempts:</Text>
          <Text style={styles.value}>{serviceStatus.attempts}/{serviceStatus.maxAttempts}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={handleReinitialize}>
          <Text style={styles.buttonText}>Force Reinitialize</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTestAuth}>
          <Text style={styles.buttonText}>Test Auth</Text>
        </TouchableOpacity>
      </View>

      {/* Troubleshooting Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting Tips</Text>
        <Text style={styles.tip}>
          • If services show as inactive, try the "Force Reinitialize" button
        </Text>
        <Text style={styles.tip}>
          • If auth shows as not ready, check Firebase configuration
        </Text>
        <Text style={styles.tip}>
          • Check console logs for detailed error messages
        </Text>
        <Text style={styles.tip}>
          • Ensure Firebase indexes are deployed for Firestore queries
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  userInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tip: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
});
