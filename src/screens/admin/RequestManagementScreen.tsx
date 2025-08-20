import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Searchbar,
  FAB,
  ActivityIndicator,
  useTheme,
  TextInput,
  Portal,
  Dialog,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchRequests,
  fetchPendingRequests,
  approveRequest,
  denyRequest,
  sendMessageToRequest,
  setFilters,
  clearFilters,
} from '../../store/slices/requestSlice';
import { AccessRequest, RequestStatus, RequestFilters } from '../../types';

const RequestManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all');

  const { requests, pendingRequests, isLoading, filters } = useSelector((state: RootState) => state.requests);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      await Promise.all([
        dispatch(fetchRequests({ filters }) as any),
        dispatch(fetchPendingRequests() as any),
      ]);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const handleFilterChange = (filter: RequestStatus | 'all') => {
    setActiveFilter(filter);
    if (filter === 'all') {
      dispatch(clearFilters());
    } else {
      dispatch(setFilters({ status: [filter] }));
    }
    loadRequests();
  };

  const handleRequestPress = (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
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
              
              setShowRequestModal(false);
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
      setShowRequestModal(false);
      Alert.alert('Success', 'Access request denied');
    } catch (error) {
      Alert.alert('Error', 'Failed to deny request');
    }
  };

  const handleMessageRequest = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowMessageDialog(true);
  };

  const sendMessage = async () => {
    if (!selectedRequest || !messageText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      await dispatch(sendMessageToRequest({
        requestId: selectedRequest.id,
        message: messageText,
      }) as any);
      
      setShowMessageDialog(false);
      setMessageText('');
      setSelectedRequest(null);
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
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

  const getPriorityColor = (priority: string) => {
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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.doorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || request.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Request Management
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {filteredRequests.length} requests found
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search requests..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <Chip
          selected={activeFilter === 'all'}
          onPress={() => handleFilterChange('all')}
          style={styles.filterChip}
        >
          All ({requests.length})
        </Chip>
        <Chip
          selected={activeFilter === RequestStatus.PENDING}
          onPress={() => handleFilterChange(RequestStatus.PENDING)}
          style={styles.filterChip}
        >
          Pending ({pendingRequests.length})
        </Chip>
        <Chip
          selected={activeFilter === RequestStatus.APPROVED}
          onPress={() => handleFilterChange(RequestStatus.APPROVED)}
          style={styles.filterChip}
        >
          Approved ({requests.filter(r => r.status === RequestStatus.APPROVED).length})
        </Chip>
        <Chip
          selected={activeFilter === RequestStatus.DENIED}
          onPress={() => handleFilterChange(RequestStatus.DENIED)}
          style={styles.filterChip}
        >
          Denied ({requests.filter(r => r.status === RequestStatus.DENIED).length})
        </Chip>
        <Chip
          selected={activeFilter === RequestStatus.DOCUMENTATION_REQUIRED}
          onPress={() => handleFilterChange(RequestStatus.DOCUMENTATION_REQUIRED)}
          style={styles.filterChip}
        >
          Docs Required ({requests.filter(r => r.status === RequestStatus.DOCUMENTATION_REQUIRED).length})
        </Chip>
      </ScrollView>

      {/* Requests List */}
      <ScrollView
        style={styles.requestsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No requests found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'All requests have been processed'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card
              key={request.id}
              style={styles.requestCard}
              onPress={() => handleRequestPress(request)}
            >
              <Card.Content>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text variant="titleMedium" style={styles.doorName}>
                      {request.doorName}
                    </Text>
                    <Text variant="bodySmall" style={styles.requesterInfo}>
                      {request.requesterName} • {request.requesterEmail}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(request.status) }}
                      style={[styles.statusChip, { borderColor: getStatusColor(request.status) }]}
                    >
                      {getStatusText(request.status)}
                    </Chip>
                    {request.priority && (
                      <Chip
                        mode="outlined"
                        textStyle={{ color: getPriorityColor(request.priority) }}
                        style={[styles.priorityChip, { borderColor: getPriorityColor(request.priority) }]}
                      >
                        {request.priority}
                      </Chip>
                    )}
                  </View>
                </View>
                
                <Text variant="bodyMedium" style={styles.reason}>
                  {request.reason}
                </Text>
                
                <View style={styles.requestMeta}>
                  <Text variant="bodySmall" style={styles.requestTime}>
                    {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                  {request.documents && request.documents.length > 0 && (
                    <Text variant="bodySmall" style={styles.documents}>
                      📎 {request.documents.length} document(s)
                    </Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Request Detail Modal */}
      <Portal>
        <Modal
          visible={showRequestModal}
          onDismiss={() => setShowRequestModal(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                {selectedRequest && (
                  <>
                    <View style={styles.modalHeader}>
                      <Text variant="headlineSmall" style={styles.modalTitle}>
                        Request Details
                      </Text>
                      <IconButton
                        icon="close"
                        size={24}
                        onPress={() => setShowRequestModal(false)}
                      />
                    </View>

                    <Card style={styles.detailCard}>
                      <Card.Content>
                        <Text variant="titleLarge" style={styles.detailDoorName}>
                          {selectedRequest.doorName}
                        </Text>
                        
                        <View style={styles.detailStatus}>
                          <Chip
                            mode="outlined"
                            textStyle={{ color: getStatusColor(selectedRequest.status) }}
                            style={[styles.statusChip, { borderColor: getStatusColor(selectedRequest.status) }]}
                          >
                            {getStatusText(selectedRequest.status)}
                          </Chip>
                        </View>

                        <Divider style={styles.divider} />

                        <List.Item
                          title="Requester"
                          description={`${selectedRequest.requesterName}\n${selectedRequest.requesterEmail}`}
                          left={(props) => <List.Icon {...props} icon="account" />}
                        />

                        <List.Item
                          title="Requested"
                          description={new Date(selectedRequest.requestedAt).toLocaleString()}
                          left={(props) => <List.Icon {...props} icon="clock" />}
                        />

                        <List.Item
                          title="Reason"
                          description={selectedRequest.reason}
                          left={(props) => <List.Icon {...props} icon="information" />}
                        />

                        {selectedRequest.note && (
                          <List.Item
                            title="Notes"
                            description={selectedRequest.note}
                            left={(props) => <List.Icon {...props} icon="note-text" />}
                          />
                        )}

                        {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                          <>
                            <Divider style={styles.divider} />
                            <Text variant="titleMedium" style={styles.documentsTitle}>
                              Documents ({selectedRequest.documents.length})
                            </Text>
                            {selectedRequest.documents.map((doc, index) => (
                              <List.Item
                                key={doc.id}
                                title={doc.name}
                                description={`${doc.type} • ${doc.status}`}
                                left={(props) => <List.Icon {...props} icon="file-document" />}
                                right={(props) => (
                                  <IconButton
                                    {...props}
                                    icon="download"
                                    size={20}
                                    onPress={() => {/* Handle document download */}}
                                  />
                                )}
                              />
                            ))}
                          </>
                        )}
                      </Card.Content>
                    </Card>

                    {/* Action Buttons */}
                    {selectedRequest.status === RequestStatus.PENDING && (
                      <View style={styles.actionButtons}>
                        <Button
                          mode="contained"
                          icon="check"
                          onPress={() => handleApproveRequest(selectedRequest)}
                          style={[styles.actionButton, styles.approveButton]}
                        >
                          Approve
                        </Button>
                        <Button
                          mode="outlined"
                          icon="close"
                          onPress={() => handleDenyRequest(selectedRequest)}
                          style={[styles.actionButton, styles.denyButton]}
                        >
                          Deny
                        </Button>
                        <Button
                          mode="outlined"
                          icon="message"
                          onPress={() => handleMessageRequest(selectedRequest)}
                          style={[styles.actionButton, styles.messageButton]}
                        >
                          Message
                        </Button>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Deny Dialog */}
      <Portal>
        <Dialog visible={showDenyDialog} onDismiss={() => setShowDenyDialog(false)}>
          <Dialog.Title>Deny Request</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason for denial"
              value={denyReason}
              onChangeText={setDenyReason}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDenyDialog(false)}>Cancel</Button>
            <Button onPress={confirmDenyRequest}>Deny</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Message Dialog */}
      <Portal>
        <Dialog visible={showMessageDialog} onDismiss={() => setShowMessageDialog(false)}>
          <Dialog.Title>Send Message</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Message"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={4}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMessageDialog(false)}>Cancel</Button>
            <Button onPress={sendMessage}>Send</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for quick actions */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('NewRequest' as any)}
      />
    </View>
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
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  requestsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666666',
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  doorName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requesterInfo: {
    color: '#666666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  priorityChip: {
    fontSize: 10,
  },
  reason: {
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    color: '#999999',
  },
  documents: {
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  modalTitle: {
    fontWeight: 'bold',
  },
  detailCard: {
    margin: 16,
    elevation: 0,
  },
  detailDoorName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailStatus: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  documentsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#28A745',
  },
  denyButton: {
    borderColor: '#DC3545',
  },
  messageButton: {
    borderColor: '#007AFF',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default RequestManagementScreen;

