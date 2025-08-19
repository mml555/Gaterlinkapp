import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Surface,
  Badge,
  Avatar,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store';
import { setRequests } from '../../store/slices/requestsSlice';
import { setSavedDoors, setScanHistory } from '../../store/slices/doorsSlice';
import DatabaseService from '../../services/database.service';
import ApiService from '../../services/api.service';
import { globalStyles } from '../../styles/global';
import { SCREENS, REQUEST_STATUS } from '../../constants';
import { AccessRequest, Door, ScanHistory } from '../../types';
import { format } from 'date-fns';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  savedDoors: number;
  recentScans: number;
  unreadMessages: number;
}

const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const requests = useSelector((state: RootState) => state.requests.requests);
  const savedDoors = useSelector((state: RootState) => state.doors.savedDoors);
  const scanHistory = useSelector((state: RootState) => state.doors.scanHistory);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const pendingSync = useSelector((state: RootState) => state.sync.pendingCount);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    savedDoors: 0,
    recentScans: 0,
    unreadMessages: 0,
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    updateStats();
  }, [requests, savedDoors, scanHistory]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load requests
      const userRequests = await DatabaseService.getRequests(isAdmin ? undefined : user?.id);
      dispatch(setRequests(userRequests));

      // Load saved doors
      const doors = await DatabaseService.getSavedDoors();
      dispatch(setSavedDoors(doors));

      // Load scan history
      if (user) {
        const history = await DatabaseService.getScanHistory(user.id);
        dispatch(setScanHistory(history));
      }

      // Fetch latest data from API if online
      if (isOnline) {
        await fetchLatestData();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestData = async () => {
    try {
      // Fetch requests from API
      const endpoint = isAdmin ? '/api/requests' : '/api/requests/my';
      const response = await ApiService.get<AccessRequest[]>(endpoint);
      
      if (response.success && response.data) {
        dispatch(setRequests(response.data));
        // Save to local database
        for (const request of response.data) {
          await DatabaseService.saveRequest(request);
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest data:', error);
    }
  };

  const updateStats = () => {
    const pending = requests.filter(r => r.status === REQUEST_STATUS.PENDING).length;
    const completed = requests.filter(r => r.status === REQUEST_STATUS.COMPLETED).length;
    const recentScans = scanHistory.filter(s => {
      const scanDate = new Date(s.timestamp);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return scanDate > dayAgo;
    }).length;

    setStats({
      totalRequests: requests.length,
      pendingRequests: pending,
      completedRequests: completed,
      savedDoors: savedDoors.length,
      recentScans: recentScans,
      unreadMessages: 0, // TODO: Update when messages are implemented
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={{ flex: 1, margin: 4 }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Card style={{ padding: 16 }}>
        <View style={[globalStyles.row, globalStyles.spaceBetween]}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {title}
            </Text>
            <Text variant="headlineMedium" style={{ marginTop: 4 }}>
              {value}
            </Text>
          </View>
          <Icon name={icon} size={32} color={color} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderQuickAction = (
    title: string,
    icon: string,
    color: string,
    onPress: () => void
  ) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', margin: 12 }}>
      <Surface
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 4,
          backgroundColor: color + '20',
        }}
      >
        <Icon name={icon} size={28} color={color} />
      </Surface>
      <Text variant="bodySmall" style={{ marginTop: 8 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentActivity = () => {
    const recentRequests = requests.slice(0, 3);
    
    if (recentRequests.length === 0) {
      return (
        <View style={[globalStyles.centerContainer, { paddingVertical: 32 }]}>
          <Icon name="clipboard-text-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            No recent activity
          </Text>
        </View>
      );
    }

    return recentRequests.map((request) => (
      <TouchableOpacity
        key={request.id}
        onPress={() => navigation.navigate(SCREENS.REQUEST_DETAILS as never, { requestId: request.id } as never)}
      >
        <View style={[globalStyles.row, { paddingVertical: 12 }]}>
          <Avatar.Icon
            size={40}
            icon={request.status === REQUEST_STATUS.COMPLETED ? 'check-circle' : 'clock-outline'}
            style={{
              backgroundColor: request.status === REQUEST_STATUS.COMPLETED 
                ? theme.colors.success + '20'
                : theme.colors.warning + '20',
            }}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {request.reason}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(request.createdAt), 'MMM d, h:mm a')}
            </Text>
          </View>
          <View style={[
            globalStyles.statusBadge,
            request.status === REQUEST_STATUS.PENDING && globalStyles.statusPending,
            request.status === REQUEST_STATUS.IN_PROGRESS && globalStyles.statusInProgress,
            request.status === REQUEST_STATUS.COMPLETED && globalStyles.statusCompleted,
          ]}>
            <Text variant="bodySmall" style={{ textTransform: 'capitalize' }}>
              {request.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Divider />
      </TouchableOpacity>
    ));
  };

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={[globalStyles.contentContainer, { paddingTop: 16 }]}>
        <View style={[globalStyles.row, globalStyles.spaceBetween]}>
          <View>
            <Text variant="headlineMedium">
              Welcome, {user?.name?.split(' ')[0]}!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {isAdmin ? 'Admin Dashboard' : 'Your Dashboard'}
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => navigation.navigate(SCREENS.SETTINGS as never)}
          />
        </View>

        {/* Offline/Sync Status */}
        {(!isOnline || pendingSync > 0) && (
          <Surface style={[globalStyles.card, { backgroundColor: theme.colors.warning + '20', marginTop: 16 }]}>
            <View style={globalStyles.row}>
              <Icon 
                name={isOnline ? 'cloud-sync' : 'cloud-off-outline'} 
                size={24} 
                color={theme.colors.warning} 
              />
              <Text variant="bodySmall" style={{ marginLeft: 12, flex: 1 }}>
                {isOnline 
                  ? `${pendingSync} items pending sync`
                  : 'You are offline. Changes will sync when connected.'}
              </Text>
            </View>
          </Surface>
        )}
      </View>

      {/* Stats Grid */}
      <View style={{ paddingHorizontal: 8, marginTop: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {renderStatCard(
            'Total Requests',
            stats.totalRequests,
            'clipboard-list',
            theme.colors.primary,
            () => navigation.navigate(SCREENS.REQUESTS as never)
          )}
          {renderStatCard(
            'Pending',
            stats.pendingRequests,
            'clock-outline',
            theme.colors.warning,
            () => navigation.navigate(SCREENS.REQUESTS as never)
          )}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {renderStatCard(
            'Completed',
            stats.completedRequests,
            'check-circle',
            theme.colors.success,
            () => navigation.navigate(SCREENS.REQUESTS as never)
          )}
          {renderStatCard(
            'Saved Doors',
            stats.savedDoors,
            'door',
            theme.colors.secondary,
            () => navigation.navigate('SavedDoors' as never)
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={globalStyles.contentContainer}>
        <Text variant="titleLarge" style={{ marginTop: 24, marginBottom: 16 }}>
          Quick Actions
        </Text>
        <View style={[globalStyles.row, { justifyContent: 'space-around' }]}>
          {renderQuickAction(
            'Scan QR',
            'qrcode-scan',
            theme.colors.primary,
            () => navigation.navigate(SCREENS.SCANNER as never)
          )}
          {renderQuickAction(
            'New Request',
            'plus-circle',
            theme.colors.secondary,
            () => navigation.navigate('NewRequest' as never)
          )}
          {renderQuickAction(
            'Messages',
            'message-text',
            theme.colors.tertiary,
            () => navigation.navigate(SCREENS.MESSAGES as never)
          )}
          {isAdmin && renderQuickAction(
            'Analytics',
            'chart-line',
            theme.colors.success,
            () => navigation.navigate(SCREENS.ANALYTICS as never)
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={globalStyles.contentContainer}>
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginTop: 24 }]}>
          <Text variant="titleLarge">Recent Activity</Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate(SCREENS.REQUESTS as never)}
            compact
          >
            View All
          </Button>
        </View>
        <Card style={{ marginTop: 16, padding: 16 }}>
          {renderRecentActivity()}
        </Card>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;