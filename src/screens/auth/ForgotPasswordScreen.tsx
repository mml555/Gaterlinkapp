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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

import { AuthNavigationProp } from '../../types/navigation';
import Logo from '../../components/common/Logo';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(email);
      
      if (response.success) {
        setIsSubmitted(true);
        showMessage({
          message: 'Reset link sent!',
          description: `Password reset instructions have been sent to ${email}`,
          type: 'success',
          icon: 'success',
          duration: 5000,
        });

        // Navigate to verification screen after a delay
        setTimeout(() => {
          navigation.navigate('Verification', {
            email,
            type: 'reset-password',
          });
        }, 2000);
      } else {
        showMessage({
          message: 'Failed to send reset link',
          description: response.error || 'Please try again later',
          type: 'danger',
          icon: 'danger',
        });
      }
    } catch (error: any) {
      showMessage({
        message: 'Failed to send reset link',
        description: error.message || 'Please try again later',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <Surface style={styles.surface} elevation={0}>
          <View style={styles.successContainer}>
            <Icon name="email-check" size={80} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.successTitle}>
              Check Your Email
            </Text>
            <Text variant="bodyMedium" style={styles.successText}>
              We've sent password reset instructions to:
            </Text>
            <Text variant="bodyLarge" style={styles.emailText}>
              {email}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
              contentStyle={styles.buttonContent}
            >
              Back to Login
            </Button>
          </View>
        </Surface>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface} elevation={0}>
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Logo size={80} />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            Forgot Password?
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            No worries! Enter your email and we'll send you reset instructions.
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text.toLowerCase());
                validateEmail(text);
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!emailError}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              style={styles.resetButton}
              contentStyle={styles.buttonContent}
            >
              Send Reset Link
            </Button>

            <View style={styles.footer}>
              <Text variant="bodyMedium">Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
  backArrow: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
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
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
  },
  resetButton: {
    marginTop: 20,
    borderRadius: 25,
  },
  buttonContent: {
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontWeight: 'bold',
    marginBottom: 30,
  },
  backButton: {
    marginTop: 20,
    borderRadius: 25,
    paddingHorizontal: 30,
  },
});

export default ForgotPasswordScreen;