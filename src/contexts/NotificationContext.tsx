import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      // Add to Redux store
      dispatch(addNotification({
        id: notification.request.identifier,
        title: title || '',
        message: body || '',
        type: data?.type || 'system',
        isRead: false,
        timestamp: new Date(),
        data: data,
      }));
    });

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      
      // Handle navigation based on notification data
      if (data?.screen) {
        // Navigate to specific screen
        // You can implement navigation logic here
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [dispatch]);

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);

      // Send token to backend
      await notificationService.registerPushToken(token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const getNotificationPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
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
