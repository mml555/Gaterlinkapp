import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import PushNotification from 'react-native-push-notification';
import { addNotification } from '../store/slices/notificationSlice';

interface NotificationContextType {
  pushToken: string | null;
  registerForPushNotifications: () => Promise<string | null>;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    // Configure push notifications
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token: { os: string; token: string }) {
        console.log('TOKEN:', token);
        setPushToken(token.token);
        // For now, skip token registration since registerPushToken doesn't exist
        console.log('Push token received:', token.token);
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification: any) {
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
        if (notification.finish) {
          notification.finish();
        }
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function(err: any) {
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
        (created: boolean) => console.log(`Channel created: ${created}`)
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
        PushNotification.requestPermissions().then((permissions: any) => {
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
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        ...(data && { userInfo: data }),
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const value: NotificationContextType = {
    pushToken,
    registerForPushNotifications,
    sendLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
