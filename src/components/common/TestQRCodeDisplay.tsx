import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

interface TestQRCodeDisplayProps {
  onQRCodeSelect: (qrCode: string) => void;
}

const TestQRCodeDisplay: React.FC<TestQRCodeDisplayProps> = ({ onQRCodeSelect }) => {
  const testQRCodes = [
    {
      id: '1',
      name: 'Front Door',
      qrCode: 'qr_code_1_1234567890',
      description: 'Main entrance access',
    },
    {
      id: '2',
      name: 'Back Gate',
      qrCode: 'qr_code_2_1234567891',
      description: 'Garden access',
    },
    {
      id: '3',
      name: 'Garage Door',
      qrCode: 'qr_code_3_1234567892',
      description: 'Garage access',
    },
    {
      id: '4',
      name: 'Side Entrance',
      qrCode: 'qr_code_4_1234567893',
      description: 'Side yard access',
    },
    {
      id: 'invalid',
      name: 'Invalid QR Code',
      qrCode: 'invalid_qr_code',
      description: 'This should trigger an error',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Test QR Codes
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Tap on a QR code to simulate scanning it
      </Text>
      
      {testQRCodes.map((item) => (
        <Card key={item.id} style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              {item.description}
            </Text>
            <Text variant="bodySmall" style={styles.qrCode}>
              {item.qrCode}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => onQRCodeSelect(item.qrCode)}
              compact
            >
              Simulate Scan
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#666666',
    marginBottom: 8,
  },
  qrCode: {
    fontFamily: 'monospace',
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
  },
});

export default TestQRCodeDisplay;
