import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular' | 'button';
  lines?: number; // For text variant
  spacing?: number; // Space between lines
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'rectangular',
  lines = 1,
  spacing = 8,
}) => {
  const theme = useTheme();
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const getSkeletonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'text':
        return {
          ...baseStyle,
          height: 16,
          borderRadius: borderRadius || 4,
          width: width,
        };
      case 'circular':
        const size = typeof width === 'number' ? width : 48;
        return {
          ...baseStyle,
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'button':
        return {
          ...baseStyle,
          width: width,
          height: height || 48,
          borderRadius: borderRadius || 24,
        };
      case 'rectangular':
      default:
        return {
          ...baseStyle,
          width: width,
          height: height,
          borderRadius: borderRadius || 8,
        };
    }
  };

  const renderTextLines = () => {
    return Array.from({ length: lines }).map((_, index) => {
      const isLastLine = index === lines - 1;
      const lineWidth = isLastLine ? '80%' : '100%';
      
      return (
        <View
          key={index}
          style={[
            getSkeletonStyle(),
            { width: lineWidth },
            index > 0 && { marginTop: spacing },
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                width: 200,
              },
              animatedStyle,
            ]}
          />
        </View>
      );
    });
  };

  if (variant === 'text' && lines > 1) {
    return <View style={style}>{renderTextLines()}</View>;
  }

  return (
    <View style={[getSkeletonStyle(), style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            width: 200,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

// Preset skeleton components
export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <LoadingSkeleton width="60%" height={18} />
          <LoadingSkeleton width="40%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <LoadingSkeleton variant="text" lines={3} />
    </View>
  );
};

export const ListItemSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      <LoadingSkeleton variant="circular" width={48} height={48} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <LoadingSkeleton width="70%" height={18} />
        <LoadingSkeleton width="50%" height={14} style={{ marginTop: 4 }} />
      </View>
      <LoadingSkeleton width={24} height={24} borderRadius={4} />
    </View>
  );
};

export const DashboardStatSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          flex: 1,
        },
        style,
      ]}
    >
      <LoadingSkeleton variant="circular" width={40} height={40} />
      <LoadingSkeleton width="80%" height={24} style={{ marginTop: 12 }} />
      <LoadingSkeleton width="60%" height={16} style={{ marginTop: 4 }} />
    </View>
  );
};

export const MessageSkeleton: React.FC<{ isOwn?: boolean; style?: ViewStyle }> = ({
  isOwn = false,
  style,
}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          marginBottom: 16,
          paddingHorizontal: 16,
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      {!isOwn && <LoadingSkeleton variant="circular" width={32} height={32} />}
      <View
        style={{
          maxWidth: '70%',
          marginLeft: isOwn ? 0 : 8,
          marginRight: isOwn ? 8 : 0,
        }}
      >
        <LoadingSkeleton
          width={200}
          height={60}
          borderRadius={16}
          style={{
            backgroundColor: isOwn 
              ? theme.colors.primaryContainer 
              : theme.colors.surfaceVariant,
          }}
        />
      </View>
    </View>
  );
};

export const ChartSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          height: 250,
        },
        style,
      ]}
    >
      <LoadingSkeleton width="60%" height={20} />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginTop: 20,
          paddingBottom: 20,
        }}
      >
        {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.8].map((height, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              marginHorizontal: 4,
            }}
          >
            <LoadingSkeleton
              width="100%"
              height={`${height * 100}%`}
              borderRadius={4}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default LoadingSkeleton;