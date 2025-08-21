import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  IconButton,
  ActivityIndicator,
  Text,
  Badge,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchActiveEmergencies, 
  createEmergency, 
  resolveEmergency,
  acknowledgeEmergency 
} from '../../store/slices/emergencySlice';
import { EmergencyEvent, EmergencyType, EmergencySeverity, EmergencyStatus } from '../../types';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';

type EmergencyDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmergencyDashboard'>;

const EmergencyDashboardScreen: React.FC = () => {
  const navigation = useNavigation<EmergencyDashboardScreenNavigationProp>();
  const dispatch = useDispatch();
  const { activeEmergencies, isLoading, error } = useSelector((state: RootState) => state.emergencies);
  const { sites } = useSelector((state: RootState) => state.sites);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>(EmergencyType.FIRE);
  const [emergencySeverity, setEmergencySeverity] = useState<EmergencySeverity>(EmergencySeverity.MEDIUM);
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [emergencyLocation, setEmergencyLocation] = useState('');

  useEffect(() => {
    loadActiveEmergencies();
  }, []);

  const loadActiveEmergencies = async () => {
    try {
      await dispatch(fetchActiveEmergencies() as any);
    } catch (error) {
      console.error('Error loading active emergencies:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveEmergencies();
    setRefreshing(false);
  };

  const handleCreateEmergency = async () => {
    if (!selectedSite || !emergencyDescription) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const emergencyData = {
        type: emergencyType,
        severity: emergencySeverity,
        description: emergencyDescription,
        location: emergencyLocation,
        siteId: selectedSite,
        affectedUsers: [], // Will be populated with site users
      };

      await dispatch(createEmergency(emergencyData) as any);
      setCreateModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Emergency created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create emergency');
    }
  };

  const handleResolveEmergency = async (emergencyId: string) => {
    Alert.alert(
      'Resolve Emergency',
      'Are you sure you want to resolve this emergency?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await dispatch(resolveEmergency(emergencyId) as any);
              Alert.alert('Success', 'Emergency resolved successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve emergency');
            }
          },
        },
      ]
    );
  };

  const handleAcknowledgeEmergency = async (emergencyId: string) => {
    try {
      await dispatch(acknowledgeEmergency({ 
        emergencyId, 
        acknowledgment:         {
          userId: user?.id || '',
          acknowledgedAt: new Date(),
          deviceInfo: 'Mobile App'
        }
      }) as any);
      Alert.alert('Success', 'Emergency acknowledged');
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge emergency');
    }
  };

  const resetForm = () => {
    setSelectedSite('');
    setEmergencyType(EmergencyType.FIRE);
    setEmergencySeverity(EmergencySeverity.MEDIUM);
    setEmergencyDescription('');
    setEmergencyLocation('');
  };

  const getEmergencyIcon = (type: EmergencyType) => {
    switch (type) {
      case EmergencyType.FIRE:
        return '🔥';
      case EmergencyType.MEDICAL:
        return '🚑';
      case EmergencyType.SECURITY:
        return '🚨';
      case EmergencyType.EVACUATION:
        return '🚪';
      case EmergencyType.STRUCTURAL:
        return '🏗️';
      case EmergencyType.ENVIRONMENTAL:
        return '🌪️';
      default:
        return '⚠️';
    }
  };

  const getSeverityColor = (severity: EmergencySeverity) => {
    switch (severity) {
      case EmergencySeverity.LOW:
        return '#4CAF50';
      case EmergencySeverity.MEDIUM:
        return '#FF9800';
      case EmergencySeverity.HIGH:
        return '#F44336';
      case EmergencySeverity.CRITICAL:
        return '#9C27B0';
      default:
        return '#2196F3';
    }
  };

  const getEmergencyStats = () => {
    const total = activeEmergencies.length;
    const byType = activeEmergencies.reduce((acc: any, emergency: EmergencyEvent) => {
      acc[emergency.type] = (acc[emergency.type] || 0) + 1;
      return acc;
    }, {});
    const bySeverity = activeEmergencies.reduce((acc: any, emergency: EmergencyEvent) => {
      acc[emergency.severity] = (acc[emergency.severity] || 0) + 1;
      return acc;
    }, {});

    return { total, byType, bySeverity };
  };

  const stats = getEmergencyStats();

  const renderEmergencyCard = (emergency: EmergencyEvent) => (
    <Card key={emergency.id} style={styles.emergencyCard}>
      <Card.Content>
        <View style={styles.emergencyHeader}>
          <View style={styles.emergencyTitle}>
            <Text style={styles.emergencyIcon}>{getEmergencyIcon(emergency.type)}</Text>
            <View style={styles.emergencyInfo}>
              <Title style={styles.emergencyName}>{emergency.type.replace('_', ' ')}</Title>
              <Paragraph style={styles.emergencySite}>
                {sites.find(site => site.id === emergency.siteId)?.name || 'Unknown Site'}
              </Paragraph>
            </View>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getSeverityColor(emergency.severity) }}
            style={[styles.severityChip, { borderColor: getSeverityColor(emergency.severity) }]}
          >
            {emergency.severity}
          </Chip>
        </View>

        <Paragraph style={styles.emergencyDescription}>
          {emergency.description}
        </Paragraph>

        {emergency.location && (
          <Text style={styles.emergencyLocation}>Location: {emergency.location}</Text>
        )}

        <Text style={styles.emergencyTime}>
          Started: {new Date(emergency.startTime).toLocaleString()}
        </Text>

        <View style={styles.emergencyActions}>
          <Button
            mode="outlined"
            onPress={() => handleAcknowledgeEmergency(emergency.id)}
            style={styles.actionButton}
            icon="check"
          >
            Acknowledge
          </Button>
          <Button
            mode="contained"
            onPress={() => handleResolveEmergency(emergency.id)}
            style={styles.actionButton}
            icon="check-circle"
            buttonColor="#4CAF50"
          >
            Resolve
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Title style={styles.statsTitle}>Emergency Overview</Title>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activeEmergencies.filter((e: EmergencyEvent) => e.severity === EmergencySeverity.CRITICAL).length}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activeEmergencies.filter((e: EmergencyEvent) => e.severity === EmergencySeverity.HIGH).length}
            </Text>
            <Text style={styles.statLabel}>High</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activeEmergencies.filter((e: EmergencyEvent) => e.severity === EmergencySeverity.MEDIUM).length}
            </Text>
            <Text style={styles.statLabel}>Medium</Text>
          </View>
        </View>

        {Object.keys(stats.byType).length > 0 && (
          <View style={styles.typeStats}>
            <Text style={styles.typeStatsTitle}>By Type:</Text>
            <View style={styles.typeChips}>
              {Object.entries(stats.byType).map(([type, count]: [string, unknown]) => (
                <Chip key={type} style={styles.typeChip}>
                  {type.replace('_', ' ')}: {String(count)}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading emergency dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCard()}

        <View style={styles.emergencySection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Active Emergencies</Title>
            <Badge style={styles.badge}>{activeEmergencies.length}</Badge>
          </View>

          {activeEmergencies.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No active emergencies</Text>
                <Text style={styles.emptySubtext}>All systems are operating normally</Text>
              </Card.Content>
            </Card>
          ) : (
            activeEmergencies.map(renderEmergencyCard)
          )}
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={loadActiveEmergencies}>Retry</Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => setCreateModalVisible(true)}
          style={styles.createButton}
          icon="plus"
        >
          Create Emergency
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('EmergencyManagement')}
          style={styles.manageButton}
          icon="cog"
        >
          Manage
        </Button>
      </View>

      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Create Emergency Alert</Title>

            <TextInput
              label="Site"
              value={selectedSite}
              onChangeText={setSelectedSite}
              style={styles.modalInput}
              mode="outlined"
            />

            <Text style={styles.modalLabel}>Emergency Type</Text>
            <SegmentedButtons
              value={emergencyType}
              onValueChange={(value) => setEmergencyType(value as EmergencyType)}
              buttons={[
                { value: EmergencyType.FIRE, label: 'Fire' },
                { value: EmergencyType.MEDICAL, label: 'Medical' },
                { value: EmergencyType.SECURITY, label: 'Security' },
                { value: EmergencyType.EVACUATION, label: 'Evacuation' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text style={styles.modalLabel}>Severity</Text>
            <SegmentedButtons
              value={emergencySeverity}
              onValueChange={(value) => setEmergencySeverity(value as EmergencySeverity)}
              buttons={[
                { value: EmergencySeverity.LOW, label: 'Low' },
                { value: EmergencySeverity.MEDIUM, label: 'Medium' },
                { value: EmergencySeverity.HIGH, label: 'High' },
                { value: EmergencySeverity.CRITICAL, label: 'Critical' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Description"
              value={emergencyDescription}
              onChangeText={setEmergencyDescription}
              multiline
              numberOfLines={3}
              style={styles.modalInput}
              mode="outlined"
            />

            <TextInput
              label="Location (optional)"
              value={emergencyLocation}
              onChangeText={setEmergencyLocation}
              style={styles.modalInput}
              mode="outlined"
            />

            <View style={styles.modalActions}>
              <Button onPress={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleCreateEmergency}>
                Create Emergency
              </Button>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
  },
  typeStats: {
    marginTop: 16,
  },
  typeStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    margin: 4,
  },
  emergencySection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: 8,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emergencyCard: {
    marginBottom: 16,
    elevation: 2,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emergencyTitle: {
    flexDirection: 'row',
    flex: 1,
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencySite: {
    fontSize: 14,
    color: '#666',
  },
  severityChip: {
    height: 28,
  },
  emergencyDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  emergencyLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emergencyTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  emergencyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  createButton: {
    flex: 2,
    marginRight: 8,
  },
  manageButton: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});

export default EmergencyDashboardScreen;
