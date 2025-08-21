import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import messaging from '@react-native-firebase/messaging';
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
    // Request permission for iOS
    const requestUserPermission = async () => {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Authorization status:', authStatus);
        }
      }
    };

    // Get FCM token
    const getToken = async () => {
      try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        setPushToken(token);
        return token;
      } catch (error) {
        console.error('Failed to get FCM token:', error);
        return null;
      }
    };

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      
      // Add to Redux store
      dispatch(addNotification({
        id: remoteMessage.messageId || Date.now().toString(),
        title: remoteMessage.notification?.title || '',
        message: remoteMessage.notification?.body || '',
        type: remoteMessage.data?.type || 'system',
        isRead: false,
        timestamp: new Date(),
        data: remoteMessage.data,
      }));
    });

    // Handle background/quit state messages
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background message opened app:', remoteMessage);
      
      // Add to Redux store
      dispatch(addNotification({
        id: remoteMessage.messageId || Date.now().toString(),
        title: remoteMessage.notification?.title || '',
        message: remoteMessage.notification?.body || '',
        type: remoteMessage.data?.type || 'system',
        isRead: false,
        timestamp: new Date(),
        data: remoteMessage.data,
      }));
    });

    // Check if app was opened from a quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state:', remoteMessage);
          
          // Add to Redux store
          dispatch(addNotification({
            id: remoteMessage.messageId || Date.now().toString(),
            title: remoteMessage.notification?.title || '',
            message: remoteMessage.notification?.body || '',
            type: remoteMessage.data?.type || 'system',
            isRead: false,
            timestamp: new Date(),
            data: remoteMessage.data,
          }));
        }
      });

    // Initialize
    requestUserPermission();
    getToken();

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('User has declined notifications');
          return null;
        }
      }

      const token = await messaging().getToken();
      setPushToken(token);
      return token;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any): Promise<void> => {
    try {
      // For local notifications, we'll use the Redux store
      dispatch(addNotification({
        id: Date.now().toString(),
        title,
        message: body,
        type: 'local',
        isRead: false,
        timestamp: new Date(),
        data,
      }));
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        registerForPushNotifications,
        sendLocalNotification,
      }}
    >
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
