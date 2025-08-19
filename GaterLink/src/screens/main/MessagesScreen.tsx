import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Avatar,
  Badge,
  Searchbar,
  useTheme,
  Surface,
  ActivityIndicator,
  Divider,
  FAB,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store';
import { setChatRooms, addChatRoom } from '../../store/slices/messagesSlice';
import ApiService from '../../services/api.service';
import WebSocketService from '../../services/websocket.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { SCREENS } from '../../constants';
import { ChatRoom, AccessRequest } from '../../types';
import { formatRelativeDate } from '../../utils/date.utils';

const MessagesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const chatRooms = useSelector((state: RootState) => state.messages.chatRooms);
  const requests = useSelector((state: RootState) => state.requests.requests);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadChatRooms();
    connectWebSocket();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const connectWebSocket = () => {
    const authToken = user?.id; // This should be the actual auth token
    if (authToken && isOnline) {
      WebSocketService.connect(authToken);
    }
  };

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.get<ChatRoom[]>('/api/chat/rooms');
      
      if (response.success && response.data) {
        dispatch(setChatRooms(response.data));
      }
    } catch (error) {
      LoggingService.error('Failed to load chat rooms', 'Messages', error as Error);
      // For now, create mock chat rooms from requests
      createChatRoomsFromRequests();
    } finally {
      setIsLoading(false);
    }
  };

  const createChatRoomsFromRequests = () => {
    // Create chat rooms from existing requests (temporary solution)
    const mockChatRooms: ChatRoom[] = requests.map(request => ({
      id: `chat_${request.id}`,
      requestId: request.id,
      participants: [request.userId, 'admin'],
      lastMessage: undefined,
      unreadCount: 0,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
    
    dispatch(setChatRooms(mockChatRooms));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadChatRooms();
    setIsRefreshing(false);
  };

  const getRequestInfo = (chatRoom: ChatRoom): AccessRequest | undefined => {
    return requests.find(r => r.id === chatRoom.requestId);
  };

  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchQuery) return true;
    
    const request = getRequestInfo(room);
    if (!request) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      request.name.toLowerCase().includes(query) ||
      request.reason.toLowerCase().includes(query) ||
      request.phone.includes(query)
    );
  });

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const request = getRequestInfo(item);
    if (!request) return null;
    
    const otherParticipant = item.participants.find(id => id !== user?.id);
    const hasUnread = item.unreadCount > 0;
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(
          SCREENS.CHAT as never, 
          { chatRoomId: item.id, requestId: item.requestId } as never
        )}
      >
        <Surface style={styles.chatItem}>
          <Avatar.Text
            size={48}
            label={request.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: theme.colors.primary }}
          />
          
          <View style={styles.chatContent}>
            <View style={[globalStyles.row, globalStyles.spaceBetween]}>
              <Text 
                variant="bodyLarge" 
                style={{ 
                  fontWeight: hasUnread ? 'bold' : 'normal',
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {request.name}
              </Text>
              {item.lastMessage && (
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    color: hasUnread ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  }}
                >
                  {formatRelativeDate(item.lastMessage.timestamp)}
                </Text>
              )}
            </View>
            
            <Text 
              variant="bodySmall" 
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
              numberOfLines={1}
            >
              {request.reason}
            </Text>
            
            {item.lastMessage ? (
              <View style={[globalStyles.row, globalStyles.spaceBetween, { marginTop: 4 }]}>
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    color: hasUnread ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    fontWeight: hasUnread ? '600' : 'normal',
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.lastMessage.type === 'text' 
                    ? item.lastMessage.content 
                    : item.lastMessage.type === 'image' 
                    ? '📷 Photo' 
                    : '📄 Document'
                  }
                </Text>
                {hasUnread && (
                  <Badge 
                    size={20} 
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {item.unreadCount}
                  </Badge>
                )}
              </View>
            ) : (
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                No messages yet
              </Text>
            )}
          </View>
        </Surface>
        <Divider />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={[globalStyles.centerContainer, { paddingTop: 100 }]}>
      <Icon name="message-text-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={{ marginTop: 16 }}>
        No Messages Yet
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
        {isAdmin 
          ? 'Messages from access requests will appear here'
          : 'Start a conversation by creating an access request'}
      </Text>
      {!isAdmin && (
        <FAB
          label="New Request"
          icon="plus"
          style={{ marginTop: 24 }}
          onPress={() => navigation.navigate('NewRequest' as never)}
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Searchbar
        placeholder="Search conversations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ margin: 16, marginBottom: 8 }}
      />
      
      {!isOnline && (
        <Surface style={styles.offlineBanner}>
          <Icon name="wifi-off" size={20} color={theme.colors.warning} />
          <Text variant="bodySmall" style={{ marginLeft: 8, color: theme.colors.warning }}>
            You're offline. New messages will appear when connected.
          </Text>
        </Surface>
      )}
      
      <FlatList
        data={filteredChatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Connection Status Indicator */}
      {WebSocketService.isConnected() && (
        <View style={styles.connectionIndicator}>
          <View style={[styles.connectionDot, { backgroundColor: theme.colors.success }]} />
          <Text variant="bodySmall" style={{ marginLeft: 4 }}>Connected</Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  chatItem: {
    flexDirection: 'row' as const,
    padding: 16,
    backgroundColor: 'transparent',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  offlineBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3CD',
  },
  connectionIndicator: {
    position: 'absolute' as const,
    bottom: 90,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
};

export default MessagesScreen;