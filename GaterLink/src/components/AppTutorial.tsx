import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  IconButton,
} from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useSharedValue,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { STORAGE_KEYS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetView?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: 'top' | 'bottom' | 'center';
  icon?: string;
}

interface AppTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  tutorialKey: string;
}

const AppTutorial: React.FC<AppTutorialProps> = ({
  steps,
  onComplete,
  tutorialKey,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(0.8);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  useEffect(() => {
    if (isVisible) {
      fadeAnimation.value = withTiming(1, { duration: 300 });
      scaleAnimation.value = withSpring(1);
    }
  }, [isVisible, currentStep]);

  const checkTutorialStatus = async () => {
    try {
      const tutorialCompleted = await AsyncStorage.getItem(
        `${STORAGE_KEYS.TUTORIAL_COMPLETED}_${tutorialKey}`
      );
      
      if (!tutorialCompleted) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      fadeAnimation.value = 0;
      scaleAnimation.value = 0.8;
      
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 150);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.TUTORIAL_COMPLETED}_${tutorialKey}`,
        'true'
      );
      fadeAnimation.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 300);
    } catch (error) {
      console.error('Failed to save tutorial status:', error);
    }
  };

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnimation.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnimation.value,
      transform: [{ scale: scaleAnimation.value }],
    };
  });

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const hasTargetView = !!currentStepData.targetView;

  const renderHighlight = () => {
    if (!hasTargetView || !currentStepData.targetView) return null;

    const { x, y, width, height } = currentStepData.targetView;
    
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        ]}
      >
        {/* Create a hole in the overlay for the target view */}
        <View
          style={{
            position: 'absolute',
            left: x - 8,
            top: y - 8,
            width: width + 16,
            height: height + 16,
            backgroundColor: 'transparent',
            borderRadius: 8,
            borderWidth: 2,
            borderColor: theme.colors.primary,
          }}
        />
      </View>
    );
  };

  const getTooltipPosition = () => {
    if (!hasTargetView || !currentStepData.targetView) {
      return {
        top: SCREEN_HEIGHT / 2 - 150,
        left: 32,
        right: 32,
      };
    }

    const { y, height } = currentStepData.targetView;
    const position = currentStepData.position || 'bottom';
    
    if (position === 'top') {
      return {
        bottom: SCREEN_HEIGHT - y + 16,
        left: 32,
        right: 32,
      };
    } else if (position === 'bottom') {
      return {
        top: y + height + 16,
        left: 32,
        right: 32,
      };
    } else {
      return {
        top: SCREEN_HEIGHT / 2 - 150,
        left: 32,
        right: 32,
      };
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}>
        {/* Dark overlay with highlight */}
        {renderHighlight()}
        
        {/* Skip button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 10,
          }}
          onPress={handleSkip}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
        
        {/* Tutorial content */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 24,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              ...getTooltipPosition(),
            },
            animatedContentStyle,
          ]}
        >
          {/* Icon */}
          {currentStepData.icon && (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.primaryContainer,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                alignSelf: 'center',
              }}
            >
              <Icon
                name={currentStepData.icon}
                size={24}
                color={theme.colors.onPrimaryContainer}
              />
            </View>
          )}
          
          {/* Title */}
          <Text
            variant="titleLarge"
            style={{
              textAlign: 'center',
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            {currentStepData.title}
          </Text>
          
          {/* Description */}
          <Text
            variant="bodyMedium"
            style={{
              textAlign: 'center',
              marginBottom: 24,
              color: theme.colors.onSurfaceVariant,
              lineHeight: 22,
            }}
          >
            {currentStepData.description}
          </Text>
          
          {/* Progress dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            {steps.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === currentStep
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>
          
          {/* Navigation buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              mode="text"
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{ opacity: currentStep === 0 ? 0 : 1 }}
            >
              Back
            </Button>
            
            <Button
              mode="contained"
              onPress={handleNext}
              style={{ flex: 0 }}
            >
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook to easily use app tutorial
export const useAppTutorial = (
  tutorialKey: string,
  steps: TutorialStep[]
): {
  showTutorial: () => void;
  TutorialComponent: React.FC;
} => {
  const [isActive, setIsActive] = useState(false);

  const showTutorial = () => {
    setIsActive(true);
  };

  const TutorialComponent: React.FC = () => {
    if (!isActive) return null;

    return (
      <AppTutorial
        steps={steps}
        onComplete={() => setIsActive(false)}
        tutorialKey={tutorialKey}
      />
    );
  };

  return { showTutorial, TutorialComponent };
};

export default AppTutorial;