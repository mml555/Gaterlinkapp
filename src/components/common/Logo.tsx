import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface LogoProps {
  size?: number;
  animated?: boolean;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 60, animated = false, color }) => {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withSequence(
          withSpring(10),
          withSpring(-10),
          withSpring(0)
        ),
        -1,
        true
      );
      
      scale.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const logoColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={animated ? animatedStyle : undefined}>
        <View style={[styles.logoBackground, { backgroundColor: logoColor + '20' }]}>
          <Icon name="door-open" size={size * 0.6} color={logoColor} />
        </View>
      </Animated.View>
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
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Logo;
