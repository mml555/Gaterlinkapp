import React from 'react';
import { render } from '@testing-library/react-native';
import QRScannerScreen from '../src/screens/main/QRScannerScreen';

// Note: All dependencies are mocked globally in jest.setup.js

const mockCheck = jest.fn();
const mockRequest = jest.fn();

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
