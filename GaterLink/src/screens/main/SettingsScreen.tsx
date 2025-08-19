import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  List,
  Switch,
  Divider,
  useTheme,
  Button,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { 
  setDarkMode, 
  setBiometricsEnabled,
  setSmsNotificationsEnabled,
} from '../../store/slices/settingsSlice';
import NotificationSettings from '../../components/NotificationSettings';
import DatabaseService from '../../services/database.service';
import SyncService from '../../services/sync.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { APP_CONSTANTS, SUCCESS_MESSAGES } from '../../constants';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const settings = useSelector((state: RootState) => state.settings);
  const pendingSync = useSelector((state: RootState) => state.sync.pendingCount);
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'privacy' | 'about'>('general');

  const handleDarkModeToggle = (value: boolean) => {
    dispatch(setDarkMode(value));
  };

  const handleBiometricsToggle = async (value: boolean) => {
    if (value) {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (!available) {
        Alert.alert(
          'Biometrics Not Available',
          'Your device does not support biometric authentication.',
        );
        return;
      }
      
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to enable biometric login',
      });
      
      if (!success) {
        return;
      }
    }
    
    dispatch(setBiometricsEnabled(value));
    LoggingService.info(`Biometrics ${value ? 'enabled' : 'disabled'}`, 'Settings');
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setShowLogoutDialog(false);
    
    try {
      // Sync any pending data
      if (pendingSync > 0) {
        await SyncService.manualSync();
      }
      
      await dispatch(logout()).unwrap();
      LoggingService.info('User logged out', 'Settings');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
      LoggingService.error('Logout failed', 'Settings', error as Error);
    }
  };

  const handleClearData = () => {
    setShowClearDataDialog(true);
  };

  const confirmClearData = async () => {
    setShowClearDataDialog(false);
    
    try {
      await DatabaseService.clearAllData();
      await LoggingService.clearLogs();
      Alert.alert('Success', 'All local data has been cleared.');
      LoggingService.info('Local data cleared', 'Settings');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data. Please try again.');
      LoggingService.error('Clear data failed', 'Settings', error as Error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const logs = LoggingService.exportLogs();
      // In a real app, you would share or save the logs
      Alert.alert('Logs Exported', 'Logs have been exported successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs.');
    }
  };

  const renderGeneralSettings = () => (
    <List.Section>
      <List.Subheader>Appearance</List.Subheader>
      
      <List.Item
        title="Dark Mode"
        description="Use dark theme"
        left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
        right={() => (
          <Switch
            value={settings.darkMode}
            onValueChange={handleDarkModeToggle}
          />
        )}
      />
      
      <Divider />
      
      <List.Subheader>Security</List.Subheader>
      
      <List.Item
        title="Biometric Login"
        description="Use Face ID or Touch ID to login"
        left={(props) => <List.Icon {...props} icon="fingerprint" />}
        right={() => (
          <Switch
            value={settings.biometricsEnabled}
            onValueChange={handleBiometricsToggle}
          />
        )}
      />
      
      <List.Item
        title="Change Password"
        description="Update your account password"
        left={(props) => <List.Icon {...props} icon="lock-reset" />}
        onPress={() => {/* Navigate to change password */}}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
    </List.Section>
  );

  const renderPrivacySettings = () => (
    <List.Section>
      <List.Subheader>Data & Privacy</List.Subheader>
      
      <List.Item
        title="SMS Notifications"
        description="Receive SMS alerts for important updates"
        left={(props) => <List.Icon {...props} icon="message-text" />}
        right={() => (
          <Switch
            value={settings.smsNotificationsEnabled}
            onValueChange={(value) => dispatch(setSmsNotificationsEnabled(value))}
          />
        )}
      />
      
      <List.Item
        title="Clear Local Data"
        description="Remove all cached data from device"
        left={(props) => <List.Icon {...props} icon="delete-sweep" />}
        onPress={handleClearData}
      />
      
      <List.Item
        title="Export Logs"
        description="Export debug logs for troubleshooting"
        left={(props) => <List.Icon {...props} icon="file-export" />}
        onPress={handleExportLogs}
      />
      
      <Divider />
      
      <List.Subheader>Account</List.Subheader>
      
      <List.Item
        title="Delete Account"
        description="Permanently delete your account and data"
        left={(props) => <List.Icon {...props} icon="account-remove" color={theme.colors.error} />}
        onPress={() => Alert.alert('Delete Account', 'Please contact support to delete your account.')}
        titleStyle={{ color: theme.colors.error }}
      />
    </List.Section>
  );

  const renderAboutSection = () => (
    <List.Section>
      <List.Subheader>About</List.Subheader>
      
      <List.Item
        title="Version"
        description={APP_CONSTANTS.VERSION}
        left={(props) => <List.Icon {...props} icon="information" />}
      />
      
      <List.Item
        title="Privacy Policy"
        description="View our privacy policy"
        left={(props) => <List.Icon {...props} icon="shield-lock" />}
        onPress={() => {/* Open privacy policy */}}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
      
      <List.Item
        title="Terms of Service"
        description="View terms and conditions"
        left={(props) => <List.Icon {...props} icon="file-document" />}
        onPress={() => {/* Open terms */}}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
      
      <List.Item
        title="Contact Support"
        description="Get help with the app"
        left={(props) => <List.Icon {...props} icon="help-circle" />}
        onPress={() => {/* Open support */}}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
      
      <List.Item
        title="Rate Us"
        description="Rate GaterLink on the App Store"
        left={(props) => <List.Icon {...props} icon="star" />}
        onPress={() => {/* Open app store */}}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
    </List.Section>
  );

  return (
    <View style={globalStyles.container}>
      <ScrollView>
        {/* User Info */}
        <View style={[globalStyles.card, { margin: 16, padding: 16 }]}>
          <View style={[globalStyles.row, { alignItems: 'center' }]}>
            <Icon name="account-circle" size={48} color={theme.colors.primary} />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text variant="titleMedium">{user?.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {user?.email}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {user?.role === 'admin' ? 'Administrator' : 'Customer'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, marginBottom: 8 }}
          >
            {['general', 'notifications', 'privacy', 'about'].map((section) => (
              <Button
                key={section}
                mode={activeSection === section ? 'contained' : 'outlined'}
                onPress={() => setActiveSection(section as any)}
                style={{ marginRight: 8 }}
                compact
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Button>
            ))}
          </ScrollView>
        </View>

        {activeSection === 'general' && renderGeneralSettings()}
        {activeSection === 'notifications' && <NotificationSettings />}
        {activeSection === 'privacy' && renderPrivacySettings()}
        {activeSection === 'about' && renderAboutSection()}

        {/* Logout Button */}
        <View style={{ padding: 16, marginBottom: 32 }}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to logout?</Text>
            {pendingSync > 0 && (
              <Text style={{ marginTop: 8, color: theme.colors.warning }}>
                You have {pendingSync} items pending sync. They will be synced before logout.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button onPress={confirmLogout} textColor={theme.colors.error}>
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showClearDataDialog} onDismiss={() => setShowClearDataDialog(false)}>
          <Dialog.Title>Clear Local Data</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will remove all cached data from your device. Your account and server data will not be affected.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDataDialog(false)}>Cancel</Button>
            <Button onPress={confirmClearData} textColor={theme.colors.error}>
              Clear Data
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default SettingsScreen;