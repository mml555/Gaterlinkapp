import React, { useEffect } from 'react';
import {
  View,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { STORAGE_KEYS } from '../constants';
import AuthService from '../services/auth.service';
import { globalStyles } from '../styles/global';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const translateYAnim = new Animated.Value(50);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Check app state and navigate
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      // Add a minimum splash duration for better UX
      const minimumSplashDuration = new Promise(resolve => 
        setTimeout(resolve, 2000)
      );

      // Check if it's first launch
      const isFirstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      
      if (isFirstLaunch === null || isFirstLaunch === 'true') {
        await minimumSplashDuration;
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' as never }],
        });
        return;
      }

      // Check authentication status
      const authStatus = await AuthService.checkAuthStatus();
      
      await minimumSplashDuration;
      
      if (authStatus.isAuthenticated && authStatus.user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'App' as never }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' as never }],
        });
      }
    } catch (error) {
      console.error('Splash screen error:', error);
      // Navigate to auth as fallback
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    }
  };

  return (
    <View 
      style={[
        globalStyles.container, 
        { 
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }
      ]}
    >
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle="light-content"
      />
      
      {/* Animated Logo Container */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
          alignItems: 'center',
        }}
      >
        {/* Logo Icon */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Icon name="home-city" size={64} color="white" />
        </View>
        
        {/* App Name */}
        <Text
          variant="displaySmall"
          style={{
            color: 'white',
            fontWeight: 'bold',
            marginBottom: 8,
          }}
        >
          GaterLink
        </Text>
        
        {/* Tagline */}
        <Text
          variant="bodyLarge"
          style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 48,
          }}
        >
          Smart Access Management
        </Text>
        
        {/* Loading Indicator */}
        <ActivityIndicator
          size="large"
          color="white"
          style={{ marginTop: 32 }}
        />
      </Animated.View>
      
      {/* Version Info */}
      <View
        style={{
          position: 'absolute',
          bottom: 48,
          alignItems: 'center',
        }}
      >
        <Text
          variant="bodySmall"
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;