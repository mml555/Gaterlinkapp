import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Searchbar,
  Avatar,
  Badge,
  FAB,
  Card,
  IconButton,
  Menu,
  Divider,
  useTheme,
  Surface,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { HomeNavigationProp } from '../../types/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchChats, setActiveChat } from '../../store/slices/chatSlice';
import { useAuth } from '../../contexts/AuthContext';
import { themeConstants } from '../../utils/theme';
import { Chat } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

interface ChatListItemProps {
  chat: Chat;
  onPress: (chat: Chat) => void;
  onLongPress: (chat: Chat) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress, onLongPress }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const getOtherParticipantName = useCallback(() => {
    // In a real app, you'd look up participant names
    // For now, we'll use a simple approach
    return chat.participants.find(p => p !== user?.id) || 'Unknown User';
  }, [chat.participants, user?.id]);

  const formatLastMessageTime = useCallback((timestamp: Date) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  }, []);

  const truncateMessage = useCallback((message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  }, []);

  return (
    <TouchableOpacity
      onPress={() => onPress(chat)}
      onLongPress={() => onLongPress(chat)}
      accessible={true}
      accessibilityLabel={`Chat with ${getOtherParticipantName()}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to open chat"
    >
      <Surface style={[styles.chatItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={50}
            label={getOtherParticipantName().charAt(0).toUpperCase()}
            style={{ backgroundColor: themeConstants.colors.primary['500'] }}
          />
          {chat.unreadCount > 0 && (
            <Badge
              size={20}
              style={[styles.unreadBadge, { backgroundColor: themeConstants.colors.error['500'] }]}
            >
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Badge>
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text
              variant="titleMedium"
              style={[
                styles.participantName,
                { color: theme.colors.onSurface },
                chat.unreadCount > 0 && styles.unreadName
              ]}
              numberOfLines={1}
            >
              {getOtherParticipantName()}
            </Text>
            {chat.lastMessage && (
              <Text
                variant="bodySmall"
                style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
              >
                {formatLastMessageTime(chat.lastMessage.timestamp)}
              </Text>
            )}
          </View>
          
          {chat.lastMessage && (
            <Text
              variant="bodyMedium"
              style={[
                styles.lastMessage,
                { color: theme.colors.onSurfaceVariant },
                chat.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {chat.lastMessage.senderId === user?.id ? 'You: ' : ''}
              {truncateMessage(chat.lastMessage.content)}
            </Text>
          )}
        </View>
        
        <View style={styles.chatActions}>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => onLongPress(chat)}
            accessible={true}
            accessibilityLabel="Chat options"
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const ChatListScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const { chats, isLoading, error } = useSelector((state: RootState) => state.chat);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'active'>('all');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchChats(user.id) as any);
    }
  }, [dispatch, user?.id]);

  const handleRefresh = useCallback(async () => {
    if (user?.id) {
      setRefreshing(true);
      try {
        await dispatch(fetchChats(user.id) as any);
      } catch (error) {
        console.error('Failed to refresh chats:', error);
      } finally {
        setRefreshing(false);
      }
    }
  }, [dispatch, user?.id]);

  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat =>
        chat.participants.some(participant =>
          participant.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unreadCount > 0);
        break;
      case 'active':
        filtered = filtered.filter(chat => 
          chat.lastMessage && 
          new Date(chat.lastMessage.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => {
      // Sort unread chats first, then by last message time
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      const aTime = a.lastMessage?.timestamp || a.updatedAt;
      const bTime = b.lastMessage?.timestamp || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [chats, searchQuery, filter]);

  const handleChatPress = useCallback((chat: Chat) => {
    dispatch(setActiveChat(chat));
    navigation.navigate('Chat', { chatId: chat.id, requestId: chat.requestId });
  }, [dispatch, navigation]);

  const handleChatLongPress = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    setMenuVisible(true);
  }, []);

  const handleDeleteChat = useCallback(async (chat: Chat) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete chat functionality
            console.log('Delete chat:', chat.id);
            setMenuVisible(false);
            setSelectedChat(null);
          },
        },
      ]
    );
  }, []);

  const handleMarkAsRead = useCallback(async (chat: Chat) => {
    if (user?.id && chat.unreadCount > 0) {
      // TODO: Implement mark as read functionality
      console.log('Mark as read:', chat.id);
      setMenuVisible(false);
      setSelectedChat(null);
    }
  }, [user?.id]);

  const handleNewChat = useCallback(() => {
    // TODO: Navigate to new chat creation screen
    Alert.alert('Coming Soon', 'New chat creation will be available soon.');
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        size={80}
        icon="message-outline"
        style={{ backgroundColor: themeConstants.colors.primary['100'] }}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        No conversations yet
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Start a conversation to get help with your access requests
      </Text>
      <Button
        mode="contained"
        onPress={handleNewChat}
        style={styles.emptyButton}
      >
        Start a conversation
      </Button>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        size={80}
        icon="alert-circle-outline"
        style={{ backgroundColor: themeConstants.colors.error['100'] }}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.error }]}>
        Failed to load chats
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {error || 'Please try again later'}
      </Text>
      <Button
        mode="contained"
        onPress={handleRefresh}
        style={styles.emptyButton}
      >
        Try again
      </Button>
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: filter === 'all' ? theme.colors.primary : theme.colors.surfaceVariant },
        ]}
        onPress={() => setFilter('all')}
        accessible={true}
        accessibilityLabel="Show all chats"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.filterChipText,
            { color: filter === 'all' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: filter === 'unread' ? theme.colors.primary : theme.colors.surfaceVariant },
        ]}
        onPress={() => setFilter('unread')}
        accessible={true}
        accessibilityLabel="Show unread chats"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.filterChipText,
            { color: filter === 'unread' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
          ]}
        >
          Unread
        </Text>
        {chats.filter(chat => chat.unreadCount > 0).length > 0 && (
          <Badge
            size={16}
            style={[
              styles.filterBadge,
              { backgroundColor: filter === 'unread' ? theme.colors.onPrimary : theme.colors.primary },
            ]}
          >
            {chats.filter(chat => chat.unreadCount > 0).length}
          </Badge>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: filter === 'active' ? theme.colors.primary : theme.colors.surfaceVariant },
        ]}
        onPress={() => setFilter('active')}
        accessible={true}
        accessibilityLabel="Show active chats"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.filterChipText,
            { color: filter === 'active' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
          ]}
        >
          Active
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search conversations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        accessible={true}
        accessibilityLabel="Search conversations"
        accessibilityHint="Type to search through your conversations"
      />

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Chat List */}
      {error && !isLoading ? (
        renderErrorState()
      ) : filteredChats.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              onPress={handleChatPress}
              onLongPress={handleChatLongPress}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[themeConstants.colors.primary['500']]}
              tintColor={themeConstants.colors.primary['500']}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Divider style={styles.separator} />}
          accessible={true}
          accessibilityLabel="Chat list"
        />
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleNewChat}
        accessible={true}
        accessibilityLabel="Start new conversation"
        accessibilityRole="button"
      />

      {/* Context Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<View />}
        contentStyle={{ backgroundColor: theme.colors.surface }}
      >
        {selectedChat && selectedChat.unreadCount > 0 && (
          <Menu.Item
            onPress={() => handleMarkAsRead(selectedChat)}
            title="Mark as read"
            leadingIcon="check"
          />
        )}
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            setSelectedChat(null);
            // TODO: Navigate to chat info
            Alert.alert('Coming Soon', 'Chat info will be available soon.');
          }}
          title="Chat info"
          leadingIcon="information"
        />
        <Divider />
        <Menu.Item
          onPress={() => selectedChat && handleDeleteChat(selectedChat)}
          title="Delete chat"
          leadingIcon="delete"
          titleStyle={{ color: themeConstants.colors.error['500'] }}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: themeConstants.spacing.md,
    borderRadius: themeConstants.borderRadius.lg,
    ...themeConstants.shadows.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: themeConstants.spacing.md,
    paddingBottom: themeConstants.spacing.sm,
    gap: themeConstants.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.xs,
    borderRadius: themeConstants.borderRadius.full,
    gap: themeConstants.spacing.xs,
  },
  filterChipText: {
    fontSize: themeConstants.typography.fontSize.sm,
    fontWeight: '500' as const,
  },
  filterBadge: {
    minWidth: 16,
    height: 16,
  },
  listContainer: {
    paddingBottom: themeConstants.spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.md,
    ...themeConstants.shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: themeConstants.spacing.md,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: themeConstants.spacing.xs,
  },
  participantName: {
    flex: 1,
    fontWeight: '500' as const,
  },
  unreadName: {
    fontWeight: '700' as const,
  },
  timestamp: {
    fontSize: themeConstants.typography.fontSize.xs,
    marginLeft: themeConstants.spacing.sm,
  },
  lastMessage: {
    fontSize: themeConstants.typography.fontSize.sm,
  },
  unreadMessage: {
    fontWeight: '500' as const,
  },
  chatActions: {
    justifyContent: 'center',
  },
  separator: {
    marginHorizontal: themeConstants.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: themeConstants.spacing.xl,
  },
  emptyTitle: {
    marginTop: themeConstants.spacing.lg,
    marginBottom: themeConstants.spacing.sm,
    textAlign: 'center',
    fontWeight: '700' as const,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: themeConstants.typography.lineHeight.normal,
    marginBottom: themeConstants.spacing.lg,
  },
  emptyButton: {
    marginTop: themeConstants.spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: themeConstants.spacing.md,
    right: 0,
    bottom: 0,
    ...themeConstants.shadows.lg,
  },
});

export default ChatListScreen;

