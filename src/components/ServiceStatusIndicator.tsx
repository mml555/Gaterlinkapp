import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { serviceInitializer } from '../services/serviceInitializer';

interface ServiceStatusIndicatorProps {
  visible?: boolean;
}

export const ServiceStatusIndicator: React.FC<ServiceStatusIndicatorProps> = ({ visible = true }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      const status = serviceInitializer.getInitializationStatus();
      setIsInitialized(status);
      setLastUpdate(new Date());
    };

    // Check status immediately
    checkStatus();

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Status</Text>
      <View style={styles.statusRow}>
        <Text style={styles.label}>Client-Side Services:</Text>
        <Text style={[styles.status, isInitialized ? styles.success : styles.error]}>
          {isInitialized ? '✅ Active' : '❌ Inactive'}
        </Text>
      </View>
      {lastUpdate && (
        <Text style={styles.timestamp}>
          Last Update: {lastUpdate.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    minWidth: 200,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    color: 'white',
    fontSize: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
});
