import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withRepeat,
//   withTiming,
//   withSequence,
// } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoadingScreen: React.FC = () => {
  const theme = useTheme();
  // const scale = useSharedValue(1);
  // const opacity = useSharedValue(0.8);

  // useEffect(() => {
  //   scale.value = withRepeat(
  //     withSequence(
  //       withTiming(1.2, { duration: 800 }),
  //       withTiming(1, { duration: 800 })
  //     ),
  //     -1,
  //     false
  //   );

  //   opacity.value = withRepeat(
  //     withSequence(
  //       withTiming(1, { duration: 800 }),
  //       withTiming(0.8, { duration: 800 })
  //     ),
  //     -1,
  //     false
  //   );
  // }, []);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [{ scale: scale.value }],
  //     opacity: opacity.value,
  //   };
  // });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.primary }]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="door-open" size={80} color="#FFFFFF" />
        </View>
        
        <Text variant="headlineMedium" style={styles.appName}>
          GaterLink
        </Text>
        
        <Text variant="bodyLarge" style={styles.tagline}>
          Seamless Access Control
        </Text>
        
        <ActivityIndicator
          animating={true}
          color="#FFFFFF"
          size="large"
          style={styles.loader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  appName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default LoadingScreen;