import { Platform, ViewStyle } from 'react-native';

/**
 * Creates optimized shadow styles for React Native
 * Fixes the "shadow set but cannot calculate shadow efficiently" warning
 */
export const createOptimizedShadow = (
  elevation: number = 4,
  shadowColor: string = '#000000',
  shadowOffset: { width: number; height: number } = { width: 0, height: 2 },
  shadowOpacity: number = 0.25,
  shadowRadius: number = 4,
  backgroundColor: string = '#FFFFFF'
): ViewStyle => {
  if (Platform.OS === 'ios') {
    return {
      backgroundColor,
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
    };
  } else {
    return {
      backgroundColor,
      elevation,
    };
  }
};

/**
 * Creates a card-style shadow with proper background color
 */
export const createCardShadow = (
  backgroundColor: string = '#FFFFFF',
  elevation: number = 4
): ViewStyle => {
  return createOptimizedShadow(elevation, '#000000', { width: 0, height: 2 }, 0.1, 4, backgroundColor);
};

/**
 * Creates a button-style shadow
 */
export const createButtonShadow = (
  backgroundColor: string = '#007AFF',
  elevation: number = 2
): ViewStyle => {
  return createOptimizedShadow(elevation, '#000000', { width: 0, height: 1 }, 0.2, 2, backgroundColor);
};

/**
 * Creates a modal-style shadow
 */
export const createModalShadow = (
  backgroundColor: string = '#FFFFFF',
  elevation: number = 8
): ViewStyle => {
  return createOptimizedShadow(elevation, '#000000', { width: 0, height: 4 }, 0.3, 8, backgroundColor);
};

/**
 * Applies shadow to existing styles
 */
export const applyShadow = (
  existingStyles: ViewStyle,
  shadowConfig: {
    elevation?: number;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
  } = {}
): ViewStyle => {
  const {
    elevation = 4,
    shadowColor = '#000000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.25,
    shadowRadius = 4,
  } = shadowConfig;

  // Ensure background color is set
  const backgroundColor = existingStyles.backgroundColor || '#FFFFFF';

  return {
    ...existingStyles,
    ...createOptimizedShadow(elevation, shadowColor as string, shadowOffset, shadowOpacity, shadowRadius, backgroundColor as string),
  };
};
