import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   withRepeat,
//   withSequence,
// } from 'react-native-reanimated';

interface LogoProps {
  size?: number;
  animated?: boolean;
  color?: string;
  variant?: 'icon' | 'full' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 60, 
  animated = false, 
  color,
  variant = 'icon' 
}) => {
  const theme = useTheme();
  const logoColor = color || theme.colors.primary;

  if (variant === 'full') {
    return (
      <View style={[styles.container, { width: size * 2, height: size }]}>
        <View style={[styles.logoBackground, { backgroundColor: logoColor + '15' }]}>
          <Icon name="door-open" size={size * 0.4} color={logoColor} />
          <View style={styles.textContainer}>
            <Icon name="link-variant" size={size * 0.3} color={logoColor} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View style={styles.textLogoContainer}>
        <Icon name="door-open" size={size * 0.6} color={logoColor} />
        <View style={styles.textContainer}>
          <Icon name="link-variant" size={size * 0.4} color={logoColor} />
        </View>
      </View>
    );
  }

  // Default icon variant
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.logoBackground, { backgroundColor: logoColor + '15' }]}>
        <Icon name="door-open" size={size * 0.6} color={logoColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    padding: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  textLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: 8,
  },
});

export default Logo;
