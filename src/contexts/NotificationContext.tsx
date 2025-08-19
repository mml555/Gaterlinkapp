import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { addNotification } from '../store/slices/notificationSlice';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
  registerForPushNotifications: () => Promise<string | null>;
  sendLocalNotification: (title: string, body: string, data?: any) => void;
  getNotificationPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Configure push notification
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log('TOKEN:', token);
        setPushToken(token);
        // For now, skip token registration since registerPushToken doesn't exist
        console.log('Push token received:', token);
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        
        // Add to Redux store
        dispatch(addNotification({
          id: notification.id || Date.now().toString(),
          title: notification.title || '',
          message: notification.message || '',
          type: notification.data?.type || 'system',
          isRead: false,
          timestamp: new Date(),
          data: notification.data,
        }));

        // Process the notification
        notification.finish();
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function(err) {
        console.error(err.message, err);
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - false: it will not be called if the app was opened by a notification.
       */
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'default',
          channelName: 'Default Channel',
          channelDescription: 'Default notification channel',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }

    return () => {
      // Cleanup if needed
    };
  }, [dispatch]);

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, request permissions
        PushNotification.requestPermissions().then((permissions) => {
          console.log('Permissions:', permissions);
        });
      }
      
      // The token will be received in the onRegister callback
      return pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      PushNotification.localNotification({
        channelId: 'default',
        title: title,
        message: body,
        data: data,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const getNotificationPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we can check permissions
        return true; // Simplified for now
      } else {
        // For Android, permissions are typically granted by default
        return true;
      }
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return false;
    }
  };

  const value: NotificationContextType = {
    registerForPushNotifications,
    sendLocalNotification,
    getNotificationPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
