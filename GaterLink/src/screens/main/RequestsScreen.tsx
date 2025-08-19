import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  FAB,
  Searchbar,
  useTheme,
  Menu,
  Divider,
  IconButton,
  Avatar,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../../store';
import { setRequests, setLoading } from '../../store/slices/requestsSlice';
import DatabaseService from '../../services/database.service';
import ApiService from '../../services/api.service';
import { globalStyles } from '../../styles/global';
import { SCREENS, REQUEST_STATUS, REQUEST_PRIORITY, REQUEST_CATEGORY } from '../../constants';
import { AccessRequest } from '../../types';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type SortType = 'date_desc' | 'date_asc' | 'priority' | 'status';

const RequestsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { requests, isLoading } = useSelector((state: RootState) => state.requests);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    dispatch(setLoading(true));
    try {
      // Load from local database
      const localRequests = await DatabaseService.getRequests(isAdmin ? undefined : user?.id);
      dispatch(setRequests(localRequests));

      // Fetch from API if online
      if (isOnline) {
        const endpoint = isAdmin ? '/api/requests' : '/api/requests/my';
        const response = await ApiService.get<AccessRequest[]>(endpoint);
        
        if (response.success && response.data) {
          dispatch(setRequests(response.data));
          // Update local database
          for (const request of response.data) {
            await DatabaseService.saveRequest(request);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.status === filterType);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.reason.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.phone.includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortType) {
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'status':
        const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
    }

    return sorted;
  }, [requests, filterType, searchQuery, sortType]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return theme.colors.warning;
      case REQUEST_STATUS.IN_PROGRESS:
        return theme.colors.info;
      case REQUEST_STATUS.COMPLETED:
        return theme.colors.success;
      case REQUEST_STATUS.CANCELLED:
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case REQUEST_PRIORITY.HIGH:
        return 'alert-circle';
      case REQUEST_PRIORITY.MEDIUM:
        return 'alert';
      case REQUEST_PRIORITY.LOW:
        return 'information';
      default:
        return 'information';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case REQUEST_PRIORITY.HIGH:
        return theme.colors.error;
      case REQUEST_PRIORITY.MEDIUM:
        return theme.colors.warning;
      case REQUEST_PRIORITY.LOW:
        return theme.colors.info;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderRequestItem = ({ item }: { item: AccessRequest }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(SCREENS.REQUEST_DETAILS as never, { requestId: item.id } as never)}
    >
      <Card style={{ marginHorizontal: 16, marginVertical: 8 }}>
        <Card.Content>
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <View style={{ flex: 1 }}>
              <View style={globalStyles.row}>
                <Icon
                  name={getPriorityIcon(item.priority)}
                  size={20}
                  color={getPriorityColor(item.priority)}
                />
                <Text variant="bodyLarge" style={{ marginLeft: 8, flex: 1 }} numberOfLines={1}>
                  {item.reason}
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                {item.name} • {format(new Date(item.createdAt), 'MMM d, h:mm a')}
              </Text>
              {item.phone && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.phone}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Chip
                mode="flat"
                compact
                style={{ 
                  backgroundColor: getStatusColor(item.status) + '20',
                  marginBottom: 4,
                }}
                textStyle={{ 
                  color: getStatusColor(item.status),
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {item.status.replace('_', ' ')}
              </Chip>
              <Chip
                mode="outlined"
                compact
                style={{ borderColor: theme.colors.outline }}
                textStyle={{ fontSize: 11 }}
              >
                {item.category}
              </Chip>
            </View>
          </View>
          
          {isAdmin && (
            <View style={[globalStyles.row, { marginTop: 8 }]}>
              <Avatar.Icon 
                size={24} 
                icon="account" 
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
              <Text variant="bodySmall" style={{ marginLeft: 8 }}>
                Request ID: {item.id.slice(-8)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[globalStyles.centerContainer, { paddingTop: 100 }]}>
      <Icon name="clipboard-text-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={{ marginTop: 16 }}>
        No Requests Found
      </Text>
      <Text 
        variant="bodyMedium" 
        style={{ 
          color: theme.colors.onSurfaceVariant, 
          textAlign: 'center',
          marginTop: 8,
          paddingHorizontal: 32,
        }}
      >
        {searchQuery || filterType !== 'all' 
          ? 'Try adjusting your filters or search terms'
          : 'Create your first access request to get started'}
      </Text>
      {filterType === 'all' && !searchQuery && (
        <FAB
          label="Create Request"
          icon="plus"
          style={{ marginTop: 24 }}
          onPress={() => navigation.navigate('NewRequest' as never)}
        />
      )}
    </View>
  );

  return (
    <View style={globalStyles.container}>
      {/* Search and Filter Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Searchbar
          placeholder="Search requests..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: 12 }}
        />
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 8 }]}>
          <SegmentedButtons
            value={filterType}
            onValueChange={(value) => setFilterType(value as FilterType)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'Active' },
              { value: 'completed', label: 'Done' },
            ]}
            style={{ flex: 1 }}
          />
          
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <IconButton
                icon="sort"
                onPress={() => setShowSortMenu(true)}
                style={{ marginLeft: 8 }}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSortType('date_desc');
                setShowSortMenu(false);
              }}
              title="Newest First"
              leadingIcon="sort-calendar-descending"
            />
            <Menu.Item
              onPress={() => {
                setSortType('date_asc');
                setShowSortMenu(false);
              }}
              title="Oldest First"
              leadingIcon="sort-calendar-ascending"
            />
            <Menu.Item
              onPress={() => {
                setSortType('priority');
                setShowSortMenu(false);
              }}
              title="Priority"
              leadingIcon="sort-variant"
            />
            <Menu.Item
              onPress={() => {
                setSortType('status');
                setShowSortMenu(false);
              }}
              title="Status"
              leadingIcon="sort-alphabetical-variant"
            />
          </Menu>
        </View>
      </View>

      {/* Request List */}
      {isLoading && requests.length === 0 ? (
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* FAB for new request */}
      {!isAdmin && (
        <FAB
          icon="plus"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
          }}
          onPress={() => navigation.navigate('NewRequest' as never)}
        />
      )}
    </View>
  );
};

export default RequestsScreen;