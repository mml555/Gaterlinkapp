import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Camera from 'react-native-camera-kit';

interface CameraTestProps {
  onQRCodeRead?: (data: string) => void;
  onError?: (error: string) => void;
}

const CameraTest: React.FC<CameraTestProps> = ({ onQRCodeRead, onError }) => {
  const handleReadCode = (event: any) => {
    console.log('Camera QR Code detected:', event.nativeEvent.codeStringValue);
    onQRCodeRead?.(event.nativeEvent.codeStringValue);
  };

  const handleError = (event: any) => {
    console.error('Camera error:', event.nativeEvent.errorMessage);
    onError?.(event.nativeEvent.errorMessage);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Test Component</Text>
      <View style={styles.cameraContainer}>
        <Camera
          scanBarcode
          onReadCode={handleReadCode}
          showFrame
          laserColor="#007AFF"
          frameColor="#007AFF"
          style={styles.camera}
          cameraType="back"
          flashMode="auto"
          onError={handleError}
          zoomMode="on"
          maxZoom={10}
        />
      </View>
      <Text style={styles.instruction}>
        Point camera at a QR code to test scanning
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  instruction: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});

export default CameraTest;
