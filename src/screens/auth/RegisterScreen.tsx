import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
  Surface,
  Checkbox,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

import { AuthNavigationProp } from '../../types/navigation';
import { RootState } from '../../store';
import { register } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      showMessage({
        message: 'Please fix the errors before continuing',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
              await dispatch(register(registerData) as any);
      
      showMessage({
        message: 'Registration successful!',
        description: 'Please check your email to verify your account',
        type: 'success',
        icon: 'success',
      });
      
      navigation.navigate('Verification', {
        email: formData.email,
        type: 'register',
      });
    } catch (error) {
      showMessage({
        message: 'Registration failed',
        description: 'Please try again later',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
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
            <Logo size={80} />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Join GaterLink for seamless access control
          </Text>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  mode="outlined"
                  error={!!errors.firstName}
                  left={<TextInput.Icon icon="account" />}
                  editable={!isLoading}
                  pointerEvents={isLoading ? 'none' : 'auto'}
                />
                <HelperText type="error" visible={!!errors.firstName}>
                  {errors.firstName}
                </HelperText>
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  mode="outlined"
                  error={!!errors.lastName}
                  editable={!isLoading}
                  pointerEvents={isLoading ? 'none' : 'auto'}
                />
                <HelperText type="error" visible={!!errors.lastName}>
                  {errors.lastName}
                </HelperText>
              </View>
            </View>

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text.toLowerCase())}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              spellCheck={false}
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              editable={!isLoading}
              pointerEvents={isLoading ? 'none' : 'auto'}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <TextInput
              label="Phone (Optional)"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              mode="outlined"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={!!errors.phone}
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              editable={!isLoading}
              pointerEvents={isLoading ? 'none' : 'auto'}
            />
            <HelperText type="error" visible={!!errors.phone}>
              {errors.phone}
            </HelperText>

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              autoCorrect={false}
              spellCheck={false}
              error={!!errors.password}
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
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              autoCorrect={false}
              spellCheck={false}
              error={!!errors.confirmPassword}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                />
              }
              style={styles.input}
              editable={!isLoading}
              pointerEvents={isLoading ? 'none' : 'auto'}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              disabled={isLoading}
            >
              <Checkbox
                status={agreeToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              />
              <Text variant="bodyMedium" style={styles.termsText}>
                I agree to the{' '}
                <Text style={[styles.link, { color: theme.colors.primary }]}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.link, { color: theme.colors.primary }]}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            <HelperText type="error" visible={!!errors.terms}>
              {errors.terms}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
            >
              Create Account
            </Button>

            <View style={styles.footer}>
              <Text variant="bodyMedium">Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text
                  variant="bodyMedium"
                  style={[styles.link, { color: theme.colors.primary }]}
                >
                  Sign In
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
    marginBottom: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
  },
  registerButton: {
    marginTop: 20,
    borderRadius: 25,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  link: {
    fontWeight: 'bold',
  },
});

export default RegisterScreen;