import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  Checkbox,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppDispatch, RootState } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import AuthService from '../../services/auth.service';
import { globalStyles } from '../../styles/global';
import { SCREENS, ERROR_MESSAGES, STORAGE_KEYS, REGEX_PATTERNS } from '../../constants';
import LoggingService from '../../services/logging.service';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, typeof SCREENS.LOGIN>;

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
    loadStoredCredentials();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const checkBiometrics = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();
      setBiometricsAvailable(available);
    } catch (error) {
      LoggingService.error('Failed to check biometrics', 'Login', error as Error);
    }
  };

  const loadStoredCredentials = async () => {
    try {
      const storedRememberMe = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedRememberMe) {
        const credentials = await AuthService.getStoredCredentials();
        if (credentials) {
          setEmail(credentials.email);
          setRememberMe(true);
        }
      }
    } catch (error) {
      LoggingService.error('Failed to load stored credentials', 'Login', error as Error);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!email) {
      setEmailError(ERROR_MESSAGES.REQUIRED_FIELD);
      isValid = false;
    } else if (!REGEX_PATTERNS.EMAIL.test(email)) {
      setEmailError(ERROR_MESSAGES.INVALID_EMAIL);
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError(ERROR_MESSAGES.REQUIRED_FIELD);
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      LoggingService.logAuth('login_attempt', undefined, { email });
      
      await dispatch(login({ email, password })).unwrap();
      
      if (rememberMe) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'true');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }

      LoggingService.logAuth('login_success', email);
    } catch (error) {
      LoggingService.logAuth('login_failed', email, { error });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to login',
      });

      if (success) {
        const credentials = await AuthService.getStoredCredentials();
        if (credentials) {
          await dispatch(
            login({ email: credentials.email, password: credentials.password })
          ).unwrap();
          LoggingService.logAuth('biometric_login_success', credentials.email);
        } else {
          Alert.alert('Error', 'No stored credentials found');
        }
      }
    } catch (error) {
      LoggingService.error('Biometric login failed', 'Login', error as Error);
      Alert.alert('Authentication Failed', 'Please try again or use your password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          globalStyles.contentContainer,
          { justifyContent: 'center', minHeight: '100%' },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Icon name="shield-lock" size={80} color={theme.colors.primary} />
          <Text variant="headlineLarge" style={{ marginTop: 16 }}>
            GaterLink
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Secure Door Access Management
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={!!emailError}
            left={<TextInput.Icon icon="email" />}
            style={{ marginBottom: 8 }}
          />
          {emailError ? (
            <Text style={[globalStyles.error, { marginBottom: 8 }]}>{emailError}</Text>
          ) : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            error={!!passwordError}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={{ marginBottom: 8 }}
          />
          {passwordError ? (
            <Text style={[globalStyles.error, { marginBottom: 8 }]}>{passwordError}</Text>
          ) : null}

          <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 24 }]}>
            <View style={globalStyles.row}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text onPress={() => setRememberMe(!rememberMe)}>Remember me</Text>
            </View>
            <Button
              mode="text"
              onPress={() => navigation.navigate(SCREENS.FORGOT_PASSWORD)}
              compact
            >
              Forgot password?
            </Button>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={{ marginBottom: 16 }}
        >
          Login
        </Button>

        {biometricsAvailable && rememberMe && (
          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            icon="fingerprint"
            style={{ marginBottom: 16 }}
            disabled={isLoading}
          >
            Login with Biometrics
          </Button>
        )}

        <View style={[globalStyles.row, globalStyles.center, { marginTop: 16 }]}>
          <Text>Don't have an account? </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate(SCREENS.REGISTER)}
            compact
          >
            Sign Up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;