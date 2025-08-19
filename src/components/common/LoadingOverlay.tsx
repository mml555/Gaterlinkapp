import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible = true, 
  message = 'Loading...' 
}) => {
  const theme = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator
            animating={true}
            color={theme.colors.primary}
            size="large"
            style={styles.loader}
          />
          <Text variant="bodyLarge" style={styles.message}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loader: {
    marginBottom: 15,
  },
  message: {
    textAlign: 'center',
  },
});

export default LoadingOverlay;
