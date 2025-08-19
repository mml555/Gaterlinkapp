import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Button,
  Text,
  useTheme,
  Surface,
  HelperText,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

import { AuthNavigationProp, VerificationRouteProp } from '../../types/navigation';
import Logo from '../../components/common/Logo';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { authService } from '../../services/authService';

const VerificationScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const route = useRoute<VerificationRouteProp>();
  const { email, type } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const lastFilledIndex = Math.min(index + pastedCode.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError('');
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyEmail(verificationCode);
      
      if (response.success) {
        showMessage({
          message: type === 'register' ? 'Email verified!' : 'Code verified!',
          description: type === 'register' 
            ? 'Your account has been activated successfully' 
            : 'You can now reset your password',
          type: 'success',
          icon: 'success',
        });

        if (type === 'register') {
          navigation.navigate('Login');
        } else {
          // Navigate to reset password screen (to be implemented)
          navigation.navigate('Login');
        }
      } else {
        setError('Invalid verification code. Please try again.');
        showMessage({
          message: 'Verification failed',
          description: response.error || 'Please check the code and try again',
          type: 'danger',
          icon: 'danger',
        });
      }
    } catch (error: any) {
      setError('Invalid verification code. Please try again.');
      showMessage({
        message: 'Verification failed',
        description: error.message || 'Please check the code and try again',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCanResend(false);
    setResendTimer(60);
    
    try {
      const response = await authService.resendVerificationCode(email);
      
      if (response.success) {
        showMessage({
          message: 'Code resent!',
          description: `A new verification code has been sent to ${email}`,
          type: 'success',
          icon: 'success',
        });
      } else {
        showMessage({
          message: 'Failed to resend code',
          description: response.error || 'Please try again later',
          type: 'danger',
          icon: 'danger',
        });
        setCanResend(true);
        return;
      }

      // Restart timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showMessage({
        message: 'Failed to resend code',
        description: 'Please try again later',
        type: 'danger',
        icon: 'danger',
      });
      setCanResend(true);
    }
  };

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
            Verify Your {type === 'register' ? 'Email' : 'Identity'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            We've sent a 6-digit verification code to
          </Text>
          <Text variant="bodyLarge" style={styles.email}>
            {email}
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  { borderColor: error ? theme.colors.error : theme.colors.outline },
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={isLoading}
            disabled={isLoading || code.join('').length !== 6}
            style={styles.verifyButton}
            contentStyle={styles.buttonContent}
          >
            Verify Code
          </Button>

          <View style={styles.resendContainer}>
            <Text variant="bodyMedium" style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode}>
                <Text
                  variant="bodyMedium"
                  style={[styles.link, { color: theme.colors.primary }]}
                >
                  Resend Code
                </Text>
              </TouchableOpacity>
            ) : (
              <Text variant="bodyMedium" style={styles.timer}>
                Resend in {resendTimer}s
              </Text>
            )}
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
    marginBottom: 5,
  },
  email: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  verifyButton: {
    marginTop: 20,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  resendText: {
    color: '#666666',
  },
  link: {
    fontWeight: 'bold',
  },
  timer: {
    color: '#999999',
    fontWeight: '500',
  },
});

export default VerificationScreen;
