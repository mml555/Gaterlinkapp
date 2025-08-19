import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  CameraDevice,
  Code,
} from 'react-native-vision-camera';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store';
import { addSavedDoor, updateDoorLastAccessed } from '../../store/slices/doorsSlice';
import DatabaseService from '../../services/database.service';
import ApiService from '../../services/api.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants';
import { Door, ScanHistory } from '../../types';

const ScannerScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const devices = useCameraDevices();
  const device = devices.back;
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScan, setRecentScan] = useState<string | null>(null);
  
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsScanning(true);
      return () => {
        setIsScanning(false);
      };
    }, [])
  );

  const checkCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      setHasPermission(result === RESULTS.GRANTED);
      
      if (result !== RESULTS.GRANTED) {
        LoggingService.warn('Camera permission denied', 'Scanner');
      }
    } catch (error) {
      LoggingService.error('Failed to check camera permission', 'Scanner', error as Error);
      setHasPermission(false);
    }
  };

  const openSettings = () => {
    Alert.alert(
      'Camera Permission Required',
      ERROR_MESSAGES.CAMERA_PERMISSION_DENIED,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes: Code[]) => {
      if (!isScanning || isProcessing || codes.length === 0) return;
      
      const code = codes[0];
      if (code.value && code.value !== recentScan) {
        handleQRCodeScanned(code.value);
      }
    },
  });

  const handleQRCodeScanned = async (data: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setRecentScan(data);
    
    // Vibrate on scan
    if (Platform.OS === 'ios') {
      Vibration.vibrate();
    } else {
      Vibration.vibrate(100);
    }
    
    LoggingService.info('QR code scanned', 'Scanner', { data });
    
    try {
      // Check if it's a valid door QR code
      const door = await validateDoorQRCode(data);
      
      if (door) {
        await processDoorAccess(door);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not recognized as a valid door access code.');
      }
    } catch (error) {
      LoggingService.error('Failed to process QR code', 'Scanner', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsProcessing(false);
      // Reset recent scan after 3 seconds to allow rescanning
      scanTimeoutRef.current = setTimeout(() => {
        setRecentScan(null);
      }, 3000);
    }
  };

  const validateDoorQRCode = async (qrCode: string): Promise<Door | null> => {
    try {
      // First check local database
      let door = await DatabaseService.getDoorByQRCode(qrCode);
      
      if (!door) {
        // If not found locally, check with API
        const response = await ApiService.get<Door>(`/api/doors/validate/${qrCode}`);
        
        if (response.success && response.data) {
          door = response.data;
          // Save to local database
          await DatabaseService.saveDoor(door);
        }
      }
      
      return door;
    } catch (error) {
      LoggingService.error('Door validation failed', 'Scanner', error as Error);
      return null;
    }
  };

  const processDoorAccess = async (door: Door) => {
    try {
      // Update last accessed time
      const now = new Date();
      await DatabaseService.updateDoorLastAccessed(door.id);
      dispatch(updateDoorLastAccessed({ id: door.id, timestamp: now }));
      
      // Save scan history
      const scanHistory: ScanHistory = {
        id: `scan_${Date.now()}`,
        doorId: door.id,
        userId: user!.id,
        timestamp: now,
        status: 'success',
      };
      await DatabaseService.saveScanHistory(scanHistory);
      
      // Send access request to API
      const response = await ApiService.post('/api/doors/access', {
        doorId: door.id,
        timestamp: now,
      });
      
      if (response.success) {
        Alert.alert(
          'Access Granted',
          `Successfully accessed ${door.name}`,
          [
            {
              text: 'OK',
              onPress: () => setIsScanning(true),
            },
            {
              text: 'Save Door',
              onPress: () => saveDoor(door),
            },
          ]
        );
      } else {
        Alert.alert('Access Denied', 'You do not have permission to access this door.');
      }
    } catch (error) {
      LoggingService.error('Door access failed', 'Scanner', error as Error);
      Alert.alert('Error', 'Failed to process door access. Please try again.');
    }
  };

  const saveDoor = async (door: Door) => {
    try {
      const savedDoor = { ...door, isSaved: true };
      await DatabaseService.saveDoor(savedDoor);
      dispatch(addSavedDoor(savedDoor));
      Alert.alert('Success', SUCCESS_MESSAGES.DOOR_SAVED);
    } catch (error) {
      LoggingService.error('Failed to save door', 'Scanner', error as Error);
      Alert.alert('Error', 'Failed to save door. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Checking camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={globalStyles.centerContainer}>
        <Icon name="camera-off" size={80} color={theme.colors.onSurfaceVariant} />
        <Text variant="headlineSmall" style={{ marginTop: 16, marginBottom: 8 }}>
          Camera Permission Required
        </Text>
        <Text 
          variant="bodyMedium" 
          style={{ 
            textAlign: 'center', 
            color: theme.colors.onSurfaceVariant,
            paddingHorizontal: 32,
            marginBottom: 24,
          }}
        >
          GaterLink needs camera access to scan QR codes for door access.
        </Text>
        <Button mode="contained" onPress={openSettings}>
          Open Settings
        </Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={globalStyles.centerContainer}>
        <Text>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScanning}
          codeScanner={codeScanner}
          torch={flashEnabled ? 'on' : 'off'}
        />
      )}
      
      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <Surface style={styles.instructionCard}>
            <Icon name="qrcode-scan" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ marginLeft: 12, flex: 1 }}>
              Point camera at door QR code
            </Text>
          </Surface>
        </View>
        
        {/* Scanner Frame */}
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 16, color: theme.colors.primary }}>
                Processing...
              </Text>
            </View>
          )}
        </View>
        
        {/* Bottom Controls */}
        <View style={styles.bottomSection}>
          <IconButton
            icon={flashEnabled ? 'flash' : 'flash-off'}
            size={32}
            iconColor={theme.colors.onPrimary}
            style={styles.controlButton}
            onPress={() => setFlashEnabled(!flashEnabled)}
          />
          
          <IconButton
            icon="history"
            size={32}
            iconColor={theme.colors.onPrimary}
            style={styles.controlButton}
            onPress={() => navigation.navigate('ScanHistory' as never)}
          />
          
          <IconButton
            icon="door"
            size={32}
            iconColor={theme.colors.onPrimary}
            style={styles.controlButton}
            onPress={() => navigation.navigate('SavedDoors' as never)}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topSection: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
});

export default ScannerScreen;