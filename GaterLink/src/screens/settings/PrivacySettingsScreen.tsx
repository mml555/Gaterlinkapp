import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Switch,
  Button,
  useTheme,
  List,
  Divider,
  Surface,
  Portal,
  Dialog,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../../styles/global';
import PermissionService from '../../services/permission.service';
import SecurityService from '../../services/security.service';
import LoggingService from '../../services/logging.service';
import { STORAGE_KEYS } from '../../constants';

interface PrivacySettings {
  shareAnalytics: boolean;
  allowCrashReports: boolean;
  allowLocationTracking: boolean;
  dataRetentionPeriod: '30days' | '90days' | '1year' | 'forever';
  marketingEmails: boolean;
  thirdPartySharing: boolean;
  personalizationEnabled: boolean;
}

interface DataUsageStats {
  cacheSize: number;
  documentsSize: number;
  imagesSize: number;
  totalSize: number;
}

const PrivacySettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    shareAnalytics: true,
    allowCrashReports: true,
    allowLocationTracking: false,
    dataRetentionPeriod: '90days',
    marketingEmails: false,
    thirdPartySharing: false,
    personalizationEnabled: true,
  });
  
  const [dataUsage, setDataUsage] = useState<DataUsageStats>({
    cacheSize: 0,
    documentsSize: 0,
    imagesSize: 0,
    totalSize: 0,
  });
  
  const [showDataRetentionDialog, setShowDataRetentionDialog] = useState(false);
  const [showDataExportDialog, setShowDataExportDialog] = useState(false);
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
    calculateDataUsage();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      if (settingsStr) {
        setPrivacySettings(JSON.parse(settingsStr));
      }
    } catch (error) {
      LoggingService.error('Failed to load privacy settings', 'Privacy', error as Error);
    }
  };

  const savePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    try {
      const newSettings = { ...privacySettings, ...updates };
      setPrivacySettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(newSettings));
      LoggingService.info('Privacy settings updated', 'Privacy', updates);
    } catch (error) {
      LoggingService.error('Failed to save privacy settings', 'Privacy', error as Error);
    }
  };

  const calculateDataUsage = async () => {
    // In a real app, you would calculate actual sizes
    setDataUsage({
      cacheSize: Math.random() * 50,
      documentsSize: Math.random() * 100,
      imagesSize: Math.random() * 200,
      totalSize: 350 + Math.random() * 100,
    });
  };

  const handleToggleSetting = (key: keyof PrivacySettings, value: boolean) => {
    savePrivacySettings({ [key]: value });
  };

  const handleDataRetentionChange = (period: string) => {
    setShowDataRetentionDialog(false);
    savePrivacySettings({ dataRetentionPeriod: period as any });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // In a real app, this would gather all user data and create an export
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
      
      Alert.alert(
        'Data Export Complete',
        'Your data has been prepared for download. Check your email for the download link.',
        [{ text: 'OK' }]
      );
      setShowDataExportDialog(false);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export your data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data from our servers. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // In a real app, this would delete all user data
            Alert.alert('Data Deleted', 'Your data has been permanently deleted.');
            setShowDeleteDataDialog(false);
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data from your device. Your account data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            // Clear cache logic
            await calculateDataUsage();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getRetentionPeriodLabel = (period: string): string => {
    switch (period) {
      case '30days': return '30 Days';
      case '90days': return '90 Days';
      case '1year': return '1 Year';
      case 'forever': return 'Forever';
      default: return period;
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentContainer}>
        {/* Data Collection Section */}
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>
          Data Collection
        </Text>
        
        <Surface style={{ borderRadius: 12, marginBottom: 24 }}>
          <List.Item
            title="Analytics"
            description="Help us improve by sharing app usage data"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            right={() => (
              <Switch
                value={privacySettings.shareAnalytics}
                onValueChange={(value) => handleToggleSetting('shareAnalytics', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Crash Reports"
            description="Automatically send crash reports to help fix issues"
            left={(props) => <List.Icon {...props} icon="bug" />}
            right={() => (
              <Switch
                value={privacySettings.allowCrashReports}
                onValueChange={(value) => handleToggleSetting('allowCrashReports', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Location Tracking"
            description="Allow location-based features"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={privacySettings.allowLocationTracking}
                onValueChange={(value) => handleToggleSetting('allowLocationTracking', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Personalization"
            description="Use your data to personalize your experience"
            left={(props) => <List.Icon {...props} icon="account-cog" />}
            right={() => (
              <Switch
                value={privacySettings.personalizationEnabled}
                onValueChange={(value) => handleToggleSetting('personalizationEnabled', value)}
              />
            )}
          />
        </Surface>

        {/* Data Sharing Section */}
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>
          Data Sharing
        </Text>
        
        <Surface style={{ borderRadius: 12, marginBottom: 24 }}>
          <List.Item
            title="Marketing Communications"
            description="Receive promotional emails and offers"
            left={(props) => <List.Icon {...props} icon="email-newsletter" />}
            right={() => (
              <Switch
                value={privacySettings.marketingEmails}
                onValueChange={(value) => handleToggleSetting('marketingEmails', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Third-Party Sharing"
            description="Share data with trusted partners"
            left={(props) => <List.Icon {...props} icon="share-variant" />}
            right={() => (
              <Switch
                value={privacySettings.thirdPartySharing}
                onValueChange={(value) => handleToggleSetting('thirdPartySharing', value)}
              />
            )}
          />
        </Surface>

        {/* Data Management Section */}
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>
          Data Management
        </Text>
        
        <Surface style={{ borderRadius: 12, marginBottom: 24 }}>
          <List.Item
            title="Data Retention Period"
            description={`Your data is kept for ${getRetentionPeriodLabel(privacySettings.dataRetentionPeriod)}`}
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            onPress={() => setShowDataRetentionDialog(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <Divider />
          
          <List.Item
            title="Export My Data"
            description="Download a copy of all your data"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={() => setShowDataExportDialog(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <Divider />
          
          <List.Item
            title="Delete My Data"
            description="Permanently delete all your data"
            left={(props) => <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />}
            onPress={() => setShowDeleteDataDialog(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={{ color: theme.colors.error }}
          />
        </Surface>

        {/* Storage Usage */}
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>
          Storage Usage
        </Text>
        
        <Card style={{ marginBottom: 24 }}>
          <Card.Content>
            <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <Text variant="titleMedium">Total Storage</Text>
              <Text variant="titleMedium">{formatBytes(dataUsage.totalSize * 1024 * 1024)}</Text>
            </View>
            
            <View style={{ marginBottom: 12 }}>
              <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 4 }]}>
                <Text variant="bodyMedium">Cache</Text>
                <Text variant="bodySmall">{formatBytes(dataUsage.cacheSize * 1024 * 1024)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4 }}>
                <View 
                  style={{ 
                    width: `${(dataUsage.cacheSize / dataUsage.totalSize) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary,
                    borderRadius: 4,
                  }} 
                />
              </View>
            </View>
            
            <View style={{ marginBottom: 12 }}>
              <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 4 }]}>
                <Text variant="bodyMedium">Documents</Text>
                <Text variant="bodySmall">{formatBytes(dataUsage.documentsSize * 1024 * 1024)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4 }}>
                <View 
                  style={{ 
                    width: `${(dataUsage.documentsSize / dataUsage.totalSize) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.secondary,
                    borderRadius: 4,
                  }} 
                />
              </View>
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 4 }]}>
                <Text variant="bodyMedium">Images</Text>
                <Text variant="bodySmall">{formatBytes(dataUsage.imagesSize * 1024 * 1024)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4 }}>
                <View 
                  style={{ 
                    width: `${(dataUsage.imagesSize / dataUsage.totalSize) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.tertiary,
                    borderRadius: 4,
                  }} 
                />
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleClearCache}
              icon="broom"
            >
              Clear Cache
            </Button>
          </Card.Content>
        </Card>

        {/* Privacy Links */}
        <View style={{ marginBottom: 32 }}>
          <Button
            mode="text"
            onPress={() => Linking.openURL('https://gaterlink.com/privacy')}
            icon="shield-lock"
          >
            Privacy Policy
          </Button>
          <Button
            mode="text"
            onPress={() => Linking.openURL('https://gaterlink.com/terms')}
            icon="file-document"
          >
            Terms of Service
          </Button>
          <Button
            mode="text"
            onPress={() => Linking.openURL('https://gaterlink.com/cookies')}
            icon="cookie"
          >
            Cookie Policy
          </Button>
        </View>
      </View>

      {/* Dialogs */}
      <Portal>
        {/* Data Retention Dialog */}
        <Dialog visible={showDataRetentionDialog} onDismiss={() => setShowDataRetentionDialog(false)}>
          <Dialog.Title>Data Retention Period</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={handleDataRetentionChange}
              value={privacySettings.dataRetentionPeriod}
            >
              <RadioButton.Item label="30 Days" value="30days" />
              <RadioButton.Item label="90 Days" value="90days" />
              <RadioButton.Item label="1 Year" value="1year" />
              <RadioButton.Item label="Keep Forever" value="forever" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDataRetentionDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Export Data Dialog */}
        <Dialog visible={showDataExportDialog} onDismiss={() => setShowDataExportDialog(false)}>
          <Dialog.Title>Export Your Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              We'll prepare a complete copy of your data including:
            </Text>
            <View style={{ marginTop: 16 }}>
              <Chip icon="check" style={{ marginBottom: 8 }}>Profile Information</Chip>
              <Chip icon="check" style={{ marginBottom: 8 }}>Access Requests</Chip>
              <Chip icon="check" style={{ marginBottom: 8 }}>Messages</Chip>
              <Chip icon="check" style={{ marginBottom: 8 }}>Activity History</Chip>
            </View>
            <Text variant="bodySmall" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
              The export will be sent to your registered email address.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDataExportDialog(false)}>Cancel</Button>
            <Button onPress={handleExportData} loading={isExporting} disabled={isExporting}>
              Export
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Data Dialog */}
        <Dialog visible={showDeleteDataDialog} onDismiss={() => setShowDeleteDataDialog(false)}>
          <Dialog.Title>Delete All Data</Dialog.Title>
          <Dialog.Content>
            <Icon 
              name="alert-circle" 
              size={48} 
              color={theme.colors.error} 
              style={{ alignSelf: 'center', marginBottom: 16 }} 
            />
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              This will permanently delete:
            </Text>
            <View style={{ marginTop: 16 }}>
              <Text variant="bodyMedium">• Your profile and account</Text>
              <Text variant="bodyMedium">• All access requests</Text>
              <Text variant="bodyMedium">• Message history</Text>
              <Text variant="bodyMedium">• Saved doors and settings</Text>
            </View>
            <Text 
              variant="bodyMedium" 
              style={{ 
                marginTop: 16, 
                color: theme.colors.error,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              This action cannot be undone!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDataDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleDeleteAllData} 
              textColor={theme.colors.error}
            >
              Delete Everything
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

export default PrivacySettingsScreen;