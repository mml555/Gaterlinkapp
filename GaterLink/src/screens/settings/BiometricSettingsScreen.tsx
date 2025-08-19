import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Switch,
  Button,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
  IconButton,
  Surface,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../../store';
import BiometricService from '../../services/biometric.service';
import AuthService from '../../services/auth.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants';

const BiometricSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [biometricSettings, setBiometricSettings] = useState({
    enabled: false,
    requireOnAppStart: true,
    requireForSensitiveActions: true,
  });
  
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    setIsLoading(true);
    try {
      const { available, biometryType } = await BiometricService.isBiometricsAvailable();
      setBiometricAvailable(available);
      
      if (biometryType) {
        setBiometricType(BiometricService.getBiometryTypeString(biometryType));
      }
      
      const settings = BiometricService.getSettings();
      if (settings) {
        setBiometricSettings({
          enabled: settings.enabled,
          requireOnAppStart: settings.requireOnAppStart,
          requireForSensitiveActions: settings.requireForSensitiveActions,
        });
      }
    } catch (error) {
      LoggingService.error('Failed to check biometric availability', 'BiometricSettings', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = (value: boolean) => {
    if (value) {
      setShowEnableDialog(true);
    } else {
      handleDisableBiometric();
    }
  };

  const handleEnableBiometric = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsEnabling(true);
    try {
      // Verify password
      const loginResult = await AuthService.login(user!.email, password);
      if (!loginResult.success) {
        Alert.alert('Error', ERROR_MESSAGES.INVALID_CREDENTIALS);
        return;
      }

      // Enable biometrics
      const result = await BiometricService.enableBiometrics(
        user!.email,
        password,
        {
          requireOnAppStart: biometricSettings.requireOnAppStart,
          requireForSensitiveActions: biometricSettings.requireForSensitiveActions,
        }
      );

      if (result.success) {
        setBiometricSettings({ ...biometricSettings, enabled: true });
        setShowEnableDialog(false);
        setPassword('');
        Alert.alert('Success', `${biometricType} has been enabled for secure login`);
      } else {
        Alert.alert('Error', result.error || 'Failed to enable biometric authentication');
      }
    } catch (error) {
      LoggingService.error('Failed to enable biometrics', 'BiometricSettings', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Login',
      `Are you sure you want to disable ${biometricType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            const result = await BiometricService.disableBiometrics();
            if (result.success) {
              setBiometricSettings({ ...biometricSettings, enabled: false });
              Alert.alert('Success', 'Biometric authentication has been disabled');
            } else {
              Alert.alert('Error', result.error || 'Failed to disable biometric authentication');
            }
          },
        },
      ]
    );
  };

  const handleUpdateSetting = async (key: string, value: boolean) => {
    const updates = { ...biometricSettings, [key]: value };
    setBiometricSettings(updates);
    
    await BiometricService.updateSettings({
      [key]: value,
    });
  };

  const testBiometric = async () => {
    const result = await BiometricService.authenticateUser(
      'Test Authentication',
      `Place your finger on the ${biometricType} sensor`
    );
    
    if (result.success) {
      Alert.alert('Success', 'Authentication successful!');
    } else {
      Alert.alert('Failed', result.error || 'Authentication failed');
    }
  };

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!biometricAvailable) {
    return (
      <View style={globalStyles.container}>
        <View style={[globalStyles.centerContainer, { paddingHorizontal: 32 }]}>
          <Icon name="fingerprint-off" size={80} color={theme.colors.onSurfaceVariant} />
          <Text variant="headlineSmall" style={{ marginTop: 16, textAlign: 'center' }}>
            Biometric Authentication Not Available
          </Text>
          <Text 
            variant="bodyMedium" 
            style={{ 
              marginTop: 8, 
              textAlign: 'center',
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Your device does not support biometric authentication or it has not been set up.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 24 }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentContainer}>
        {/* Biometric Status Card */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={[globalStyles.row, { alignItems: 'center' }]}>
              <Icon 
                name="fingerprint" 
                size={48} 
                color={biometricSettings.enabled ? theme.colors.primary : theme.colors.onSurfaceVariant} 
              />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text variant="titleMedium">{biometricType}</Text>
                <Text 
                  variant="bodySmall" 
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {biometricSettings.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={biometricSettings.enabled}
                onValueChange={handleToggleBiometric}
              />
            </View>
            
            {biometricSettings.enabled && (
              <Button
                mode="outlined"
                onPress={testBiometric}
                style={{ marginTop: 16 }}
                icon="fingerprint"
              >
                Test {biometricType}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Settings */}
        {biometricSettings.enabled && (
          <>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Security Settings
            </Text>
            
            <Surface style={{ borderRadius: 12, marginBottom: 16 }}>
              <List.Item
                title="Require on App Start"
                description="Ask for biometric authentication when opening the app"
                left={(props) => <List.Icon {...props} icon="login" />}
                right={() => (
                  <Switch
                    value={biometricSettings.requireOnAppStart}
                    onValueChange={(value) => handleUpdateSetting('requireOnAppStart', value)}
                  />
                )}
              />
              
              <Divider />
              
              <List.Item
                title="Require for Sensitive Actions"
                description="Use biometrics for payments, data export, etc."
                left={(props) => <List.Icon {...props} icon="shield-check" />}
                right={() => (
                  <Switch
                    value={biometricSettings.requireForSensitiveActions}
                    onValueChange={(value) => handleUpdateSetting('requireForSensitiveActions', value)}
                  />
                )}
              />
            </Surface>
          </>
        )}

        {/* Info Section */}
        <Card style={{ backgroundColor: theme.colors.primaryContainer }}>
          <Card.Content>
            <View style={globalStyles.row}>
              <Icon 
                name="information" 
                size={24} 
                color={theme.colors.onPrimaryContainer} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text 
                  variant="titleSmall" 
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  How it works
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    color: theme.colors.onPrimaryContainer, 
                    marginTop: 4,
                  }}
                >
                  {biometricType} provides a secure and convenient way to access your account. 
                  Your biometric data is stored securely on your device and never leaves it.
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Security Tips */}
        <View style={{ marginTop: 24 }}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>
            Security Tips
          </Text>
          
          <View style={{ marginBottom: 12 }}>
            <View style={globalStyles.row}>
              <Icon name="check-circle" size={20} color={theme.colors.success} />
              <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                Keep your device's biometric data up to date
              </Text>
            </View>
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <View style={globalStyles.row}>
              <Icon name="check-circle" size={20} color={theme.colors.success} />
              <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                Don't share your device with others if biometrics are enabled
              </Text>
            </View>
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <View style={globalStyles.row}>
              <Icon name="check-circle" size={20} color={theme.colors.success} />
              <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                Use a strong backup password in case biometric fails
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enable Biometric Dialog */}
      <Portal>
        <Dialog visible={showEnableDialog} onDismiss={() => setShowEnableDialog(false)}>
          <Dialog.Title>Enable {biometricType}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Enter your password to enable biometric authentication
            </Text>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              left={<TextInput.Icon icon="lock" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowEnableDialog(false);
              setPassword('');
            }}>
              Cancel
            </Button>
            <Button 
              onPress={handleEnableBiometric}
              loading={isEnabling}
              disabled={isEnabling || !password}
            >
              Enable
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

export default BiometricSettingsScreen;