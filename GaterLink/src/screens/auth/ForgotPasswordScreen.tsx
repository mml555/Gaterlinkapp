import React, { useState } from 'react';
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
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthService from '../../services/auth.service';
import { globalStyles } from '../../styles/global';
import { SCREENS, ERROR_MESSAGES, REGEX_PATTERNS, SUCCESS_MESSAGES } from '../../constants';
import LoggingService from '../../services/logging.service';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  typeof SCREENS.FORGOT_PASSWORD
>;

const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError(ERROR_MESSAGES.REQUIRED_FIELD);
      return false;
    }
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      setEmailError(ERROR_MESSAGES.INVALID_EMAIL);
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      LoggingService.logAuth('password_reset_request', email);
      
      const response = await AuthService.resetPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
        LoggingService.logAuth('password_reset_success', email);
        Alert.alert(
          'Email Sent',
          SUCCESS_MESSAGES.PASSWORD_RESET_SENT,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate(SCREENS.LOGIN),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || ERROR_MESSAGES.GENERIC_ERROR);
        LoggingService.logAuth('password_reset_failed', email, { error: response.error });
      }
    } catch (error) {
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
      LoggingService.error('Password reset failed', 'ForgotPassword', error as Error);
    } finally {
      setIsLoading(false);
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
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={{ alignSelf: 'flex-start', marginLeft: -8, marginBottom: 32 }}
        >
          Back to Login
        </Button>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Icon 
            name={isSuccess ? 'check-circle' : 'lock-reset'} 
            size={80} 
            color={isSuccess ? theme.colors.success : theme.colors.primary} 
          />
          <Text variant="headlineLarge" style={{ marginTop: 16 }}>
            {isSuccess ? 'Email Sent!' : 'Reset Password'}
          </Text>
          <Text 
            variant="bodyMedium" 
            style={{ 
              color: theme.colors.onSurfaceVariant, 
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 32,
            }}
          >
            {isSuccess 
              ? 'Check your email for instructions to reset your password.'
              : 'Enter your email address and we\'ll send you instructions to reset your password.'}
          </Text>
        </View>

        {!isSuccess && (
          <>
            <View style={{ marginBottom: 24 }}>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!emailError}
                left={<TextInput.Icon icon="email" />}
                style={{ marginBottom: 4 }}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            </View>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              style={{ marginBottom: 16 }}
            >
              Send Reset Email
            </Button>
          </>
        )}

        {isSuccess && (
          <>
            <Button
              mode="contained"
              onPress={() => navigation.navigate(SCREENS.LOGIN)}
              style={{ marginBottom: 16 }}
            >
              Back to Login
            </Button>
            
            <Button
              mode="text"
              onPress={() => setIsSuccess(false)}
              style={{ marginTop: 8 }}
            >
              Didn't receive email? Try again
            </Button>
          </>
        )}

        <View style={[globalStyles.card, { marginTop: 32, backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={globalStyles.row}>
            <Icon name="information" size={24} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ flex: 1, marginLeft: 12 }}>
              For security reasons, we will send a password reset link to your registered email address. 
              The link will expire in 1 hour.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;