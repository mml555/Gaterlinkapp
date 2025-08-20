import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Modern Color palette - GaterLink Brand Colors
const colors = {
  primary: {
    '50': '#E8F5E8',
    '100': '#C8E6C9',
    '200': '#A5D6A7',
    '300': '#81C784',
    '400': '#66BB6A',
    '500': '#4CAF50', // Primary green - GaterLink brand
    '600': '#43A047',
    '700': '#388E3C',
    '800': '#2E7D32',
    '900': '#1B5E20',
  },
  secondary: {
    '50': '#E3F2FD',
    '100': '#BBDEFB',
    '200': '#90CAF9',
    '300': '#64B5F6',
    '400': '#42A5F5',
    '500': '#2196F3', // Secondary blue
    '600': '#1E88E5',
    '700': '#1976D2',
    '800': '#1565C0',
    '900': '#0D47A1',
  },
  accent: {
    '50': '#FFF3E0',
    '100': '#FFE0B2',
    '200': '#FFCC80',
    '300': '#FFB74D',
    '400': '#FFA726',
    '500': '#FF9800', // Accent orange
    '600': '#FB8C00',
    '700': '#F57C00',
    '800': '#EF6C00',
    '900': '#E65100',
  },
  success: {
    '50': '#E8F5E8',
    '100': '#C8E6C9',
    '200': '#A5D6A7',
    '300': '#81C784',
    '400': '#66BB6A',
    '500': '#4CAF50',
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
    '500': '#FFC107',
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
    '500': '#F44336',
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
    light: '#FAFBFC',
    dark: '#121212',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
  },
  text: {
    light: {
      primary: '#1A1A1A',
      secondary: '#666666',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },
    dark: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
      inverse: '#1A1A1A',
    },
  },
};

// Modern Typography
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
    display: 48,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
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

// Modern Shadows
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
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
    tertiary: colors.accent['500'],
    tertiaryContainer: colors.accent['100'],
    surface: colors.surface.light,
    surfaceVariant: colors.neutral['50'],
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
    outline: colors.neutral['200'],
    outlineVariant: colors.neutral['100'],
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
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.display,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.display * typography.lineHeight.tight,
    },
    displayMedium: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    },
    displaySmall: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
    },
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary['400'],
    primaryContainer: colors.primary['800'],
    secondary: colors.secondary['400'],
    secondaryContainer: colors.secondary['800'],
    tertiary: colors.accent['400'],
    tertiaryContainer: colors.accent['800'],
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
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.display,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.display * typography.lineHeight.tight,
    },
    displayMedium: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    },
    displaySmall: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
    },
  },
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
