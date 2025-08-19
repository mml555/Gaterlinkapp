import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
  Surface,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { RootState } from '../../store';
import AnalyticsService, { 
  DashboardStats, 
  RequestAnalytics,
  TimeSeriesData,
} from '../../services/analytics.service';
import { globalStyles } from '../../styles/global';
import { SCREENS, REQUEST_STATUS, REQUEST_PRIORITY, REQUEST_CATEGORY } from '../../constants';
import { formatDuration } from '../../utils/date.utils';

const { width: screenWidth } = Dimensions.get('window');

const AdminDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requestAnalytics, setRequestAnalytics] = useState<RequestAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [dashboardStats, reqAnalytics] = await Promise.all([
        AnalyticsService.getDashboardStats(),
        AnalyticsService.getRequestAnalytics(dateRange),
      ]);
      
      setStats(dashboardStats);
      setRequestAnalytics(reqAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={{ width: '48%', marginBottom: 12 }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Card>
        <Card.Content>
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {title}
              </Text>
              <Text variant="headlineMedium" style={{ marginTop: 4 }}>
                {value}
              </Text>
              {subtitle && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {subtitle}
                </Text>
              )}
            </View>
            <Icon name={icon} size={32} color={color} />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderLineChart = (data: TimeSeriesData[], title: string) => {
    if (!data || data.length === 0) return null;

    const chartData = {
      labels: data.map(d => d.date),
      datasets: [{
        data: data.map(d => d.value),
      }],
    };

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>{title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 64, data.length * 60)}
              height={200}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.colors.primary,
                labelColor: (opacity = 1) => theme.colors.onSurface,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: theme.colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderPieChart = (data: Record<string, number>, title: string, colors: string[]) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return null;

    const chartData = Object.entries(data)
      .filter(([_, value]) => value > 0)
      .map(([key, value], index) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        population: value,
        color: colors[index % colors.length],
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      }));

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>{title}</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>
    );
  };

  const renderBarChart = (data: Record<number, number>, title: string) => {
    const chartData = {
      labels: Object.keys(data).map(h => `${h}h`),
      datasets: [{
        data: Object.values(data),
      }],
    };

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>{title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={chartData}
              width={Math.max(screenWidth - 64, 24 * 30)}
              height={200}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.colors.primary,
                labelColor: (opacity = 1) => theme.colors.onSurface,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </ScrollView>
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
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={[globalStyles.contentContainer, { paddingTop: 16 }]}>
        <View style={[globalStyles.row, globalStyles.spaceBetween]}>
          <View>
            <Text variant="headlineMedium">Admin Dashboard</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <IconButton
            icon="export"
            onPress={() => {/* Export analytics */}}
          />
        </View>

        {/* Date Range Selector */}
        <SegmentedButtons
          value={dateRange}
          onValueChange={(value) => setDateRange(value as any)}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
          style={{ marginTop: 16, marginBottom: 24 }}
        />
      </View>

      {/* Quick Stats */}
      {stats && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>Overview</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {renderStatCard(
              'Total Requests',
              stats.totalRequests,
              'clipboard-list',
              theme.colors.primary,
              undefined,
              () => navigation.navigate(SCREENS.REQUESTS as never)
            )}
            {renderStatCard(
              'Pending',
              stats.pendingRequests,
              'clock-outline',
              theme.colors.warning,
              `${Math.round((stats.pendingRequests / stats.totalRequests) * 100)}% of total`,
              () => navigation.navigate(SCREENS.REQUESTS as never)
            )}
            {renderStatCard(
              'In Progress',
              stats.inProgressRequests,
              'progress-clock',
              theme.colors.info,
              `${Math.round((stats.inProgressRequests / stats.totalRequests) * 100)}% of total`
            )}
            {renderStatCard(
              'Completed',
              stats.completedRequests,
              'check-circle',
              theme.colors.success,
              `${Math.round((stats.completedRequests / stats.totalRequests) * 100)}% success rate`
            )}
            {renderStatCard(
              'Total Users',
              stats.totalUsers,
              'account-group',
              theme.colors.secondary,
              `${stats.activeUsers} active`,
              () => navigation.navigate(SCREENS.USER_MANAGEMENT as never)
            )}
            {renderStatCard(
              'Avg Response',
              `${stats.averageResponseTime}m`,
              'timer',
              theme.colors.tertiary,
              'First response time'
            )}
          </View>
        </View>
      )}

      {/* Charts */}
      {requestAnalytics && (
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>Analytics</Text>
          
          {/* Request Trend */}
          {renderLineChart(
            dateRange === 'week' ? requestAnalytics.daily : requestAnalytics.monthly,
            'Request Trend'
          )}

          {/* Status Distribution */}
          {renderPieChart(
            requestAnalytics.byStatus,
            'Status Distribution',
            [
              theme.colors.warning,
              theme.colors.info,
              theme.colors.success,
              theme.colors.error,
            ]
          )}

          {/* Category Distribution */}
          {renderPieChart(
            requestAnalytics.byCategory,
            'Category Distribution',
            [
              theme.colors.primary,
              theme.colors.secondary,
              theme.colors.tertiary,
              theme.colors.primaryContainer,
            ]
          )}

          {/* Priority Distribution */}
          {renderPieChart(
            requestAnalytics.byPriority,
            'Priority Distribution',
            [
              theme.colors.error,
              theme.colors.warning,
              theme.colors.info,
            ]
          )}

          {/* Peak Hours */}
          {renderBarChart(requestAnalytics.peakHours, 'Peak Hours')}
        </View>
      )}

      {/* Quick Actions */}
      <View style={[globalStyles.contentContainer, { marginTop: 24 }]}>
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>Quick Actions</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          <Button
            mode="contained-tonal"
            icon="account-group"
            onPress={() => navigation.navigate(SCREENS.USER_MANAGEMENT as never)}
            style={{ margin: 8 }}
          >
            Manage Users
          </Button>
          <Button
            mode="contained-tonal"
            icon="clipboard-list"
            onPress={() => navigation.navigate(SCREENS.REQUESTS as never)}
            style={{ margin: 8 }}
          >
            View Requests
          </Button>
          <Button
            mode="contained-tonal"
            icon="message"
            onPress={() => navigation.navigate(SCREENS.MESSAGES as never)}
            style={{ margin: 8 }}
          >
            Messages
          </Button>
          <Button
            mode="contained-tonal"
            icon="chart-line"
            onPress={() => navigation.navigate(SCREENS.ANALYTICS as never)}
            style={{ margin: 8 }}
          >
            Full Analytics
          </Button>
        </View>
      </View>

      {/* System Status */}
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>System Status</Text>
          
          <View style={globalStyles.row}>
            <Icon 
              name={isOnline ? 'check-circle' : 'alert-circle'} 
              size={20} 
              color={isOnline ? theme.colors.success : theme.colors.error} 
            />
            <Text style={{ marginLeft: 8 }}>
              {isOnline ? 'All systems operational' : 'Operating in offline mode'}
            </Text>
          </View>
          
          <Divider style={{ marginVertical: 12 }} />
          
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Database Status
            </Text>
            <Chip compact mode="flat" style={{ backgroundColor: theme.colors.success + '20' }}>
              Connected
            </Chip>
          </View>
          
          <View style={[globalStyles.row, globalStyles.spaceBetween, { marginTop: 8 }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Real-time Updates
            </Text>
            <Chip 
              compact 
              mode="flat" 
              style={{ 
                backgroundColor: isOnline ? theme.colors.success + '20' : theme.colors.warning + '20' 
              }}
            >
              {isOnline ? 'Active' : 'Paused'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default AdminDashboardScreen;