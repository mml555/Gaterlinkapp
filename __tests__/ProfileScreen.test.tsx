import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';
import ProfileScreen from '../src/screens/main/ProfileScreen';
import { lightTheme } from '../src/utils/theme';

// Note: AuthContext, react-redux, react-native-paper, and theme are mocked globally in jest.setup.js

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: require('../src/store/slices/authSlice').default,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          phone: '+1234567890',
          role: 'customer',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <PaperProvider theme={lightTheme}>
        {component}
      </PaperProvider>
    </Provider>
  );
};

describe('ProfileScreen', () => {
  it('renders without crashing', () => {
    const store = createTestStore();
    const { getByText } = renderWithProviders(<ProfileScreen />, store);
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('displays user email', () => {
    const store = createTestStore();
    const { getByText } = renderWithProviders(<ProfileScreen />, store);
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('displays user phone number', () => {
    const store = createTestStore();
    const { getByText } = renderWithProviders(<ProfileScreen />, store);
    expect(getByText('+1234567890')).toBeTruthy();
  });

  it('displays customer role', () => {
    const store = createTestStore();
    const { getByText } = renderWithProviders(<ProfileScreen />, store);
    expect(getByText('Customer')).toBeTruthy();
  });

  it('displays profile title', () => {
    const store = createTestStore();
    const { getByText } = renderWithProviders(<ProfileScreen />, store);
    expect(getByText('Profile')).toBeTruthy();
  });

  it('has edit profile button', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithProviders(<ProfileScreen />, store);
    expect(getByTestId('edit-profile-button')).toBeTruthy();
  });

  it('has logout button', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithProviders(<ProfileScreen />, store);
    expect(getByTestId('logout-button')).toBeTruthy();
  });
});
