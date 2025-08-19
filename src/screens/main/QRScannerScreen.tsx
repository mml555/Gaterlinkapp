import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Text as RNText,
} from 'react-native';
import { Text, Button, Card, IconButton, Switch } from 'react-native-paper';
// import { CameraScreen } from 'react-native-camera-kit';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { RootState } from '../../store';
import { scanQRCode } from '../../store/slices/doorSlice';
import { Door } from '../../types';
import TestQRCodeDisplay from '../../components/common/TestQRCodeDisplay';

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestMode, setIsTestMode] = useState(__DEV__); // Enable test mode in development
  
  const { isLoading, selectedDoor } = useSelector((state: RootState) => state.doors);

  // Check camera permissions on component mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Handle successful QR scan
  useEffect(() => {
    if (selectedDoor) {
      // Navigate to door details screen
      console.log('Navigating to door details:', selectedDoor);
    }
  }, [selectedDoor, navigation]);

  const checkCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      
      switch (result) {
        case RESULTS.UNAVAILABLE:
          setError('Camera is not available on this device');
          setHasPermission(false);
          break;
        case RESULTS.DENIED:
          setHasPermission(false);
          break;
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
          setHasPermission(true);
          setError(null);
          break;
        case RESULTS.BLOCKED:
          setError('Camera permission is blocked. Please enable it in Settings.');
          setHasPermission(false);
          break;
      }
    } catch (err) {
      console.error('Error checking camera permission:', err);
      setError('Failed to check camera permissions');
      setHasPermission(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        setHasPermission(true);
        setError(null);
      } else {
        setError('Camera permission is required to scan QR codes');
        setHasPermission(false);
      }
    } catch (err) {
      console.error('Error requesting camera permission:', err);
      setError('Failed to request camera permissions');
      setHasPermission(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRCodeRead = async (event: { data: string }) => {
    try {
      // Prevent multiple scans
      if (isScanning || isProcessing) {
        return;
      }

      setIsScanning(true);
      setIsProcessing(true);
      setScannedData(event.data);
      setError(null);

      // Validate QR code format
      if (!event.data || event.data.trim().length === 0) {
        throw new Error('Invalid QR code: Empty data');
      }

      // Log the scan for debugging (remove in production)
      console.log('QR Code scanned:', event.data);

      // Dispatch QR code scan action
      await dispatch(scanQRCode(event.data) as any);

    } catch (err: any) {
      console.error('Error processing QR code:', err);
      setError(err.message || 'Failed to process QR code');
      
      // Show error alert
      Alert.alert(
        'Scan Error',
        err.message || 'Failed to process QR code. Please try again.',
        [
          { text: 'OK', onPress: () => resetScanner() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setIsScanning(false);
    setScannedData(null);
    setError(null);
  };

  const handleScanError = (error: any) => {
    console.error('Camera scan error:', error);
    setError('Camera error occurred. Please try again.');
  };

  const openSettings = () => {
    // This would typically open the app settings
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera access in your device settings to use the QR scanner.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // In a real app, you would use Linking.openSettings()
          console.log('Should open settings');
        }}
      ]
    );
  };

  const handleTestQRCodeSelect = async (qrCode: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Simulate the same QR code processing as the camera
      await dispatch(scanQRCode(qrCode) as any);
      
    } catch (err: any) {
      console.error('Test QR code error:', err);
      setError(err.message || 'Failed to process test QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking camera permissions...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.permissionCard}>
          <Card.Content>
            <IconButton
              icon="camera-off"
              size={64}
              iconColor="#FF6B6B"
              style={styles.permissionIcon}
            />
            <Text variant="headlineSmall" style={styles.permissionTitle}>
              Camera Access Required
            </Text>
            <Text variant="bodyMedium" style={styles.permissionText}>
              {error || 'Camera permission is required to scan QR codes for door access.'}
            </Text>
            
            <View style={styles.permissionButtons}>
              <Button
                mode="contained"
                onPress={requestCameraPermission}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.permissionButton}
              >
                Grant Permission
              </Button>
              
              <Button
                mode="outlined"
                onPress={openSettings}
                style={styles.permissionButton}
              >
                Open Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Test mode display
  if (isTestMode) {
    return (
      <View style={styles.container}>
        <View style={styles.testModeHeader}>
          <Text variant="headlineSmall" style={styles.testModeTitle}>
            QR Scanner - Test Mode
          </Text>
          <View style={styles.testModeToggle}>
            <Text variant="bodyMedium">Test Mode</Text>
            <Switch
              value={isTestMode}
              onValueChange={setIsTestMode}
              color="#007AFF"
            />
          </View>
        </View>
        
        <TestQRCodeDisplay onQRCodeSelect={handleTestQRCodeSelect} />
        
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing QR Code...</Text>
          </View>
        )}
      </View>
    );
  }

  // Camera scanner
  return (
    <View style={styles.container}>
      {isScanning && (
        <View style={styles.overlay}>
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.scanningText}>Processing QR Code...</Text>
          </View>
        </View>
      )}
      
      <View style={styles.camera}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>
          Camera functionality not available
        </Text>
      </View>
      
      <View style={styles.controls}>
        <View style={styles.scanArea}>
          <Text style={styles.scanInstructions}>
            Position the QR code within the frame
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFFFFF"
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.flashlightButton}
            onPress={() => {
              // Toggle flashlight - would need to implement
              console.log('Toggle flashlight');
            }}
          >
            <IconButton
              icon="flashlight"
              size={24}
              iconColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testModeButton}
              onPress={() => setIsTestMode(true)}
            >
              <IconButton
                icon="test-tube"
                size={24}
                iconColor="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scanningIndicator: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanningText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  scanArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scanInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 16,
  },
  flashlightButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
  },
  permissionCard: {
    margin: 20,
    elevation: 4,
  },
  permissionIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButtons: {
    gap: 10,
  },
  permissionButton: {
    marginVertical: 5,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666666',
  },
  testModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  testModeTitle: {
    fontWeight: 'bold',
  },
  testModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testModeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default QRScannerScreen;
