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
  Switch,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchHolds, 
  fetchActiveHolds, 
  createHold, 
  cancelHold,
  extendHold 
} from '../../store/slices/holdSlice';
import { fetchSites } from '../../store/slices/siteSlice';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { Hold, HoldStatus } from '../../types';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';

type HoldManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HoldManagement'>;

const HoldManagementScreen: React.FC = () => {
  const navigation = useNavigation<HoldManagementScreenNavigationProp>();
  const dispatch = useDispatch();
  const { holds, activeHolds, isLoading, error } = useSelector((state: RootState) => state.holds);
  const { sites } = useSelector((state: RootState) => state.sites);
  const { equipment } = useSelector((state: RootState) => state.equipment);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedHold, setSelectedHold] = useState<Hold | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [filterSite, setFilterSite] = useState('all');
  const [filterAreaType, setFilterAreaType] = useState<'all' | 'door' | 'equipment' | 'site'>('all');

  // Form state
  const [selectedSite, setSelectedSite] = useState('');
  const [areaType, setAreaType] = useState<'door' | 'equipment' | 'site'>('door');
  const [selectedArea, setSelectedArea] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [newEndTime, setNewEndTime] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchHolds() as any),
        dispatch(fetchActiveHolds() as any),
        dispatch(fetchSites() as any),
        dispatch(fetchEquipment() as any),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateHold = async () => {
    if (!selectedSite || !selectedArea || !holdReason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const holdData = {
        siteId: selectedSite,
        areaId: selectedArea,
        areaType,
        reason: holdReason,
        startTime,
        endTime,
        affectedUsers: [], // Will be populated with site users
      };

      await dispatch(createHold(holdData) as any);
      setCreateModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Hold created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create hold');
    }
  };

  const handleCancelHold = async (holdId: string) => {
    Alert.alert(
      'Cancel Hold',
      'Are you sure you want to cancel this hold?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Hold',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelHold(holdId) as any);
              Alert.alert('Success', 'Hold cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel hold');
            }
          },
        },
      ]
    );
  };

  const handleExtendHold = async () => {
    if (!selectedHold) return;

    try {
      await dispatch(extendHold({ holdId: selectedHold.id, newEndTime }) as any);
      setExtendModalVisible(false);
      setSelectedHold(null);
      Alert.alert('Success', 'Hold extended successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to extend hold');
    }
  };

  const resetForm = () => {
    setSelectedSite('');
    setAreaType('door');
    setSelectedArea('');
    setHoldReason('');
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setNotifyUsers(true);
  };

  const getAreaOptions = () => {
    if (!selectedSite) return [];

    switch (areaType) {
      case 'door':
        return []; // Would need doors from door slice
      case 'equipment':
        return equipment.filter(eq => eq.siteId === selectedSite);
      case 'site':
        return sites.filter(site => site.id === selectedSite);
      default:
        return [];
    }
  };

  const getStatusColor = (status: HoldStatus) => {
    switch (status) {
      case HoldStatus.ACTIVE:
        return '#4CAF50';
      case HoldStatus.CANCELLED:
        return '#F44336';
      case HoldStatus.EXPIRED:
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const getAreaTypeIcon = (type: string) => {
    switch (type) {
      case 'door':
        return '🚪';
      case 'equipment':
        return '⚙️';
      case 'site':
        return '🏗️';
      default:
        return '📍';
    }
  };

  const filteredHolds = (activeTab === 'active' ? activeHolds : holds).filter((hold: Hold) => {
    const matchesSite = filterSite === 'all' || hold.siteId === filterSite;
    const matchesAreaType = filterAreaType === 'all' || hold.areaType === filterAreaType;
    return matchesSite && matchesAreaType;
  });

  const renderHoldCard = (hold: Hold) => (
    <Card key={hold.id} style={styles.holdCard}>
      <Card.Content>
        <View style={styles.holdHeader}>
          <View style={styles.holdTitle}>
            <Text style={styles.areaTypeIcon}>{getAreaTypeIcon(hold.areaType)}</Text>
            <View style={styles.holdInfo}>
              <Title style={styles.holdArea}>{hold.areaId}</Title>
              <Paragraph style={styles.holdSite}>
                {sites.find(site => site.id === hold.siteId)?.name || 'Unknown Site'}
              </Paragraph>
            </View>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(hold.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(hold.status) }]}
          >
            {hold.status}
          </Chip>
        </View>

        <Paragraph style={styles.holdReason}>{hold.reason}</Paragraph>

        <View style={styles.holdTimes}>
          <Text style={styles.timeText}>
            Start: {new Date(hold.startTime).toLocaleString()}
          </Text>
          <Text style={styles.timeText}>
            End: {new Date(hold.endTime).toLocaleString()}
          </Text>
        </View>

        {hold.affectedUsers && hold.affectedUsers.length > 0 && (
          <Text style={styles.affectedUsers}>
            Affected Users: {hold.affectedUsers.length}
          </Text>
        )}

        <View style={styles.holdActions}>
          {hold.status === HoldStatus.ACTIVE && (
            <>
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedHold(hold);
                  setNewEndTime(new Date(hold.endTime.getTime() + 60 * 60 * 1000)); // 1 hour later
                  setExtendModalVisible(true);
                }}
                style={styles.actionButton}
                icon="clock"
              >
                Extend
              </Button>
              <Button
                mode="contained"
                onPress={() => handleCancelHold(hold.id)}
                style={styles.actionButton}
                icon="close"
                buttonColor="#F44336"
              >
                Cancel
              </Button>
            </>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderStatsCard = () => {
    const totalHolds = holds.length;
    const activeHoldsCount = activeHolds.length;
    const expiredHoldsCount = holds.filter(h => h.status === HoldStatus.EXPIRED).length;
    const cancelledHoldsCount = holds.filter(h => h.status === HoldStatus.CANCELLED).length;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>Hold Overview</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalHolds}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeHoldsCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{expiredHoldsCount}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cancelledHoldsCount}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading holds...</Text>
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

        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'active', label: 'Active' },
              { value: 'all', label: 'All' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.filterContainer}>
          <TextInput
            label="Filter by Site"
            value={filterSite}
            onChangeText={setFilterSite}
            style={styles.filterInput}
            mode="outlined"
          />
          
          <SegmentedButtons
            value={filterAreaType}
            onValueChange={(value) => setFilterAreaType(value as any)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'door', label: 'Doors' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'site', label: 'Sites' },
            ]}
            style={styles.filterButtons}
          />
        </View>

        <View style={styles.holdsSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>
              {activeTab === 'active' ? 'Active Holds' : 'All Holds'}
            </Title>
            <Badge style={styles.badge}>{filteredHolds.length}</Badge>
          </View>

          {filteredHolds.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  {activeTab === 'active' ? 'No active holds' : 'No holds found'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === 'active' 
                    ? 'All areas are currently available' 
                    : 'Create a hold to restrict access to areas'
                  }
                </Text>
              </Card.Content>
            </Card>
          ) : (
            filteredHolds.map(renderHoldCard)
          )}
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={loadData}>Retry</Button>
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
          Create Hold
        </Button>
      </View>

      {/* Create Hold Modal */}
      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Create Hold</Title>

            <TextInput
              label="Site"
              value={selectedSite}
              onChangeText={setSelectedSite}
              style={styles.modalInput}
              mode="outlined"
            />

            <Text style={styles.modalLabel}>Area Type</Text>
            <SegmentedButtons
              value={areaType}
              onValueChange={(value) => setAreaType(value as any)}
              buttons={[
                { value: 'door', label: 'Door' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'site', label: 'Site' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Area"
              value={selectedArea}
              onChangeText={setSelectedArea}
              style={styles.modalInput}
              mode="outlined"
            />

            <TextInput
              label="Reason"
              value={holdReason}
              onChangeText={setHoldReason}
              multiline
              numberOfLines={3}
              style={styles.modalInput}
              mode="outlined"
            />

            <TextInput
              label="Start Time"
              value={startTime.toLocaleString()}
              style={styles.modalInput}
              mode="outlined"
              disabled
            />

            <TextInput
              label="End Time"
              value={endTime.toLocaleString()}
              style={styles.modalInput}
              mode="outlined"
              disabled
            />

            <View style={styles.switchContainer}>
              <Text>Notify affected users</Text>
              <Switch value={notifyUsers} onValueChange={setNotifyUsers} />
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleCreateHold}>
                Create Hold
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Extend Hold Modal */}
      <Portal>
        <Modal
          visible={extendModalVisible}
          onDismiss={() => setExtendModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Extend Hold</Title>

          <Text style={styles.modalText}>
            Extend hold for: {selectedHold?.areaId}
          </Text>

          <TextInput
            label="New End Time"
            value={newEndTime.toLocaleString()}
            style={styles.modalInput}
            mode="outlined"
            disabled
          />

          <View style={styles.modalActions}>
            <Button onPress={() => setExtendModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleExtendHold}>
              Extend Hold
            </Button>
          </View>
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
  tabContainer: {
    margin: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  filterContainer: {
    margin: 16,
  },
  filterInput: {
    marginBottom: 16,
  },
  filterButtons: {
    marginBottom: 16,
  },
  holdsSection: {
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
  holdCard: {
    marginBottom: 16,
    elevation: 2,
  },
  holdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  holdTitle: {
    flexDirection: 'row',
    flex: 1,
  },
  areaTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  holdInfo: {
    flex: 1,
  },
  holdArea: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  holdSite: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  holdReason: {
    fontSize: 14,
    marginBottom: 8,
  },
  holdTimes: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  affectedUsers: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  holdActions: {
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
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  createButton: {
    width: '100%',
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
  modalText: {
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});

export default HoldManagementScreen;
