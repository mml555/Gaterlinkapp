import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Checkbox,
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppDispatch, RootState } from '../../store';
import { register, clearError } from '../../store/slices/authSlice';
import { globalStyles } from '../../styles/global';
import { SCREENS, ERROR_MESSAGES, REGEX_PATTERNS, SUCCESS_MESSAGES } from '../../constants';
import LoggingService from '../../services/logging.service';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, typeof SCREENS.REGISTER>;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      errors.name = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!email) {
      errors.email = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!REGEX_PATTERNS.EMAIL.test(email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }

    // Phone validation (optional)
    if (phone && !REGEX_PATTERNS.PHONE.test(phone)) {
      errors.phone = ERROR_MESSAGES.INVALID_PHONE;
    }

    // Password validation
    if (!password) {
      errors.password = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      errors.password = ERROR_MESSAGES.WEAK_PASSWORD;
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && acceptTerms;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      if (!acceptTerms) {
        Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      }
      return;
    }

    try {
      LoggingService.logAuth('register_attempt', undefined, { email, name });
      
      await dispatch(register({ 
        email, 
        password, 
        name: name.trim(),
        phone: phone || undefined 
      })).unwrap();
      
      LoggingService.logAuth('register_success', email);
      Alert.alert('Success', SUCCESS_MESSAGES.REGISTER_SUCCESS);
    } catch (error) {
      LoggingService.logAuth('register_failed', email, { error });
    }
  };

  const renderPasswordStrength = () => {
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasMinLength = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, hasMinLength]
      .filter(Boolean).length;

    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength - 1] || 'Very Weak';
    const strengthColor = ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2196F3'][strength - 1] || '#F44336';

    return (
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <View style={[globalStyles.row, globalStyles.spaceBetween]}>
          <Text variant="bodySmall">Password Strength:</Text>
          <Text variant="bodySmall" style={{ color: strengthColor, fontWeight: 'bold' }}>
            {strengthText}
          </Text>
        </View>
        <View style={{ height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginTop: 4 }}>
          <View 
            style={{ 
              width: `${(strength / 5) * 100}%`, 
              height: '100%', 
              backgroundColor: strengthColor,
              borderRadius: 2,
            }} 
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Icon name="account-plus" size={60} color={theme.colors.primary} />
          <Text variant="headlineLarge" style={{ marginTop: 16 }}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Join GaterLink for secure door access
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <TextInput
            label="Full Name *"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            error={!!formErrors.name}
            left={<TextInput.Icon icon="account" />}
            style={{ marginBottom: 4 }}
          />
          <HelperText type="error" visible={!!formErrors.name}>
            {formErrors.name}
          </HelperText>

          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={!!formErrors.email}
            left={<TextInput.Icon icon="email" />}
            style={{ marginBottom: 4 }}
          />
          <HelperText type="error" visible={!!formErrors.email}>
            {formErrors.email}
          </HelperText>

          <TextInput
            label="Phone (Optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            error={!!formErrors.phone}
            left={<TextInput.Icon icon="phone" />}
            style={{ marginBottom: 4 }}
          />
          <HelperText type="error" visible={!!formErrors.phone}>
            {formErrors.phone}
          </HelperText>

          <TextInput
            label="Password *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            error={!!formErrors.password}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={{ marginBottom: 4 }}
          />
          <HelperText type="error" visible={!!formErrors.password}>
            {formErrors.password}
          </HelperText>
          
          {renderPasswordStrength()}

          <TextInput
            label="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            error={!!formErrors.confirmPassword}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={{ marginBottom: 4 }}
          />
          <HelperText type="error" visible={!!formErrors.confirmPassword}>
            {formErrors.confirmPassword}
          </HelperText>

          <View style={[globalStyles.row, { marginTop: 16, marginBottom: 8 }]}>
            <Checkbox
              status={acceptTerms ? 'checked' : 'unchecked'}
              onPress={() => setAcceptTerms(!acceptTerms)}
            />
            <View style={{ flex: 1 }}>
              <Text onPress={() => setAcceptTerms(!acceptTerms)}>
                I accept the{' '}
                <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                  Terms and Conditions
                </Text>
                {' '}and{' '}
                <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading || !acceptTerms}
          style={{ marginBottom: 16 }}
        >
          Create Account
        </Button>

        <View style={[globalStyles.row, globalStyles.center, { marginTop: 16 }]}>
          <Text>Already have an account? </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate(SCREENS.LOGIN)}
            compact
          >
            Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;