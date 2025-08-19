import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { RootState } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';
import LoadingScreen from '../screens/LoadingScreen';
import { lightTheme, darkTheme } from '../styles/theme';

const RootNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.settings.darkMode);

  useEffect(() => {
    // Check authentication status on app start
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    // Hide splash screen when loading is complete
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={isDarkMode ? darkTheme : lightTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;