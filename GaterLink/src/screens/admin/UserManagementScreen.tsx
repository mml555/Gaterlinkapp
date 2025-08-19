import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Avatar,
  IconButton,
  Chip,
  FAB,
  Menu,
  Button,
  useTheme,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../services/api.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { User } from '../../types';
import { formatDate } from '../../utils/date.utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants';

interface UserWithStats extends User {
  requestCount?: number;
  lastActive?: Date;
  isActive?: boolean;
}

const UserManagementScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'requests'>('name');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: 'customer' });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, filterRole, sortBy]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.get<UserWithStats[]>('/api/users');
      
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        // Mock data for testing
        setUsers([
          {
            id: '1',
            email: 'john.doe@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            role: 'customer',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
            requestCount: 5,
            lastActive: new Date(),
            isActive: true,
          },
          {
            id: '2',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            phone: '+0987654321',
            role: 'admin',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-18'),
            requestCount: 0,
            lastActive: new Date(),
            isActive: true,
          },
        ]);
      }
    } catch (error) {
      LoggingService.error('Failed to load users', 'UserManagement', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];
    
    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.phone && u.phone.includes(query))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'requests':
        filtered.sort((a, b) => (b.requestCount || 0) - (a.requestCount || 0));
        break;
    }
    
    setFilteredUsers(filtered);
  };

  const handleUserPress = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setEditForm({
      name: selectedUser.name,
      phone: selectedUser.phone || '',
      role: selectedUser.role,
    });
    setShowUserDialog(false);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await ApiService.patch(`/api/users/${selectedUser.id}`, editForm);
      
      if (response.success) {
        Alert.alert('Success', 'User updated successfully');
        setShowEditDialog(false);
        loadUsers();
      } else {
        Alert.alert('Error', response.error || ERROR_MESSAGES.GENERIC_ERROR);
      }
    } catch (error) {
      LoggingService.error('Failed to update user', 'UserManagement', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    }
  };

  const handleToggleUserStatus = async (user: UserWithStats) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.patch(`/api/users/${user.id}/status`, {
                isActive: newStatus,
              });
              
              if (response.success) {
                Alert.alert('Success', `User ${action}d successfully`);
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserWithStats }) => (
    <TouchableOpacity onPress={() => handleUserPress(item)}>
      <Card style={{ marginHorizontal: 16, marginVertical: 8 }}>
        <Card.Content>
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <View style={globalStyles.row}>
              <Avatar.Text
                size={48}
                label={item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                style={{ backgroundColor: item.role === 'admin' ? theme.colors.primary : theme.colors.secondary }}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={globalStyles.row}>
                  <Text variant="bodyLarge" style={{ flex: 1 }}>
                    {item.name}
                  </Text>
                  {!item.isActive && (
                    <Chip 
                      compact 
                      mode="flat" 
                      style={{ backgroundColor: theme.colors.error + '20' }}
                      textStyle={{ fontSize: 11, color: theme.colors.error }}
                    >
                      Inactive
                    </Chip>
                  )}
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.email}
                </Text>
                <View style={[globalStyles.row, { marginTop: 4 }]}>
                  <Chip
                    compact
                    mode="outlined"
                    style={{ marginRight: 8 }}
                    textStyle={{ fontSize: 11 }}
                  >
                    {item.role === 'admin' ? 'Admin' : 'Customer'}
                  </Chip>
                  {item.requestCount !== undefined && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {item.requestCount} requests
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <IconButton
              icon="chevron-right"
              onPress={() => handleUserPress(item)}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[globalStyles.centerContainer, { paddingTop: 100 }]}>
      <Icon name="account-group-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={{ marginTop: 16 }}>
        No Users Found
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
        {searchQuery || filterRole !== 'all'
          ? 'Try adjusting your filters'
          : 'No users registered yet'}
      </Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      {/* Search and Filter Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: 12 }}
        />
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 8 }]}>
          <View style={globalStyles.row}>
            <Chip
              selected={filterRole === 'all'}
              onPress={() => setFilterRole('all')}
              mode={filterRole === 'all' ? 'flat' : 'outlined'}
              style={{ marginRight: 8 }}
            >
              All ({users.length})
            </Chip>
            <Chip
              selected={filterRole === 'customer'}
              onPress={() => setFilterRole('customer')}
              mode={filterRole === 'customer' ? 'flat' : 'outlined'}
              style={{ marginRight: 8 }}
            >
              Customers ({users.filter(u => u.role === 'customer').length})
            </Chip>
            <Chip
              selected={filterRole === 'admin'}
              onPress={() => setFilterRole('admin')}
              mode={filterRole === 'admin' ? 'flat' : 'outlined'}
            >
              Admins ({users.filter(u => u.role === 'admin').length})
            </Chip>
          </View>
          
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <IconButton
                icon="sort"
                onPress={() => setShowSortMenu(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('name');
                setShowSortMenu(false);
              }}
              title="Sort by Name"
              leadingIcon={sortBy === 'name' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('date');
                setShowSortMenu(false);
              }}
              title="Sort by Date"
              leadingIcon={sortBy === 'date' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('requests');
                setShowSortMenu(false);
              }}
              title="Sort by Requests"
              leadingIcon={sortBy === 'requests' ? 'check' : undefined}
            />
          </Menu>
        </View>
      </View>

      {/* User List */}
      {isLoading ? (
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* User Details Dialog */}
      <Portal>
        <Dialog visible={showUserDialog} onDismiss={() => setShowUserDialog(false)}>
          <Dialog.Title>User Details</Dialog.Title>
          <Dialog.Content>
            {selectedUser && (
              <View>
                <View style={[globalStyles.row, { alignItems: 'center', marginBottom: 16 }]}>
                  <Avatar.Text
                    size={64}
                    label={selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    style={{ backgroundColor: selectedUser.role === 'admin' ? theme.colors.primary : theme.colors.secondary }}
                  />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text variant="titleMedium">{selectedUser.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {selectedUser.email}
                    </Text>
                  </View>
                </View>
                
                <Divider style={{ marginVertical: 16 }} />
                
                <View style={{ marginBottom: 12 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Phone</Text>
                  <Text variant="bodyMedium">{selectedUser.phone || 'Not provided'}</Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Role</Text>
                  <Text variant="bodyMedium">{selectedUser.role === 'admin' ? 'Administrator' : 'Customer'}</Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Status</Text>
                  <Text variant="bodyMedium">{selectedUser.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Member Since</Text>
                  <Text variant="bodyMedium">{formatDate(selectedUser.createdAt)}</Text>
                </View>
                
                {selectedUser.lastActive && (
                  <View style={{ marginBottom: 12 }}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Last Active</Text>
                    <Text variant="bodyMedium">{formatDate(selectedUser.lastActive)}</Text>
                  </View>
                )}
                
                {selectedUser.requestCount !== undefined && (
                  <View>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Requests</Text>
                    <Text variant="bodyMedium">{selectedUser.requestCount}</Text>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowUserDialog(false)}>Close</Button>
            <Button onPress={handleEditUser}>Edit</Button>
            {selectedUser && (
              <Button
                onPress={() => {
                  setShowUserDialog(false);
                  handleToggleUserStatus(selectedUser);
                }}
                textColor={selectedUser.isActive ? theme.colors.error : theme.colors.success}
              >
                {selectedUser.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              style={{ marginBottom: 16 }}
            />
            
            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
              keyboardType="phone-pad"
              style={{ marginBottom: 16 }}
            />
            
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>Role</Text>
            <RadioButton.Group
              onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              value={editForm.role}
            >
              <RadioButton.Item label="Customer" value="customer" />
              <RadioButton.Item label="Administrator" value="admin" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for adding new admin */}
      <FAB
        icon="account-plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => {/* Navigate to add user screen */}}
      />
    </View>
  );
};

export default UserManagementScreen;