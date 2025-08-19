import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  List,
  Surface,
  IconButton,
  Chip,
  ProgressBar,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../../store';
import SecurityService from '../../services/security.service';
import BiometricService from '../../services/biometric.service';
import { globalStyles } from '../../styles/global';
import { formatDate } from '../../utils/date.utils';

interface SecurityScore {
  overall: number;
  factors: {
    passwordStrength: number;
    biometricEnabled: number;
    twoFactorEnabled: number;
    recentActivity: number;
    deviceSecurity: number;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'biometric_enable' | 'suspicious_activity';
  timestamp: Date;
  location?: string;
  device?: string;
  status: 'success' | 'failed' | 'warning';
}

const SecurityDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isLoading, setIsLoading] = useState(true);
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    overall: 0,
    factors: {
      passwordStrength: 0,
      biometricEnabled: 0,
      twoFactorEnabled: 0,
      recentActivity: 0,
      deviceSecurity: 0,
    },
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [deviceSecure, setDeviceSecure] = useState(true);
  const [securityIssues, setSecurityIssues] = useState<string[]>([]);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    setIsLoading(true);
    try {
      // Calculate security score
      const score = await calculateSecurityScore();
      setSecurityScore(score);

      // Check device security
      const deviceCheck = await SecurityService.isDeviceSecure();
      setDeviceSecure(deviceCheck.isSecure);
      setSecurityIssues(deviceCheck.issues);

      // Load recent security events (mock data for now)
      loadSecurityEvents();
    } catch (error) {
      console.error('Failed to check security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSecurityScore = async (): Promise<SecurityScore> => {
    const factors = {
      passwordStrength: 80, // Based on last password change and complexity
      biometricEnabled: 0,
      twoFactorEnabled: 0, // Not implemented yet
      recentActivity: 100, // No suspicious activity
      deviceSecurity: 100,
    };

    // Check biometric status
    const biometricSettings = BiometricService.getSettings();
    if (biometricSettings?.enabled) {
      factors.biometricEnabled = 100;
    }

    // Check device security
    const deviceCheck = await SecurityService.isDeviceSecure();
    if (!deviceCheck.isSecure) {
      factors.deviceSecurity = 50;
    }

    // Calculate overall score
    const weights = {
      passwordStrength: 0.3,
      biometricEnabled: 0.2,
      twoFactorEnabled: 0.2,
      recentActivity: 0.15,
      deviceSecurity: 0.15,
    };

    const overall = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights]);
    }, 0);

    return { overall: Math.round(overall), factors };
  };

  const loadSecurityEvents = () => {
    // Mock security events
    const events: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        timestamp: new Date(),
        device: 'iPhone 14 Pro',
        status: 'success',
      },
      {
        id: '2',
        type: 'biometric_enable',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'success',
      },
      {
        id: '3',
        type: 'login',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        device: 'iPhone 14 Pro',
        status: 'failed',
      },
    ];
    setSecurityEvents(events);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'login': return 'login';
      case 'logout': return 'logout';
      case 'password_change': return 'lock-reset';
      case 'biometric_enable': return 'fingerprint';
      case 'suspicious_activity': return 'alert';
      default: return 'shield';
    }
  };

  const getEventColor = (status: string): string => {
    switch (status) {
      case 'success': return theme.colors.success;
      case 'failed': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const renderSecurityScore = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 16 }]}>
          <View>
            <Text variant="titleLarge">Security Score</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Last updated: {formatDate(new Date())}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text 
              variant="headlineLarge" 
              style={{ color: getScoreColor(securityScore.overall) }}
            >
              {securityScore.overall}
            </Text>
            <Text 
              variant="bodySmall" 
              style={{ color: getScoreColor(securityScore.overall) }}
            >
              {getScoreLabel(securityScore.overall)}
            </Text>
          </View>
        </View>

        <ProgressBar
          progress={securityScore.overall / 100}
          color={getScoreColor(securityScore.overall)}
          style={{ height: 8, borderRadius: 4, marginBottom: 24 }}
        />

        {/* Score Factors */}
        <View>
          {Object.entries(securityScore.factors).map(([key, value]) => (
            <View key={key} style={{ marginBottom: 12 }}>
              <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 4 }]}>
                <Text variant="bodyMedium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text variant="bodySmall" style={{ color: getScoreColor(value) }}>
                  {value}%
                </Text>
              </View>
              <ProgressBar
                progress={value / 100}
                color={getScoreColor(value)}
                style={{ height: 4, borderRadius: 2 }}
              />
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderSecurityRecommendations = () => {
    const recommendations = [];

    if (securityScore.factors.biometricEnabled === 0) {
      recommendations.push({
        title: 'Enable Biometric Login',
        description: 'Use Face ID or Touch ID for quick and secure access',
        action: () => navigation.navigate('BiometricSettings' as never),
        icon: 'fingerprint',
      });
    }

    if (securityScore.factors.twoFactorEnabled === 0) {
      recommendations.push({
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        action: () => Alert.alert('Coming Soon', '2FA will be available in the next update'),
        icon: 'cellphone-key',
      });
    }

    if (securityScore.factors.passwordStrength < 80) {
      recommendations.push({
        title: 'Update Your Password',
        description: 'Use a stronger password for better security',
        action: () => navigation.navigate('ChangePassword' as never),
        icon: 'lock-reset',
      });
    }

    if (recommendations.length === 0) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>
            Security Recommendations
          </Text>
          {recommendations.map((rec, index) => (
            <TouchableOpacity
              key={index}
              onPress={rec.action}
              style={{ marginBottom: 12 }}
            >
              <Surface
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: theme.colors.primaryContainer,
                }}
              >
                <View style={globalStyles.row}>
                  <Icon 
                    name={rec.icon} 
                    size={24} 
                    color={theme.colors.onPrimaryContainer} 
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text 
                      variant="bodyLarge" 
                      style={{ color: theme.colors.onPrimaryContainer }}
                    >
                      {rec.title}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: theme.colors.onPrimaryContainer,
                        opacity: 0.8,
                      }}
                    >
                      {rec.description}
                    </Text>
                  </View>
                  <Icon 
                    name="chevron-right" 
                    size={24} 
                    color={theme.colors.onPrimaryContainer} 
                  />
                </View>
              </Surface>
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderSecurityEvents = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 16 }]}>
          <Text variant="titleMedium">Recent Activity</Text>
          <Button mode="text" onPress={() => navigation.navigate('SecurityLog' as never)} compact>
            View All
          </Button>
        </View>
        
        {securityEvents.map((event, index) => (
          <View key={event.id}>
            <View style={[globalStyles.row, { paddingVertical: 12 }]}>
              <Icon 
                name={getEventIcon(event.type)} 
                size={24} 
                color={getEventColor(event.status)} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="bodyMedium">
                  {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatDate(event.timestamp)}
                  {event.device && ` • ${event.device}`}
                </Text>
              </View>
              <Chip 
                compact 
                mode="flat"
                style={{ 
                  backgroundColor: getEventColor(event.status) + '20',
                }}
                textStyle={{ 
                  fontSize: 11,
                  color: getEventColor(event.status),
                }}
              >
                {event.status}
              </Chip>
            </View>
            {index < securityEvents.length - 1 && <Divider />}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderDeviceSecurityAlert = () => {
    if (deviceSecure) return null;

    return (
      <Card style={{ marginBottom: 16, backgroundColor: theme.colors.errorContainer }}>
        <Card.Content>
          <View style={globalStyles.row}>
            <Icon 
              name="alert-circle" 
              size={24} 
              color={theme.colors.onErrorContainer} 
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text 
                variant="titleMedium" 
                style={{ color: theme.colors.onErrorContainer }}
              >
                Device Security Issues Detected
              </Text>
              {securityIssues.map((issue, index) => (
                <Text 
                  key={index}
                  variant="bodySmall" 
                  style={{ 
                    color: theme.colors.onErrorContainer,
                    marginTop: 4,
                  }}
                >
                  • {issue}
                </Text>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentContainer}>
        {renderDeviceSecurityAlert()}
        {renderSecurityScore()}
        {renderSecurityRecommendations()}
        {renderSecurityEvents()}

        {/* Quick Actions */}
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
          Security Settings
        </Text>
        
        <List.Section>
          <Surface style={{ borderRadius: 12 }}>
            <List.Item
              title="Biometric Settings"
              description="Manage Face ID or Touch ID"
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              onPress={() => navigation.navigate('BiometricSettings' as never)}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Privacy Settings"
              description="Control your data and privacy"
              left={(props) => <List.Icon {...props} icon="shield-lock" />}
              onPress={() => navigation.navigate('PrivacySettings' as never)}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Active Sessions"
              description="Manage devices with access"
              left={(props) => <List.Icon {...props} icon="devices" />}
              onPress={() => navigation.navigate('ActiveSessions' as never)}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Security Log"
              description="View all security events"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => navigation.navigate('SecurityLog' as never)}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Surface>
        </List.Section>
      </View>
    </ScrollView>
  );
};

export default SecurityDashboardScreen;