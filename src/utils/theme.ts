import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Color palette
const colors = {
  primary: {
    '50': '#E3F2FD',
    '100': '#BBDEFB',
    '200': '#90CAF9',
    '300': '#64B5F6',
    '400': '#42A5F5',
    '500': '#2196F3', // Primary color
    '600': '#1E88E5',
    '700': '#1976D2',
    '800': '#1565C0',
    '900': '#0D47A1',
  },
  secondary: {
    '50': '#F3E5F5',
    '100': '#E1BEE7',
    '200': '#CE93D8',
    '300': '#BA68C8',
    '400': '#AB47BC',
    '500': '#9C27B0', // Secondary color
    '600': '#8E24AA',
    '700': '#7B1FA2',
    '800': '#6A1B9A',
    '900': '#4A148C',
  },
  success: {
    '50': '#E8F5E8',
    '100': '#C8E6C9',
    '200': '#A5D6A7',
    '300': '#81C784',
    '400': '#66BB6A',
    '500': '#4CAF50', // Success color
    '600': '#43A047',
    '700': '#388E3C',
    '800': '#2E7D32',
    '900': '#1B5E20',
  },
  warning: {
    '50': '#FFF8E1',
    '100': '#FFECB3',
    '200': '#FFE082',
    '300': '#FFD54F',
    '400': '#FFCA28',
    '500': '#FFC107', // Warning color
    '600': '#FFB300',
    '700': '#FFA000',
    '800': '#FF8F00',
    '900': '#FF6F00',
  },
  error: {
    '50': '#FFEBEE',
    '100': '#FFCDD2',
    '200': '#EF9A9A',
    '300': '#E57373',
    '400': '#EF5350',
    '500': '#F44336', // Error color
    '600': '#E53935',
    '700': '#D32F2F',
    '800': '#C62828',
    '900': '#B71C1C',
  },
  neutral: {
    '50': '#FAFAFA',
    '100': '#F5F5F5',
    '200': '#EEEEEE',
    '300': '#E0E0E0',
    '400': '#BDBDBD',
    '500': '#9E9E9E',
    '600': '#757575',
    '700': '#616161',
    '800': '#424242',
    '900': '#212121',
  },
  background: {
    light: '#FFFFFF',
    dark: '#121212',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
  },
  text: {
    light: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },
    dark: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
      inverse: '#212121',
    },
  },
};

// Typography
const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    light: 'System',
    thin: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.40,
    shadowRadius: 6.27,
    elevation: 12,
  },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary['500'],
    primaryContainer: colors.primary['100'],
    secondary: colors.secondary['500'],
    secondaryContainer: colors.secondary['100'],
    tertiary: colors.neutral['500'],
    tertiaryContainer: colors.neutral['100'],
    surface: colors.surface.light,
    surfaceVariant: colors.neutral['100'],
    background: colors.background.light,
    error: colors.error['500'],
    errorContainer: colors.error['100'],
    onPrimary: colors.text.light.inverse,
    onPrimaryContainer: colors.text.light.primary,
    onSecondary: colors.text.light.inverse,
    onSecondaryContainer: colors.text.light.primary,
    onTertiary: colors.text.light.inverse,
    onTertiaryContainer: colors.text.light.primary,
    onSurface: colors.text.light.primary,
    onSurfaceVariant: colors.text.light.secondary,
    onBackground: colors.text.light.primary,
    onError: colors.text.light.inverse,
    onErrorContainer: colors.text.light.primary,
    outline: colors.neutral['300'],
    outlineVariant: colors.neutral['200'],
    shadow: colors.neutral['900'],
    scrim: colors.neutral['900'],
    inverseSurface: colors.neutral['800'],
    inverseOnSurface: colors.text.light.inverse,
    inversePrimary: colors.primary['200'],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral['50'],
      level2: colors.neutral['100'],
      level3: colors.neutral['200'],
      level4: colors.neutral['300'],
      level5: colors.neutral['400'],
    },
  },
  dark: false,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary['200'],
    primaryContainer: colors.primary['800'],
    secondary: colors.secondary['200'],
    secondaryContainer: colors.secondary['800'],
    tertiary: colors.neutral['400'],
    tertiaryContainer: colors.neutral['800'],
    surface: colors.surface.dark,
    surfaceVariant: colors.neutral['800'],
    background: colors.background.dark,
    error: colors.error['400'],
    errorContainer: colors.error['800'],
    onPrimary: colors.text.dark.primary,
    onPrimaryContainer: colors.text.dark.inverse,
    onSecondary: colors.text.dark.primary,
    onSecondaryContainer: colors.text.dark.inverse,
    onTertiary: colors.text.dark.primary,
    onTertiaryContainer: colors.text.dark.inverse,
    onSurface: colors.text.dark.primary,
    onSurfaceVariant: colors.text.dark.secondary,
    onBackground: colors.text.dark.primary,
    onError: colors.text.dark.primary,
    onErrorContainer: colors.text.dark.inverse,
    outline: colors.neutral['600'],
    outlineVariant: colors.neutral['700'],
    shadow: colors.neutral['900'],
    scrim: colors.neutral['900'],
    inverseSurface: colors.neutral['100'],
    inverseOnSurface: colors.text.dark.primary,
    inversePrimary: colors.primary['800'],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral['900'],
      level2: colors.neutral['800'],
      level3: colors.neutral['700'],
      level4: colors.neutral['600'],
      level5: colors.neutral['500'],
    },
  },
  dark: true,
};

// Default theme (light)
export const theme = lightTheme;

// Export all theme constants
export const themeConstants = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
