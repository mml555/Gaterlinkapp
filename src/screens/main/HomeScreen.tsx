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
      icon: 'qrcode-scan',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('QRScanner'),
    },
    {
      id: 'saved',
      title: 'Saved Doors',
      icon: 'door',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('SavedDoors'),
    },
    {
      id: 'history',
      title: 'History',
      icon: 'history',
      color: theme.colors.tertiary,
      onPress: () => navigation.navigate('RequestHistory'),
    },
    {
      id: 'admin',
      title: 'Admin',
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Refresh data
      await new Promise(resolve => setTimeout(resolve, 1500));
      showMessage({
        message: 'Updated successfully',
        type: 'success',
        icon: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Failed to refresh',
        type: 'danger',
        icon: 'danger',
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
        return theme.colors.secondary;
      case 'denied':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Surface style={styles.welcomeSection} elevation={0}>
          <View style={styles.welcomeContent}>
            <Avatar.Text
              size={60}
              label={user?.firstName?.[0] + user?.lastName?.[0] || 'U'}
              style={styles.avatar}
            />
            <View style={styles.welcomeText}>
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome back,
              </Text>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
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
                  <Surface style={styles.quickActionSurface} elevation={2}>
                    <Icon
                      name={action.icon}
                      size={40}
                      color={action.color}
                      style={styles.quickActionIcon}
                    />
                    <Text variant="bodyMedium" style={styles.quickActionText}>
                      {action.title}
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Requests
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RequestHistory')}>
              <Text variant="bodyMedium" style={[styles.seeAll, { color: theme.colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {recentRequests.map((request) => (
            <Card key={request.id} style={styles.requestCard} mode="elevated">
              <Card.Content>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text variant="titleMedium" style={styles.requestTitle}>
                      {request.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.requestDoor}>
                      {request.door}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    textStyle={styles.statusChipText}
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(request.status) + '20' },
                    ]}
                  >
                    {request.status.toUpperCase()}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.requestDate}>
                  {request.date.toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={1}>
              <Icon name="door-open" size={30} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={styles.statNumber}>
                12
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Active Doors
              </Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <Icon name="check-circle" size={30} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={styles.statNumber}>
                48
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Approved
              </Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <Icon name="clock-outline" size={30} color={theme.colors.secondary} />
              <Text variant="headlineMedium" style={styles.statNumber}>
                3
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#666666',
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
    marginBottom: 15,
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
    marginHorizontal: -5,
  },
  quickActionCard: {
    width: '50%',
    padding: 5,
  },
  quickActionSurface: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  quickActionIcon: {
    marginBottom: 10,
  },
  quickActionText: {
    textAlign: 'center',
  },
  requestCard: {
    marginBottom: 10,
    borderRadius: 15,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  requestTitle: {
    fontWeight: '600',
  },
  requestDoor: {
    color: '#666666',
    marginTop: 2,
  },
  requestDate: {
    color: '#999999',
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
    marginHorizontal: -5,
  },
  statCard: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    color: '#666666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;