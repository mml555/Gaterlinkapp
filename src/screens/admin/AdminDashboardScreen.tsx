import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Badge,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchPendingRequests,
  fetchRequests,
  approveRequest,
  denyRequest,
} from '../../store/slices/requestSlice';
import {
  fetchSites,
  fetchDoors,
} from '../../store/slices/doorSlice';
import { AccessRequest, RequestStatus, UserRole } from '../../types';

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const { user } = useSelector((state: RootState) => state.auth);
  const { pendingRequests, requests, isLoading } = useSelector((state: RootState) => state.requests);
  const { sites, doors, isLoading: doorsLoading } = useSelector((state: RootState) => state.doors);

  // Check if user has admin permissions
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchPendingRequests() as any),
        dispatch(fetchRequests({}) as any),
        dispatch(fetchSites() as any),
        dispatch(fetchDoors() as any),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    try {
      Alert.alert(
        'Approve Access Request',
        `Are you sure you want to approve access to ${request.doorName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              await dispatch(approveRequest({
                requestId: request.id,
                adminNotes: 'Approved by admin',
              }) as any);
              
              Alert.alert('Success', 'Access request approved successfully');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleDenyRequest = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowDenyDialog(true);
  };

  const confirmDenyRequest = async () => {
    if (!selectedRequest || !denyReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for denial');
      return;
    }

    try {
      await dispatch(denyRequest({
        requestId: selectedRequest.id,
        reason: denyReason,
      }) as any);
      
      setShowDenyDialog(false);
      setDenyReason('');
      setSelectedRequest(null);
      Alert.alert('Success', 'Access request denied');
    } catch (error) {
      Alert.alert('Error', 'Failed to deny request');
    }
  };

  const handleMessageRequest = (request: AccessRequest) => {
    // Navigate to chat screen
    navigation.navigate('Chat' as any, { 
      chatId: `request_${request.id}`,
      requestId: request.id,
    });
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return theme.colors.warning;
      case RequestStatus.APPROVED:
        return theme.colors.primary;
      case RequestStatus.DENIED:
        return theme.colors.error;
      case RequestStatus.DOCUMENTATION_REQUIRED:
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'Pending';
      case RequestStatus.APPROVED:
        return 'Approved';
      case RequestStatus.DENIED:
        return 'Denied';
      case RequestStatus.DOCUMENTATION_REQUIRED:
        return 'Docs Required';
      default:
        return status;
    }
  };

  const getRequestPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  // Calculate dashboard statistics
  const totalRequests = requests.length;
  const pendingCount = pendingRequests.length;
  const approvedCount = requests.filter(r => r.status === RequestStatus.APPROVED).length;
  const deniedCount = requests.filter(r => r.status === RequestStatus.DENIED).length;
  const docsRequiredCount = requests.filter(r => r.status === RequestStatus.DOCUMENTATION_REQUIRED).length;

  const totalSites = sites.length;
  const totalDoors = doors.length;
  const activeSites = sites.filter(s => s.status === 'active').length;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.errorTitle}>
              Access Denied
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              You don't have permission to access the admin dashboard.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (isLoading || doorsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Admin Dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Welcome back, {user?.firstName}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineLarge" style={styles.statNumber}>
              {pendingCount}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Pending Requests
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineLarge" style={styles.statNumber}>
              {totalSites}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Active Sites
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineLarge" style={styles.statNumber}>
              {totalDoors}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Doors
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Request Statistics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Request Overview
          </Text>
          <View style={styles.requestStats}>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={[styles.statValue, { color: theme.colors.primary }]}>
                {approvedCount}
              </Text>
              <Text variant="bodySmall">Approved</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={[styles.statValue, { color: theme.colors.error }]}>
                {deniedCount}
              </Text>
              <Text variant="bodySmall">Denied</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={[styles.statValue, { color: theme.colors.tertiary }]}>
                {docsRequiredCount}
              </Text>
              <Text variant="bodySmall">Docs Required</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => navigation.navigate('SiteManagement' as any)}
              style={styles.actionButton}
            >
              Add Site
            </Button>
            <Button
              mode="outlined"
              icon="door"
              onPress={() => navigation.navigate('DoorDetails' as any, { doorId: 'new' })}
              style={styles.actionButton}
            >
              Add Door
            </Button>
            <Button
              mode="outlined"
              icon="account-multiple"
              onPress={() => navigation.navigate('UserManagement' as any)}
              style={styles.actionButton}
            >
              Manage Users
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => navigation.navigate('Analytics' as any)}
              style={styles.actionButton}
            >
              View Analytics
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Pending Requests */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Pending Requests
            </Text>
            <Badge size={24}>{pendingCount}</Badge>
          </View>
          
          {pendingRequests.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No pending requests
            </Text>
          ) : (
            <View style={styles.requestsList}>
              {pendingRequests.slice(0, 5).map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestHeader}>
                    <Text variant="titleSmall" style={styles.requestTitle}>
                      {request.doorName}
                    </Text>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(request.status) }}
                      style={[styles.statusChip, { borderColor: getStatusColor(request.status) }]}
                    >
                      {getStatusText(request.status)}
                    </Chip>
                  </View>
                  
                  <Text variant="bodySmall" style={styles.requestUser}>
                    {request.requesterName} • {request.requesterEmail}
                  </Text>
                  
                  <Text variant="bodySmall" style={styles.requestReason}>
                    {request.reason}
                  </Text>
                  
                  <Text variant="bodySmall" style={styles.requestTime}>
                    {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                  
                  <View style={styles.requestActions}>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => handleApproveRequest(request)}
                      style={[styles.actionBtn, styles.approveBtn]}
                    >
                      Approve
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleDenyRequest(request)}
                      style={[styles.actionBtn, styles.denyBtn]}
                    >
                      Deny
                    </Button>
                    <IconButton
                      icon="message"
                      size={20}
                      onPress={() => handleMessageRequest(request)}
                      style={styles.messageBtn}
                    />
                  </View>
                </View>
              ))}
              
              {pendingRequests.length > 5 && (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('RequestManagement' as any)}
                  style={styles.viewAllButton}
                >
                  View All ({pendingRequests.length})
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <View style={styles.activityList}>
            {requests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <IconButton
                    icon={request.status === RequestStatus.APPROVED ? 'check-circle' : 'close-circle'}
                    size={16}
                    iconColor={getStatusColor(request.status)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="bodySmall" style={styles.activityText}>
                    <Text style={styles.activityUser}>{request.requesterName}</Text>
                    {' '}
                    {request.status === RequestStatus.APPROVED ? 'was granted' : 'was denied'}
                    {' '}access to {request.doorName}
                  </Text>
                  <Text variant="bodySmall" style={styles.activityTime}>
                    {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Emergency Alerts Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Emergency Alerts
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No active emergency alerts
          </Text>
          <Button
            mode="outlined"
            icon="alert"
            onPress={() => navigation.navigate('EmergencyManagement' as any)}
            style={styles.emergencyButton}
          >
            Manage Emergencies
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    margin: 16,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
    marginTop: 4,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  requestStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  requestsList: {
    gap: 12,
  },
  requestItem: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  requestUser: {
    color: '#666666',
    marginBottom: 4,
  },
  requestReason: {
    marginBottom: 4,
  },
  requestTime: {
    color: '#999999',
    fontSize: 12,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
  },
  approveBtn: {
    backgroundColor: '#28A745',
  },
  denyBtn: {
    borderColor: '#DC3545',
  },
  messageBtn: {
    margin: 0,
  },
  viewAllButton: {
    marginTop: 8,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: 'bold',
  },
  activityTime: {
    color: '#999999',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  emergencyButton: {
    borderColor: '#DC3545',
  },
});

export default AdminDashboardScreen;

