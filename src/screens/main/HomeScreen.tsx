import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  Card,
  IconButton,
  Chip,
  Avatar,
  FAB,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

import { HomeNavigationProp } from '../../types/navigation';
import { RootState } from '../../store';
import { UserRole } from '../../types';
import { authService } from '../../services/authService';
import { firebaseService } from '../../services/firebaseService';
import Logo from '../../components/common/Logo';
import { ServiceStatusIndicator } from '../../components/common/ServiceStatusIndicator';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  const quickActions = [
    {
      id: 'scan',
      title: 'Scan QR',
      subtitle: 'Access doors',
      icon: 'qrcode-scan',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('QRScanner'),
    },
    {
      id: 'saved',
      title: 'Saved Doors',
      subtitle: 'Quick access',
      icon: 'door',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('SavedDoors'),
    },
    {
      id: 'history',
      title: 'History',
      subtitle: 'View activity',
      icon: 'history',
      color: theme.colors.tertiary,
      onPress: () => navigation.navigate('RequestHistory'),
    },
    {
      id: 'test',
      title: 'Test Firebase',
      subtitle: 'Check permissions',
      icon: 'database',
      color: theme.colors.tertiary,
      onPress: () => testFirebasePermissions(),
    },
    {
      id: 'admin',
      title: 'Admin',
      subtitle: 'Manage access',
      icon: 'shield-account',
      color: theme.colors.error,
      onPress: () => navigation.navigate('AdminDashboard'),
      visible: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    },
  ];

  const recentRequests = [
    {
      id: '1',
      title: 'Main Entrance Access',
      status: 'approved',
      date: new Date(),
      door: 'Building A - Main Door',
    },
    {
      id: '2',
      title: 'Parking Gate Access',
      status: 'pending',
      date: new Date(Date.now() - 86400000),
      door: 'Parking Level B2',
    },
  ];

  const testFirebasePermissions = async () => {
    try {
      console.log('🧪 Testing Firebase permissions from HomeScreen...');
      await firebaseService.testFirestorePermissions();
      showMessage({
        message: 'Firebase Test Complete',
        description: 'Check console for results',
        type: 'info',
      });
    } catch (error) {
      console.error('Error testing Firebase permissions:', error);
      showMessage({
        message: 'Firebase Test Failed',
        description: 'Check console for details',
        type: 'danger',
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [userResponse, requestsResponse] = await Promise.all([
        authService.getCurrentUser(),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]);

      if (userResponse.success) {
        // Update user data in Redux store
      }

      showMessage({
        message: 'Updated successfully',
        type: 'success',
      });
    } catch (error: any) {
      showMessage({
        message: 'Failed to refresh',
        description: error.message || 'Please try again',
        type: 'danger',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.tertiary;
      case 'denied':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <Surface style={[styles.welcomeSection, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeHeader}>
              <Avatar.Text
                size={60}
                label={(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || 'U'}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
              />
              <View style={styles.welcomeText}>
                <Text variant="titleMedium" style={[styles.welcomeTitle, { color: theme.colors.onSurface }]}>
                  Welcome back,
                </Text>
                <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.primary }]}>
                  {user?.firstName} {user?.lastName}
                </Text>
              </View>
            </View>
            <Logo size={40} variant="icon" />
          </View>
        </Surface>

        {/* Service Status Indicator */}
        <ServiceStatusIndicator showDetails={true} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions
              .filter(action => action.visible !== false)
              .map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={action.onPress}
                >
                  <Surface style={[styles.quickActionSurface, { backgroundColor: theme.colors.surface }]} elevation={2}>
                    <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                      <Icon
                        name={action.icon}
                        size={32}
                        color={action.color}
                      />
                    </View>
                    <Text variant="titleMedium" style={[styles.quickActionText, { color: theme.colors.onSurface }]}>
                      {action.title}
                    </Text>
                    <Text variant="bodySmall" style={[styles.quickActionSubtext, { color: theme.colors.onSurface }]}>
                      {action.subtitle}
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Recent Requests
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RequestHistory')}>
              <Text variant="bodyMedium" style={[styles.seeAll, { color: theme.colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {recentRequests.map((request) => (
            <Card key={request.id} style={[styles.requestCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text variant="titleMedium" style={[styles.requestTitle, { color: theme.colors.onSurface }]}>
                      {request.title}
                    </Text>
                    <Text variant="bodySmall" style={[styles.requestDoor, { color: theme.colors.onSurface }]}>
                      {request.door}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    textStyle={[styles.statusChipText, { color: getStatusColor(request.status) }]}
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(request.status) + '15' },
                    ]}
                  >
                    {request.status.toUpperCase()}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={[styles.requestDate, { color: theme.colors.onSurface }]}>
                  {request.date.toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Overview
          </Text>
          <View style={styles.statsGrid}>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="door-open" size={24} color={theme.colors.primary} />
              </View>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>
                12
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
                Active Doors
              </Text>
            </Surface>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="check-circle" size={24} color={theme.colors.primary} />
              </View>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>
                48
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
                Approved
              </Text>
            </Surface>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.tertiary + '15' }]}>
                <Icon name="clock-outline" size={24} color={theme.colors.tertiary} />
              </View>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.tertiary }]}>
                3
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
                Pending
              </Text>
            </Surface>
          </View>
        </View>
      </ScrollView>

      <FAB
        icon="qrcode-scan"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('QRScanner')}
        label="Scan"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeSection: {
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    opacity: 0.8,
  },
  userName: {
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  seeAll: {
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: '50%',
    padding: 6,
  },
  quickActionSurface: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestTitle: {
    fontWeight: '600',
  },
  requestDoor: {
    opacity: 0.7,
    marginTop: 2,
  },
  requestDate: {
    opacity: 0.6,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  statCard: {
    flex: 1,
    margin: 6,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

export default HomeScreen;