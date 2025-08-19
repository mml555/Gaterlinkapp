import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { STORAGE_KEYS } from '../../constants';
import { globalStyles } from '../../styles/global';
import PermissionService from '../../services/permission.service';
import NotificationService from '../../services/notification.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  illustration?: any;
  action?: {
    label: string;
    onPress: () => Promise<void>;
  };
}

const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({
    camera: false,
    notifications: false,
  });

  const onboardingSteps: OnboardingStep[] = [
    {
      title: 'Welcome to GaterLink',
      description: 'Your smart access management solution. Scan QR codes, manage requests, and communicate seamlessly.',
      icon: 'home-city',
      backgroundColor: theme.colors.primary,
    },
    {
      title: 'Scan QR Codes',
      description: 'Quickly scan door QR codes to request access. We need camera permission to enable this feature.',
      icon: 'qrcode-scan',
      backgroundColor: theme.colors.secondary,
      action: {
        label: 'Enable Camera',
        onPress: async () => {
          const result = await PermissionService.requestCameraPermission();
          setPermissionsGranted({ ...permissionsGranted, camera: result });
        },
      },
    },
    {
      title: 'Stay Connected',
      description: 'Receive instant notifications when your access is approved or when you have new messages.',
      icon: 'bell-ring',
      backgroundColor: theme.colors.tertiary,
      action: {
        label: 'Enable Notifications',
        onPress: async () => {
          const result = await NotificationService.requestPermission();
          setPermissionsGranted({ ...permissionsGranted, notifications: result });
        },
      },
    },
    {
      title: 'Real-Time Chat',
      description: 'Communicate directly with property managers through our secure in-app messaging.',
      icon: 'message-text',
      backgroundColor: theme.colors.success,
    },
    {
      title: 'Your Data is Secure',
      description: 'We use end-to-end encryption and biometric authentication to keep your information safe.',
      icon: 'shield-check',
      backgroundColor: theme.colors.error,
    },
    {
      title: "You're All Set!",
      description: 'Start using GaterLink to manage your access requests efficiently and securely.',
      icon: 'check-circle',
      backgroundColor: theme.colors.primary,
    },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const step = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentStep(step);
  };

  const goToStep = (step: number) => {
    scrollViewRef.current?.scrollTo({ x: step * SCREEN_WIDTH, animated: true });
    setCurrentStep(step);
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const renderStep = (step: OnboardingStep, index: number) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <View
        key={index}
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: step.backgroundColor,
          paddingTop: StatusBar.currentHeight || 44,
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 32 }}>
          {/* Skip button */}
          {index < onboardingSteps.length - 1 && (
            <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
              <Button
                mode="text"
                onPress={skipOnboarding}
                textColor="white"
                labelStyle={{ fontSize: 16 }}
              >
                Skip
              </Button>
            </View>
          )}

          {/* Content */}
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              },
              animatedStyle,
            ]}
          >
            {/* Icon */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 48,
              }}
            >
              <Icon name={step.icon} size={64} color="white" />
            </View>

            {/* Title */}
            <Text
              variant="headlineMedium"
              style={{
                color: 'white',
                textAlign: 'center',
                marginBottom: 16,
                fontWeight: 'bold',
              }}
            >
              {step.title}
            </Text>

            {/* Description */}
            <Text
              variant="bodyLarge"
              style={{
                color: 'white',
                textAlign: 'center',
                opacity: 0.9,
                marginBottom: 32,
                lineHeight: 24,
              }}
            >
              {step.description}
            </Text>

            {/* Action Button */}
            {step.action && (
              <Button
                mode="contained"
                onPress={step.action.onPress}
                style={{
                  backgroundColor: 'white',
                  paddingHorizontal: 24,
                }}
                labelStyle={{ color: step.backgroundColor }}
                icon={permissionsGranted[index === 1 ? 'camera' : 'notifications'] ? 'check' : undefined}
              >
                {permissionsGranted[index === 1 ? 'camera' : 'notifications'] 
                  ? 'Permission Granted' 
                  : step.action.label}
              </Button>
            )}

            {/* Complete button on last step */}
            {index === onboardingSteps.length - 1 && (
              <Button
                mode="contained"
                onPress={completeOnboarding}
                loading={isLoading}
                disabled={isLoading}
                style={{
                  backgroundColor: 'white',
                  paddingHorizontal: 32,
                }}
                labelStyle={{ color: step.backgroundColor, fontSize: 16 }}
              >
                Get Started
              </Button>
            )}
          </Animated.View>

          {/* Bottom Navigation */}
          <View style={{ paddingBottom: 32 }}>
            {/* Progress dots */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              {onboardingSteps.map((_, idx) => {
                const dotAnimatedStyle = useAnimatedStyle(() => {
                  const inputRange = [
                    (idx - 1) * SCREEN_WIDTH,
                    idx * SCREEN_WIDTH,
                    (idx + 1) * SCREEN_WIDTH,
                  ];

                  const width = interpolate(
                    scrollX.value,
                    inputRange,
                    [8, 24, 8],
                    Extrapolate.CLAMP
                  );

                  const opacity = interpolate(
                    scrollX.value,
                    inputRange,
                    [0.5, 1, 0.5],
                    Extrapolate.CLAMP
                  );

                  return {
                    width,
                    opacity,
                  };
                });

                return (
                  <Animated.View
                    key={idx}
                    style={[
                      {
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'white',
                        marginHorizontal: 4,
                      },
                      dotAnimatedStyle,
                    ]}
                  />
                );
              })}
            </View>

            {/* Navigation buttons */}
            {index < onboardingSteps.length - 1 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <IconButton
                  icon="chevron-left"
                  size={32}
                  iconColor="white"
                  onPress={() => goToStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  style={{ opacity: currentStep === 0 ? 0.3 : 1 }}
                />
                <Button
                  mode="contained"
                  onPress={() => goToStep(Math.min(onboardingSteps.length - 1, currentStep + 1))}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  labelStyle={{ color: 'white' }}
                >
                  Next
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>
    </View>
  );
};

export default OnboardingScreen;