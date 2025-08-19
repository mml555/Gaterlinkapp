import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  SegmentedButtons,
  Button,
  Menu,
  IconButton,
  DataTable,
  Divider,
  Surface,
  Portal,
  Dialog,
  RadioButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart, ContributionGraph } from 'react-native-chart-kit';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  subDays,
} from 'date-fns';
import AnalyticsService, { 
  RequestAnalytics, 
  UserAnalytics, 
  DoorAnalytics,
  TimeSeriesData,
} from '../../services/analytics.service';
import { globalStyles } from '../../styles/global';
import { REQUEST_STATUS, REQUEST_PRIORITY, REQUEST_CATEGORY } from '../../constants';

const { width: screenWidth } = Dimensions.get('window');

type ChartType = 'line' | 'bar' | 'pie' | 'contribution';
type MetricType = 'requests' | 'users' | 'doors' | 'performance';

const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [metricType, setMetricType] = useState<MetricType>('requests');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  
  const [requestAnalytics, setRequestAnalytics] = useState<RequestAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [doorAnalytics, setDoorAnalytics] = useState<DoorAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [reqAnalytics, userStats, doorStats] = await Promise.all([
        AnalyticsService.getRequestAnalytics(dateRange),
        AnalyticsService.getUserAnalytics(),
        AnalyticsService.getDoorAnalytics(),
      ]);
      
      setRequestAnalytics(reqAnalytics);
      setUserAnalytics(userStats);
      setDoorAnalytics(doorStats);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setShowExportDialog(false);
    
    try {
      const data = await AnalyticsService.exportAnalytics(exportFormat);
      
      await Share.share({
        title: `GaterLink Analytics Export - ${format(new Date(), 'yyyy-MM-dd')}`,
        message: exportFormat === 'csv' ? data : undefined,
        url: exportFormat === 'json' ? `data:application/json,${encodeURIComponent(data)}` : undefined,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export analytics data');
    }
  };

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
              height={220}
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

  const renderBarChart = (data: Record<string, number> | Record<number, number>, title: string) => {
    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData = {
      labels: labels.map(l => typeof l === 'number' ? `${l}h` : l),
      datasets: [{
        data: values,
      }],
    };

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>{title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={chartData}
              width={Math.max(screenWidth - 64, labels.length * 40)}
              height={220}
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
            height={220}
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

  const renderContributionGraph = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 104); // ~15 weeks
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const commitsData = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      count: Math.floor(Math.random() * 5), // Mock data
    }));

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Activity Heatmap</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ContributionGraph
              values={commitsData}
              endDate={endDate}
              numDays={105}
              width={screenWidth * 1.5}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
                labelColor: () => theme.colors.onSurface,
              }}
            />
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderDataTable = () => {
    if (!userAnalytics?.topUsers || userAnalytics.topUsers.length === 0) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Top Users</Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title numeric>Requests</DataTable.Title>
              <DataTable.Title numeric>Avg/Month</DataTable.Title>
            </DataTable.Header>

            {userAnalytics.topUsers.slice(0, 5).map((user, index) => (
              <DataTable.Row key={user.userId}>
                <DataTable.Cell>{user.name}</DataTable.Cell>
                <DataTable.Cell numeric>{user.requestCount}</DataTable.Cell>
                <DataTable.Cell numeric>
                  {Math.round(user.requestCount / 3)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderMetricCards = () => {
    const metrics = [];
    
    if (metricType === 'requests' && requestAnalytics) {
      metrics.push(
        { label: 'Avg Response Time', value: `${requestAnalytics.averageResponseTime}m`, icon: 'clock-fast' },
        { label: 'Avg Completion Time', value: `${requestAnalytics.averageCompletionTime}h`, icon: 'clock-check' },
      );
    } else if (metricType === 'users' && userAnalytics) {
      metrics.push(
        { label: 'Total Users', value: userAnalytics.totalUsers, icon: 'account-group' },
        { label: 'Active Users', value: userAnalytics.activeUsers, icon: 'account-check' },
        { label: 'New This Month', value: userAnalytics.newUsersThisMonth, icon: 'account-plus' },
      );
    } else if (metricType === 'doors' && doorAnalytics) {
      metrics.push(
        { label: 'Total Doors', value: doorAnalytics.totalDoors, icon: 'door' },
        { label: 'Total Scans', value: doorAnalytics.totalScans, icon: 'qrcode-scan' },
        { label: 'Success Rate', value: `${doorAnalytics.successRate.toFixed(1)}%`, icon: 'check-circle' },
      );
    }
    
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        {metrics.map((metric, index) => (
          <Surface
            key={index}
            style={{
              width: '31%',
              margin: '1%',
              padding: 16,
              alignItems: 'center',
              borderRadius: 8,
            }}
            elevation={2}
          >
            <Icon name={metric.icon} size={24} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={{ marginTop: 8 }}>
              {metric.value}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {metric.label}
            </Text>
          </Surface>
        ))}
      </View>
    );
  };

  const renderCharts = () => {
    switch (metricType) {
      case 'requests':
        if (!requestAnalytics) return null;
        
        if (chartType === 'line') {
          return renderLineChart(
            dateRange === 'week' ? requestAnalytics.daily : requestAnalytics.monthly,
            'Request Trend'
          );
        } else if (chartType === 'bar') {
          return renderBarChart(requestAnalytics.peakHours, 'Requests by Hour');
        } else if (chartType === 'pie') {
          return (
            <>
              {renderPieChart(
                requestAnalytics.byStatus,
                'By Status',
                [theme.colors.warning, theme.colors.info, theme.colors.success, theme.colors.error]
              )}
              {renderPieChart(
                requestAnalytics.byCategory,
                'By Category',
                [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary, theme.colors.primaryContainer]
              )}
            </>
          );
        }
        break;
        
      case 'users':
        if (!userAnalytics) return null;
        return (
          <>
            {renderDataTable()}
            {renderPieChart(
              userAnalytics.usersByRole,
              'Users by Role',
              [theme.colors.primary, theme.colors.secondary]
            )}
          </>
        );
        
      case 'doors':
        if (!doorAnalytics) return null;
        return renderBarChart(doorAnalytics.scansByHour, 'Scans by Hour');
        
      case 'performance':
        return renderContributionGraph();
    }
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
      <View style={[globalStyles.contentContainer, { paddingTop: 16 }]}>
        {/* Header */}
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 16 }]}>
          <Text variant="headlineMedium">Analytics</Text>
          <IconButton
            icon="export"
            onPress={() => setShowExportDialog(true)}
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
          style={{ marginBottom: 16 }}
        />

        {/* Metric Type Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          {(['requests', 'users', 'doors', 'performance'] as MetricType[]).map((type) => (
            <Button
              key={type}
              mode={metricType === type ? 'contained' : 'outlined'}
              onPress={() => setMetricType(type)}
              style={{ marginRight: 8 }}
              compact
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </ScrollView>

        {/* Chart Type Selector (for applicable metrics) */}
        {metricType === 'requests' && (
          <View style={[globalStyles.row, { marginBottom: 16 }]}>
            {(['line', 'bar', 'pie'] as ChartType[]).map((type) => (
              <IconButton
                key={type}
                icon={
                  type === 'line' ? 'chart-line' :
                  type === 'bar' ? 'chart-bar' :
                  'chart-pie'
                }
                mode={chartType === type ? 'contained' : 'outlined'}
                onPress={() => setChartType(type)}
                style={{ marginRight: 8 }}
              />
            ))}
          </View>
        )}

        {/* Metric Cards */}
        {renderMetricCards()}

        {/* Charts */}
        {renderCharts()}
      </View>

      {/* Export Dialog */}
      <Portal>
        <Dialog visible={showExportDialog} onDismiss={() => setShowExportDialog(false)}>
          <Dialog.Title>Export Analytics</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => setExportFormat(value as any)}
              value={exportFormat}
            >
              <RadioButton.Item label="CSV Format" value="csv" />
              <RadioButton.Item label="JSON Format" value="json" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onPress={handleExport}>Export</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

export default AnalyticsScreen;