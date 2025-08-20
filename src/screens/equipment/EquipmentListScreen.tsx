import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  FAB,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Text,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchEquipment, deleteEquipment } from '../../store/slices/equipmentSlice';
import { Equipment, EquipmentStatus, EquipmentType } from '../../types';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';

type EquipmentListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EquipmentList'>;

const EquipmentListScreen: React.FC = () => {
  const navigation = useNavigation<EquipmentListScreenNavigationProp>();
  const dispatch = useDispatch();
  const { equipment, isLoading, error } = useSelector((state: RootState) => state.equipment);
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<EquipmentType | 'all'>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      await dispatch(fetchEquipment() as any);
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipment();
    setRefreshing(false);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteEquipment(equipmentId) as any);
              Alert.alert('Success', 'Equipment deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete equipment');
            }
          },
        },
      ]
    );
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

  const getTypeIcon = (type: EquipmentType) => {
    switch (type) {
      case EquipmentType.EXCAVATOR:
        return '🚜';
      case EquipmentType.BULLDOZER:
        return '🚜';
      case EquipmentType.CRANE:
        return '🏗️';
      case EquipmentType.FORKLIFT:
        return '🚛';
      case EquipmentType.GENERATOR:
        return '⚡';
      case EquipmentType.COMPRESSOR:
        return '💨';
      case EquipmentType.WELDER:
        return '🔥';
      case EquipmentType.TOOLS:
        return '🔧';
      default:
        return '⚙️';
    }
  };

  const filteredEquipment = equipment.filter((item: Equipment) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.siteName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesType = filterType === 'all' || item.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const renderEquipmentItem = ({ item }: { item: Equipment }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('EquipmentDetails', { equipmentId: item.id })}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.equipmentIcon}>{getTypeIcon(item.type)}</Text>
            <View style={styles.titleText}>
              <Title style={styles.equipmentName}>{item.name}</Title>
              <Paragraph style={styles.equipmentSite}>{item.siteName}</Paragraph>
            </View>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('EquipmentDetails', { equipmentId: item.id });
              }}
              title="View Details"
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('EquipmentReservation', { equipmentId: item.id });
              }}
              title="Reserve"
              leadingIcon="calendar"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // Navigate to edit screen
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteEquipment(item.id);
              }}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: '#F44336' }}
            />
          </Menu>
        </View>

        <Paragraph style={styles.description} numberOfLines={2}>
          {item.description}
        </Paragraph>

        <View style={styles.cardFooter}>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status.replace('_', ' ')}
          </Chip>
          
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>Type: {item.type.replace('_', ' ')}</Text>
            {item.location && (
              <Text style={styles.metadataText}>Location: {item.location}</Text>
            )}
          </View>
        </View>

        {item.nextAvailable && (
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityText}>
              Next Available: {new Date(item.nextAvailable).toLocaleDateString()}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip
          selected={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
          style={styles.filterChip}
        >
          All Status
        </Chip>
        {Object.values(EquipmentStatus).map((status) => (
          <Chip
            key={status}
            selected={filterStatus === status}
            onPress={() => setFilterStatus(status)}
            style={styles.filterChip}
          >
            {status.replace('_', ' ')}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilterContainer}>
        <Chip
          selected={filterType === 'all'}
          onPress={() => setFilterType('all')}
          style={styles.filterChip}
        >
          All Types
        </Chip>
        {Object.values(EquipmentType).map((type) => (
          <Chip
            key={type}
            selected={filterType === type}
            onPress={() => setFilterType(type)}
            style={styles.filterChip}
          >
            {type.replace('_', ' ')}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading equipment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search equipment..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {renderFilterChips()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={loadEquipment}>Retry</Button>
        </View>
      )}

      <FlatList
        data={filteredEquipment}
        renderItem={renderEquipmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No equipment found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add some equipment to get started'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('EquipmentReservation', { equipmentId: undefined })}
        label="Add Equipment"
      />
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
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typeFilterContainer: {
    marginTop: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  equipmentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  titleText: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  equipmentSite: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
  },
  metadata: {
    alignItems: 'flex-end',
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  availabilityInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: '#1976D2',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default EquipmentListScreen;
