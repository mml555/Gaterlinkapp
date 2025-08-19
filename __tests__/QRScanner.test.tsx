import React from 'react';
import { render } from '@testing-library/react-native';
import QRScannerScreen from '../src/screens/main/QRScannerScreen';

// Mock the camera and permissions
jest.mock('react-native-camera-kit', () => ({
  CameraScreen: 'CameraScreen',
}));

const mockCheck = jest.fn();
const mockRequest = jest.fn();

jest.mock('react-native-permissions', () => ({
  check: mockCheck,
  request: mockRequest,
  PERMISSIONS: {
    IOS: { CAMERA: 'ios.permission.CAMERA' },
    ANDROID: { CAMERA: 'android.permission.CAMERA' },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => ({
    isLoading: false,
    selectedDoor: null,
  }),
}));

jest.mock('react-native-paper', () => ({
  Text: 'Text',
  Button: 'Button',
  Card: 'Card',
  IconButton: 'IconButton',
  Switch: 'Switch',
}));

jest.mock('../src/components/common/TestQRCodeDisplay', () => 'TestQRCodeDisplay');

describe('QRScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<QRScannerScreen />);
    expect(getByText('Checking camera permissions...')).toBeTruthy();
  });

  it('shows test mode in development', () => {
    // Mock __DEV__ to be true
    const originalDev = global.__DEV__;
    global.__DEV__ = true;
    
    // Mock permission check to return denied so it shows test mode
    mockCheck.mockResolvedValue('denied');
    
    const { getByText } = render(<QRScannerScreen />);
    
    // Reset __DEV__
    global.__DEV__ = originalDev;
    
    // The component should show test mode
    expect(getByText('QR Scanner - Test Mode')).toBeTruthy();
  });
});
