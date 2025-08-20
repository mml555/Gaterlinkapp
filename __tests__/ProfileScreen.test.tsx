import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../src/screens/main/ProfileScreen';

// Mock all the dependencies
jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'customer',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      biometricEnabled: false,
      notificationSettings: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        soundEnabled: true,
        badgeEnabled: true,
      },
    },
    biometricEnabled: false,
    enableBiometricAuth: jest.fn(),
  }),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('react-native-paper', () => ({
  Text: ({ children, ...props }) => children,
  Avatar: ({ children, ...props }) => children,
  Card: ({ children, ...props }) => children,
  List: ({ children, ...props }) => children,
  Switch: ({ children, ...props }) => children,
  Divider: ({ children, ...props }) => children,
  Button: ({ children, ...props }) => children,
  IconButton: ({ children, ...props }) => children,
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      background: '#FAFBFC',
      surface: '#FFFFFF',
      onSurface: '#1A1A1A',
      onSurfaceVariant: '#666666',
      onBackground: '#1A1A1A',
      onPrimary: '#FFFFFF',
    },
  }),
  Portal: ({ children }) => children,
  Modal: ({ children, ...props }) => children,
  TextInput: ({ children, ...props }) => children,
}));

jest.mock('../src/utils/theme', () => ({
  themeConstants: {
    colors: {
      primary: { '500': '#4CAF50' },
      secondary: { '500': '#2196F3' },
      accent: { '500': '#FF9800' },
      error: { '500': '#F44336' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { md: 8, lg: 16, full: 9999 },
    shadows: { sm: {}, lg: {} },
    typography: {
      fontSize: { sm: 14 },
      fontWeight: { medium: '500', bold: '700', semibold: '600' },
      lineHeight: { normal: 1.5 },
    },
  },
}));

describe('ProfileScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('displays user email', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('displays user phone number', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('+1234567890')).toBeTruthy();
  });

  it('displays customer role', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Customer')).toBeTruthy();
  });
});
