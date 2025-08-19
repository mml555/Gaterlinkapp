import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

const RequestsScreen: React.FC = () => {
  const [requests] = useState([
    {
      id: '1',
      requester: 'John Doe',
      door: 'Front Door',
      type: 'temporary',
      status: 'pending',
      requestedAt: '2 hours ago',
      duration: '2 hours',
    },
    {
      id: '2',
      requester: 'Jane Smith',
      door: 'Back Gate',
      type: 'permanent',
      status: 'approved',
      requestedAt: '1 day ago',
      duration: 'Indefinite',
    },
    {
      id: '3',
      requester: 'Mike Johnson',
      door: 'Garage Door',
      type: 'temporary',
      status: 'rejected',
      requestedAt: '3 days ago',
      duration: '1 day',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'permanent' ? '#2196F3' : '#FF9800';
  };

  const handleRequestAction = (requestId: string, action: string) => {
    console.log(`${action} request ${requestId}`);
    // Handle request actions here
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Access Requests</Text>
          <Text style={styles.subtitle}>Manage door access requests</Text>
        </View>

        <View style={styles.requestsList}>
          {requests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <Card.Content>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requesterName}>{request.requester}</Text>
                    <Text style={styles.doorName}>{request.door}</Text>
                  </View>
                  <View style={styles.requestStatus}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(request.status) }}
                      style={[styles.statusChip, { borderColor: getStatusColor(request.status) }]}
                    >
                      {request.status}
                    </Chip>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getTypeColor(request.type) }}
                      style={[styles.typeChip, { borderColor: getTypeColor(request.type) }]}
                    >
                      {request.type}
                    </Chip>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.detailText}>Requested: {request.requestedAt}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="access-time" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.detailText}>Duration: {request.duration}</Text>
                  </View>
                </View>

                {request.status === 'pending' && (
                  <View style={styles.requestActions}>
                    <Button
                      mode="contained"
                      onPress={() => handleRequestAction(request.id, 'approve')}
                      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    >
                      Approve
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleRequestAction(request.id, 'reject')}
                      style={[styles.actionButton, { borderColor: '#F44336' }]}
                      textColor="#F44336"
                    >
                      Reject
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Request Statistics</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  requestsList: {
    paddingHorizontal: 24,
  },
  requestCard: {
    marginBottom: 16,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  doorName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  requestStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  typeChip: {
    marginBottom: 4,
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 8,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  statsSection: {
    padding: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RequestsScreen;
