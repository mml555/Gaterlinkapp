import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { serviceInitializer } from '../../services/serviceInitializer';

interface ServiceStatusIndicatorProps {
  showDetails?: boolean;
}

export const ServiceStatusIndicator: React.FC<ServiceStatusIndicatorProps> = ({ 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<{
    isInitialized: boolean;
    attempts: number;
    maxAttempts: number;
  }>({
    isInitialized: false,
    attempts: 0,
    maxAttempts: 3
  });

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = serviceInitializer.getDetailedStatus();
      setStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReinitialize = async () => {
    try {
      await serviceInitializer.reinitialize();
    } catch (error) {
      console.error('Error reinitializing services:', error);
    }
  };

  const getStatusColor = () => {
    if (status.isInitialized) {
      return '#4CAF50'; // Green
    } else if (status.attempts >= status.maxAttempts) {
      return '#F44336'; // Red
    } else {
      return '#FF9800'; // Orange
    }
  };

  const getStatusText = () => {
    if (status.isInitialized) {
      return 'Active';
    } else if (status.attempts >= status.maxAttempts) {
      return 'Failed';
    } else {
      return `Initializing (${status.attempts + 1}/${status.maxAttempts})`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>Client Services: {getStatusText()}</Text>
        <TouchableOpacity 
          style={styles.reinitButton} 
          onPress={handleReinitialize}
        >
          <Text style={styles.reinitButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>
            Initialization Attempts: {status.attempts}/{status.maxAttempts}
          </Text>
          <Text style={styles.detailsText}>
            Status: {status.isInitialized ? 'Initialized' : 'Not Initialized'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  reinitButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reinitButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
