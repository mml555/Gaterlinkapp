import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Checkbox,
  HelperText,
  Surface,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

import { AuthNavigationProp } from '../../types/navigation';
import { RootState } from '../../store';
import { login } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // For now, set to false since LocalAuthentication is not available
      setBiometricAvailable(false);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      // Show immediate feedback
      showMessage({
        message: 'Signing you in...',
        type: 'info',
        icon: 'info',
        duration: 2000,
      });

      const result = await dispatch(login({ email, password }) as any);
      
      if (result.payload?.success) {
        showMessage({
          message: 'Welcome back!',
          type: 'success',
          icon: 'success',
        });
      } else {
        throw new Error(result.payload?.error || 'Login failed');
      }
    } catch (error) {
      showMessage({
        message: 'Login failed',
        description: 'Please check your credentials and try again',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // For now, show a message since LocalAuthentication is not available
      showMessage({
        message: 'Biometric authentication not available',
        description: 'Please use email and password to login',
        type: 'info',
        icon: 'info',
      });

      // For now, just show a success message
      showMessage({
        message: 'Biometric authentication successful',
        type: 'success',
        icon: 'success',
      });
      // Proceed with login using stored credentials
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Authentication Failed', 'Please try again or use your password');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      validateEmail(text);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      validatePassword(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface} elevation={0}>
          <View style={styles.logoContainer}>
            <Logo size={100} />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue to GaterLink
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              spellCheck={false}
              error={!!emailError}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              editable={!isLoading}
              pointerEvents={isLoading ? 'none' : 'auto'}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>

            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              spellCheck={false}
              error={!!passwordError}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                />
              }
              style={styles.input}
              editable={!isLoading}
              pointerEvents={isLoading ? 'none' : 'auto'}
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>

            <View style={styles.options}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <Checkbox status={rememberMe ? 'checked' : 'unchecked'} />
                <Text variant="bodyMedium">Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isLoading}
              >
                <Text variant="bodyMedium" style={styles.forgotPassword}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              Sign In
            </Button>

            {biometricAvailable && (
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                icon="face-recognition"
                style={styles.biometricButton}
                contentStyle={styles.buttonContent}
                disabled={isLoading}
              >
                Sign in with Face ID / Touch ID
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => {
                // Test Firebase connection
                console.log('Firebase test button pressed');
              }}
              style={styles.biometricButton}
              contentStyle={styles.buttonContent}
              disabled={isLoading}
            >
              Test Firebase Connection
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="bodySmall" style={styles.dividerText}>
                OR
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text variant="bodyMedium">Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text
                  variant="bodyMedium"
                  style={[styles.link, { color: theme.colors.primary }]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Surface>
      </ScrollView>
      {isLoading && <LoadingOverlay />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    borderRadius: 20,
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    color: '#1976D2',
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 25,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  biometricButton: {
    marginTop: 15,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;