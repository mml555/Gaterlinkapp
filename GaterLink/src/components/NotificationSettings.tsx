import React, { useState, useEffect } from 'react';
import {
  View,
  Alert,
} from 'react-native';
import {
  Text,
  Switch,
  List,
  Divider,
  useTheme,
  Button,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../store';
import {
  setNotificationsEnabled,
  setSoundEnabled,
  setVibrationEnabled,
} from '../store/slices/settingsSlice';
import PermissionService from '../services/permission.service';
import NotificationService from '../services/notification.service';
import { globalStyles } from '../styles/global';

const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    notificationsEnabled,
    soundEnabled,
    vibrationEnabled,
  } = useSelector((state: RootState) => state.settings);
  
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const permitted = await PermissionService.checkPermission('notifications');
    setHasPermission(permitted);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await PermissionService.requestPermission('notifications');
      if (!granted) {
        return;
      }
      setHasPermission(true);
    }
    
    dispatch(setNotificationsEnabled(value));
    
    if (!value) {
      // Clear all notifications when disabled
      await NotificationService.cancelAllNotifications();
    }
  };

  const handleSoundToggle = (value: boolean) => {
    dispatch(setSoundEnabled(value));
  };

  const handleVibrationToggle = (value: boolean) => {
    dispatch(setVibrationEnabled(value));
  };

  const testNotification = () => {
    NotificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from GaterLink',
      data: { test: true },
    });
    
    Alert.alert('Test Sent', 'Check your notification panel');
  };

  return (
    <View>
      <List.Section>
        <List.Subheader>Push Notifications</List.Subheader>
        
        <List.Item
          title="Enable Notifications"
          description="Receive updates about your requests and messages"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
            />
          )}
        />
        
        {notificationsEnabled && (
          <>
            <List.Item
              title="Sound"
              description="Play sound for notifications"
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={soundEnabled}
                  onValueChange={handleSoundToggle}
                />
              )}
            />
            
            <List.Item
              title="Vibration"
              description="Vibrate for notifications"
              left={(props) => <List.Icon {...props} icon="vibrate" />}
              right={() => (
                <Switch
                  value={vibrationEnabled}
                  onValueChange={handleVibrationToggle}
                />
              )}
            />
          </>
        )}
        
        <Divider />
        
        <List.Subheader>Notification Types</List.Subheader>
        
        <List.Item
          title="Messages"
          description="New messages in your conversations"
          left={(props) => <List.Icon {...props} icon="message" />}
          right={() => <Switch value={notificationsEnabled} disabled />}
        />
        
        <List.Item
          title="Request Updates"
          description="Status changes for your access requests"
          left={(props) => <List.Icon {...props} icon="update" />}
          right={() => <Switch value={notificationsEnabled} disabled />}
        />
        
        <List.Item
          title="System Alerts"
          description="Important system notifications"
          left={(props) => <List.Icon {...props} icon="alert-circle" />}
          right={() => <Switch value={notificationsEnabled} disabled />}
        />
      </List.Section>
      
      {notificationsEnabled && (
        <View style={{ padding: 16 }}>
          <Button
            mode="outlined"
            onPress={testNotification}
            icon="bell-ring"
          >
            Send Test Notification
          </Button>
        </View>
      )}
      
      {!hasPermission && notificationsEnabled && (
        <View style={[globalStyles.card, { margin: 16, backgroundColor: theme.colors.warningContainer }]}>
          <View style={globalStyles.row}>
            <Icon name="alert" size={24} color={theme.colors.onWarningContainer} />
            <Text 
              variant="bodySmall" 
              style={{ 
                flex: 1, 
                marginLeft: 12,
                color: theme.colors.onWarningContainer,
              }}
            >
              Notification permission is required. Please enable it in your device settings.
            </Text>
          </View>
          <Button
            mode="text"
            onPress={() => PermissionService.openAppSettings()}
            style={{ marginTop: 8 }}
          >
            Open Settings
          </Button>
        </View>
      )}
    </View>
  );
};

export default NotificationSettings;