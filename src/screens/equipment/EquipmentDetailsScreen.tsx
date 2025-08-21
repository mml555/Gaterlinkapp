import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  IconButton,
  Divider,
  ActivityIndicator,
  Text,
  List,
  Badge,
  DataTable,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchEquipmentById, updateEquipment, setEquipmentStatus } from '../../store/slices/equipmentSlice';
import { fetchReservations } from '../../store/slices/equipmentSlice';
import { Equipment, EquipmentStatus, Reservation, ReservationStatus } from '../../types';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type EquipmentDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EquipmentDetails'>;
type EquipmentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EquipmentDetails'>;

const EquipmentDetailsScreen: React.FC = () => {
  const navigation = useNavigation<EquipmentDetailsScreenNavigationProp>();
  const route = useRoute<EquipmentDetailsScreenRouteProp>();
  const dispatch = useDispatch();
  const { selectedEquipment, isLoading, error } = useSelector((state: RootState) => state.equipment);
  const { reservations } = useSelector((state: RootState) => state.equipment);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const { equipmentId } = route.params;

  useEffect(() => {
    loadEquipmentDetails();
    loadReservations();
  }, [equipmentId]);

  const loadEquipmentDetails = async () => {
    try {
      await dispatch(fetchEquipmentById(equipmentId) as any);
    } catch (error) {
      console.error('Error loading equipment details:', error);
    }
  };

  const loadReservations = async () => {
    try {
      await dispatch(fetchReservations() as any);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEquipmentDetails(), loadReservations()]);
    setRefreshing(false);
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      await dispatch(setEquipmentStatus({ equipmentId, status: newStatus }) as any);
      setStatusModalVisible(false);
      setNewStatus('');
      setStatusNotes('');
      Alert.alert('Success', 'Equipment status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update equipment status');
    }
  };

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.AVAILABLE:
        return '#4CAF50';
      case EquipmentStatus.IN_USE:
        return '#FF9800';
      case EquipmentStatus.MAINTENANCE:
        return '#F44336';
      case EquipmentStatus.OUT_OF_SERVICE:
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXCAVATOR':
        return '🚜';
      case 'BULLDOZER':
        return '🚜';
      case 'CRANE':
        return '🏗️';
      case 'FORKLIFT':
        return '🚛';
      case 'GENERATOR':
        return '⚡';
      case 'COMPRESSOR':
        return '💨';
      case 'WELDER':
        return '🔥';
      case 'TOOLS':
        return '🔧';
      default:
        return '⚙️';
    }
  };

  const getReservationStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.ACTIVE:
        return '#4CAF50';
      case ReservationStatus.PENDING:
        return '#FF9800';
      case ReservationStatus.COMPLETED:
        return '#2196F3';
      case ReservationStatus.CANCELLED:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const equipmentReservations = reservations.filter(
    (reservation: Reservation) => reservation.equipmentId === equipmentId
  );

  const activeReservations = equipmentReservations.filter(
    (reservation: Reservation) => reservation.status === ReservationStatus.ACTIVE
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.equipmentIcon}>{getTypeIcon(selectedEquipment?.type || '')}</Text>
            <View style={styles.headerText}>
              <Title style={styles.equipmentName}>{selectedEquipment?.name}</Title>
              <Paragraph style={styles.equipmentSite}>{selectedEquipment?.siteName}</Paragraph>
            </View>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(selectedEquipment?.status || EquipmentStatus.AVAILABLE) }}
              style={[
                styles.statusChip,
                { borderColor: getStatusColor(selectedEquipment?.status || EquipmentStatus.AVAILABLE) }
              ]}
            >
              {selectedEquipment?.status?.replace('_', ' ')}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoSection}>
            <Title style={styles.sectionTitle}>Equipment Information</Title>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.type?.replace('_', ' ')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.location || 'Not specified'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial Number:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.serialNumber || 'Not specified'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Manufacturer:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.manufacturer || 'Not specified'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.model || 'Not specified'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Year:</Text>
              <Text style={styles.infoValue}>{selectedEquipment?.year || 'Not specified'}</Text>
            </View>
          </View>

          {selectedEquipment?.description && (
            <View style={styles.infoSection}>
              <Title style={styles.sectionTitle}>Description</Title>
              <Paragraph style={styles.description}>{selectedEquipment.description}</Paragraph>
            </View>
          )}

          <View style={styles.infoSection}>
            <Title style={styles.sectionTitle}>Usage Statistics</Title>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedEquipment?.totalHours || 0}</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedEquipment?.accessCount || 0}</Text>
                <Text style={styles.statLabel}>Access Count</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {selectedEquipment?.lastAccess ? new Date(selectedEquipment.lastAccess).toLocaleDateString() : 'Never'}
                </Text>
                <Text style={styles.statLabel}>Last Access</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {selectedEquipment?.nextAvailable ? new Date(selectedEquipment.nextAvailable).toLocaleDateString() : 'Available'}
                </Text>
                <Text style={styles.statLabel}>Next Available</Text>
              </View>
            </View>
          </View>

          {selectedEquipment?.notes && (
            <View style={styles.infoSection}>
              <Title style={styles.sectionTitle}>Notes</Title>
              <Paragraph style={styles.notes}>{selectedEquipment.notes}</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderReservationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.tabHeader}>
            <Title style={styles.sectionTitle}>Reservations</Title>
            <Badge style={styles.badge}>{equipmentReservations.length}</Badge>
          </View>

          {equipmentReservations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reservations found</Text>
              <Text style={styles.emptySubtext}>This equipment has no reservation history</Text>
            </View>
          ) : (
            equipmentReservations.map((reservation: Reservation) => (
              <Card key={reservation.id} style={styles.reservationCard}>
                <Card.Content>
                  <View style={styles.reservationHeader}>
                    <View>
                      <Text style={styles.reservationUser}>{reservation.userName}</Text>
                      <Text style={styles.reservationDate}>
                        {new Date(reservation.startTime).toLocaleDateString()} - {new Date(reservation.endTime).toLocaleDateString()}
                      </Text>
                    </View>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getReservationStatusColor(reservation.status) }}
                      style={[
                        styles.reservationStatusChip,
                        { borderColor: getReservationStatusColor(reservation.status) }
                      ]}
                    >
                      {reservation.status}
                    </Chip>
                  </View>
                  
                  {reservation.purpose && (
                    <Text style={styles.reservationPurpose}>Purpose: {reservation.purpose}</Text>
                  )}
                  
                  {reservation.notes && (
                    <Text style={styles.reservationNotes}>Notes: {reservation.notes}</Text>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderMaintenanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Maintenance History</Title>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No maintenance records</Text>
            <Text style={styles.emptySubtext}>Maintenance history will appear here</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading equipment details...</Text>
      </View>
    );
  }

  if (!selectedEquipment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Equipment not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
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
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'details', label: 'Details' },
            { value: 'reservations', label: 'Reservations' },
            { value: 'maintenance', label: 'Maintenance' },
          ]}
          style={styles.segmentedButtons}
        />

        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'reservations' && renderReservationsTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </ScrollView>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('EquipmentReservation', { equipmentId })}
          style={styles.actionButton}
          icon="calendar"
        >
          Reserve
        </Button>
        <Button
          mode="outlined"
          onPress={() => setStatusModalVisible(true)}
          style={styles.actionButton}
          icon="pencil"
        >
          Update Status
        </Button>
      </View>

      <Portal>
        <Modal
          visible={statusModalVisible}
          onDismiss={() => setStatusModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Update Equipment Status</Title>
          
          <TextInput
            label="Status Notes"
            value={statusNotes}
            onChangeText={setStatusNotes}
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <View style={styles.statusButtons}>
            {Object.values(EquipmentStatus).map((status) => (
              <Button
                key={status}
                mode={newStatus === status ? 'contained' : 'outlined'}
                onPress={() => setNewStatus(status)}
                style={styles.statusButton}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setStatusModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleStatusChange} disabled={!newStatus}>
              Update
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  segmentedButtons: {
    margin: 16,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  equipmentIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  equipmentSite: {
    fontSize: 16,
    color: '#666',
  },
  statusChip: {
    height: 32,
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  reservationCard: {
    marginBottom: 12,
    elevation: 1,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reservationUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reservationDate: {
    fontSize: 14,
    color: '#666',
  },
  reservationStatusChip: {
    height: 24,
  },
  reservationPurpose: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reservationNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusButton: {
    margin: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default EquipmentDetailsScreen;
