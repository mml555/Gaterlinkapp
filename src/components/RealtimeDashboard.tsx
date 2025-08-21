import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  ActivityIndicator,
  Text,
  Badge,
  IconButton,
  Portal,
  Modal,
  List,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { websocketService } from '../services/websocketService';
import { pushNotificationService } from '../services/pushNotificationService';
import { 
  fetchActiveEmergencies
} from '../store/slices/emergencySlice';
import { fetchActiveHolds } from '../store/slices/holdSlice';
import { fetchPendingRequests } from '../store/slices/requestSlice';
import { fetchEquipment } from '../store/slices/equipmentSlice';
import { EmergencyEvent, Hold, Equipment, AccessRequest } from '../types';

interface RealtimeUpdate {
  id: string;
  type: 'emergency' | 'hold' | 'equipment' | 'request';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  data: any;
}

const RealtimeDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeEmergencies } = useSelector((state: RootState) => state.emergencies);
  const { activeHolds } = useSelector((state: RootState) => state.holds);
  const { equipment } = useSelector((state: RootState) => state.equipment);
  const { pendingRequests } = useSelector((state: RootState) => state.requests);

  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    initializeRealtimeServices();
    loadInitialData();

    return () => {
      cleanupRealtimeServices();
    };
  }, []);

  const initializeRealtimeServices = async () => {
    try {
      // Initialize push notifications
      await pushNotificationService.initialize();

      // Setup WebSocket callbacks
      websocketService.subscribeToUpdates({
        onEmergencyUpdate: handleEmergencyUpdate,
        onHoldUpdate: handleHoldUpdate,
        onEquipmentUpdate: handleEquipmentUpdate,
        onRequestUpdate: handleRequestUpdate,
        onNotification: handleNotification,
        onConnectionChange: handleConnectionChange,
        onError: handleWebSocketError,
      });

      // Subscribe to updates for user's sites
      if (user?.siteMemberships) {
        user.siteMemberships.forEach(membership => {
          websocketService.subscribeToEmergencyUpdates(membership.siteId);
          websocketService.subscribeToHoldUpdates(membership.siteId);
          websocketService.subscribeToEquipmentUpdates(membership.siteId);
          websocketService.subscribeToRequestUpdates(membership.siteId);
        });
      }

    } catch (error) {
      console.error('Error initializing realtime services:', error);
    }
  };

  const cleanupRealtimeServices = () => {
    // Unsubscribe from all update types
    websocketService.unsubscribeFromUpdates('emergencies');
    websocketService.unsubscribeFromUpdates('requests');
    websocketService.unsubscribeFromUpdates('holds');
    websocketService.unsubscribeFromUpdates('equipment');
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchActiveEmergencies() as any),
        dispatch(fetchActiveHolds() as any),
        dispatch(fetchEquipment() as any),
        dispatch(fetchPendingRequests() as any),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleEmergencyUpdate = useCallback((emergency: EmergencyEvent) => {
    console.log('Emergency update received:', emergency);
    
    const update: RealtimeUpdate = {
      id: `emergency-${emergency.id}`,
      type: 'emergency',
      title: `Emergency: ${emergency.type}`,
      message: emergency.description,
      timestamp: new Date(),
      priority: emergency.severity === 'critical' ? 'high' : 'medium',
      data: emergency,
    };

    addRealtimeUpdate(update);
    
    // Refresh emergency data
    dispatch(fetchActiveEmergencies() as any);
  }, [dispatch]);

  const handleHoldUpdate = useCallback((hold: Hold) => {
    console.log('Hold update received:', hold);
    
    const update: RealtimeUpdate = {
      id: `hold-${hold.id}`,
      type: 'hold',
      title: `Hold: ${hold.areaId}`,
      message: hold.reason,
      timestamp: new Date(),
      priority: 'medium',
      data: hold,
    };

    addRealtimeUpdate(update);
    
    // Refresh hold data
    dispatch(fetchActiveHolds() as any);
  }, [dispatch]);

  const handleEquipmentUpdate = useCallback((equipment: Equipment) => {
    console.log('Equipment update received:', equipment);
    
    const update: RealtimeUpdate = {
      id: `equipment-${equipment.id}`,
      type: 'equipment',
      title: `Equipment: ${equipment.name}`,
      message: `Status changed to ${equipment.status}`,
      timestamp: new Date(),
      priority: 'low',
      data: equipment,
    };

    addRealtimeUpdate(update);
    
    // Refresh equipment data
    dispatch(fetchEquipment() as any);
  }, [dispatch]);

  const handleRequestUpdate = useCallback((request: AccessRequest) => {
    console.log('Request update received:', request);
    
    const update: RealtimeUpdate = {
      id: `request-${request.id}`,
      type: 'request',
      title: `Request: ${request.doorName}`,
      message: `Status: ${request.status}`,
      timestamp: new Date(),
      priority: 'medium',
      data: request,
    };

    addRealtimeUpdate(update);
    
    // Refresh request data
    dispatch(fetchPendingRequests() as any);
  }, [dispatch]);

  const handleNotification = useCallback((notification: any) => {
    console.log('Notification received:', notification);
    
    const update: RealtimeUpdate = {
      id: `notification-${Date.now()}`,
      type: 'request',
      title: notification.title || 'Notification',
      message: notification.message || notification.body,
      timestamp: new Date(),
      priority: notification.priority || 'medium',
      data: notification,
    };

    addRealtimeUpdate(update);
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    console.log('WebSocket connection status:', connected ? 'connected' : 'disconnected');
  }, []);

  const handleWebSocketError = useCallback((error: string) => {
    console.error('WebSocket error:', error);
    setConnectionStatus('disconnected');
  }, []);

  const addRealtimeUpdate = (update: RealtimeUpdate) => {
    setRealtimeUpdates(prev => {
      const newUpdates = [update, ...prev.slice(0, 49)]; // Keep last 50 updates
      return newUpdates;
    });
    setLastUpdate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#2196F3';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'hold':
        return '🔒';
      case 'equipment':
        return '⚙️';
      case 'request':
        return '📋';
      default:
        return '📢';
    }
  };

  const renderConnectionStatus = () => (
    <Card style={styles.statusCard}>
      <Card.Content>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Connection Status</Text>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#F44336' }
                ]} 
              />
              <Text style={styles.statusText}>
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <IconButton
            icon={connectionStatus === 'connected' ? 'wifi' : 'wifi-off'}
            size={24}
            iconColor={connectionStatus === 'connected' ? '#4CAF50' : '#F44336'}
          />
        </View>
        <Text style={styles.lastUpdateText}>
          Last Update: {lastUpdate.toLocaleTimeString()}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Title style={styles.statsTitle}>Live Statistics</Title>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeEmergencies.length}</Text>
            <Text style={styles.statLabel}>Active Emergencies</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeHolds.length}</Text>
            <Text style={styles.statLabel}>Active Holds</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {equipment.filter(eq => eq.status === 'in_use').length}
            </Text>
            <Text style={styles.statLabel}>Equipment in Use</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRealtimeUpdates = () => (
    <Card style={styles.updatesCard}>
      <Card.Content>
        <View style={styles.updatesHeader}>
          <Title style={styles.updatesTitle}>Live Updates</Title>
          <Badge style={styles.updatesBadge}>{realtimeUpdates.length}</Badge>
          <IconButton
            icon="eye"
            size={20}
            onPress={() => setShowUpdatesModal(true)}
          />
        </View>

        {realtimeUpdates.length === 0 ? (
          <Text style={styles.noUpdatesText}>No recent updates</Text>
        ) : (
          realtimeUpdates.slice(0, 5).map((update) => (
            <View key={update.id} style={styles.updateItem}>
              <View style={styles.updateHeader}>
                <Text style={styles.updateIcon}>{getTypeIcon(update.type)}</Text>
                <View style={styles.updateInfo}>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateTime}>
                    {update.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getPriorityColor(update.priority) }}
                  style={[styles.priorityChip, { borderColor: getPriorityColor(update.priority) }]}
                >
                  {update.priority}
                </Chip>
              </View>
              <Text style={styles.updateMessage}>{update.message}</Text>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderEmergencyAlerts = () => {
    if (activeEmergencies.length === 0) return null;

    return (
      <Card style={styles.alertsCard}>
        <Card.Content>
          <Title style={styles.alertsTitle}>Active Emergencies</Title>
          {activeEmergencies.map((emergency: EmergencyEvent) => (
            <View key={emergency.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>🚨</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{emergency.type.toUpperCase()}</Text>
                  <Text style={styles.alertSeverity}>{emergency.severity}</Text>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: '#F44336' }}
                  style={[styles.severityChip, { borderColor: '#F44336' }]}
                >
                  {emergency.severity}
                </Chip>
              </View>
              <Text style={styles.alertDescription}>{emergency.description}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderConnectionStatus()}
        {renderStatsCard()}
        {renderRealtimeUpdates()}
        {renderEmergencyAlerts()}
      </ScrollView>

      <Portal>
        <Modal
          visible={showUpdatesModal}
          onDismiss={() => setShowUpdatesModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Title>All Live Updates</Title>
            <IconButton
              icon="close"
              onPress={() => setShowUpdatesModal(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {realtimeUpdates.map((update) => (
              <View key={update.id} style={styles.modalUpdateItem}>
                <View style={styles.modalUpdateHeader}>
                  <Text style={styles.modalUpdateIcon}>{getTypeIcon(update.type)}</Text>
                  <View style={styles.modalUpdateInfo}>
                    <Text style={styles.modalUpdateTitle}>{update.title}</Text>
                    <Text style={styles.modalUpdateTime}>
                      {update.timestamp.toLocaleString()}
                    </Text>
                  </View>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getPriorityColor(update.priority) }}
                    style={[styles.modalPriorityChip, { borderColor: getPriorityColor(update.priority) }]}
                  >
                    {update.priority}
                  </Chip>
                </View>
                <Text style={styles.modalUpdateMessage}>{update.message}</Text>
                <Divider style={styles.modalDivider} />
              </View>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    margin: 16,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  updatesCard: {
    margin: 16,
    elevation: 2,
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  updatesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  updatesBadge: {
    marginRight: 8,
  },
  noUpdatesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  updateItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  updateInfo: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
  },
  priorityChip: {
    height: 24,
  },
  updateMessage: {
    fontSize: 12,
    color: '#333',
  },
  alertsCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#FFF3E0',
  },
  alertsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E65100',
  },
  alertItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
  },
  alertSeverity: {
    fontSize: 12,
    color: '#F57C00',
  },
  severityChip: {
    height: 24,
  },
  alertDescription: {
    fontSize: 12,
    color: '#333',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalContent: {
    padding: 16,
  },
  modalUpdateItem: {
    marginBottom: 16,
  },
  modalUpdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalUpdateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalUpdateInfo: {
    flex: 1,
  },
  modalUpdateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalUpdateTime: {
    fontSize: 12,
    color: '#666',
  },
  modalPriorityChip: {
    height: 24,
  },
  modalUpdateMessage: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
  },
  modalDivider: {
    marginTop: 8,
  },
});

export default RealtimeDashboard;
