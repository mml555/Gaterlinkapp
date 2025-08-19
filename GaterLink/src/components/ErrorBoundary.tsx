import React, { Component, ReactNode } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNRestart from 'react-native-restart';
import LoggingService from '../services/logging.service';
import { globalStyles } from '../styles/global';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorCount: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to logging service
    LoggingService.error('Application Error Boundary', 'ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });

    // In production, you would also send this to a crash reporting service
    if (!__DEV__) {
      // Example: Sentry, Bugsnag, Crashlytics, etc.
      // crashReporting.logError(error, errorInfo);
    }
  }

  handleRestart = () => {
    RNRestart.Restart();
  };

  handleReportIssue = () => {
    const subject = encodeURIComponent('GaterLink App Error Report');
    const body = encodeURIComponent(`
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace available'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack available'}
    `);
    
    Linking.openURL(`mailto:support@gaterlink.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRestart={this.handleRestart}
          onReport={this.handleReportIssue}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: any;
  onRestart: () => void;
  onReport: () => void;
}> = ({ error, errorInfo, onRestart, onReport }) => {
  const theme = useTheme();

  return (
    <View style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingVertical: 64,
        }}
      >
        {/* Error Icon */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.errorContainer,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon
              name="alert-circle-outline"
              size={64}
              color={theme.colors.onErrorContainer}
            />
          </View>
        </View>

        {/* Error Title */}
        <Text
          variant="headlineMedium"
          style={{
            textAlign: 'center',
            marginBottom: 16,
            color: theme.colors.error,
          }}
        >
          Oops! Something went wrong
        </Text>

        {/* Error Description */}
        <Text
          variant="bodyLarge"
          style={{
            textAlign: 'center',
            marginBottom: 32,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          We encountered an unexpected error. Our team has been notified and we're working on a fix.
        </Text>

        {/* Error Details (Dev Mode Only) */}
        {__DEV__ && error && (
          <Surface
            style={{
              padding: 16,
              borderRadius: 8,
              marginBottom: 32,
              maxHeight: SCREEN_HEIGHT * 0.3,
            }}
          >
            <Text
              variant="titleSmall"
              style={{ marginBottom: 8, color: theme.colors.error }}
            >
              Error Details (Dev Mode)
            </Text>
            <ScrollView>
              <Text
                variant="bodySmall"
                style={{ fontFamily: 'monospace', color: theme.colors.onSurfaceVariant }}
              >
                {error.message}
              </Text>
              {error.stack && (
                <Text
                  variant="bodySmall"
                  style={{
                    fontFamily: 'monospace',
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 8,
                  }}
                >
                  {error.stack}
                </Text>
              )}
            </ScrollView>
          </Surface>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            mode="contained"
            onPress={onRestart}
            icon="restart"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Restart App
          </Button>

          <Button
            mode="outlined"
            onPress={onReport}
            icon="bug"
          >
            Report Issue
          </Button>
        </View>

        {/* Help Text */}
        <Text
          variant="bodySmall"
          style={{
            textAlign: 'center',
            marginTop: 32,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          If this problem persists, please contact our support team at support@gaterlink.com
        </Text>
      </ScrollView>
    </View>
  );
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;