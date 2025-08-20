import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  Card,
  useTheme,
  Surface,
  Menu,
  Divider,
  Button,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMessages, sendMessage, markMessagesAsRead } from '../../store/slices/chatSlice';
import { useAuth } from '../../contexts/AuthContext';
import { themeConstants } from '../../utils/theme';
import { ChatMessage, MessageType } from '../../types';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

const { width, height } = Dimensions.get('window');

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showTime: boolean;
  onLongPress: (message: ChatMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showTime,
  onLongPress,
}) => {
  const theme = useTheme();

  const formatMessageTime = useCallback((timestamp: Date) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  }, []);

  const renderMessageContent = () => {
    switch (message.messageType) {
      case MessageType.IMAGE:
        return (
          <TouchableOpacity
            onPress={() => {
              // TODO: Open image viewer
              Alert.alert('Image Viewer', 'Image viewer will be available soon.');
            }}
            accessible={true}
            accessibilityLabel="View image"
            accessibilityRole="button"
          >
            <Image
              source={{ uri: message.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      case MessageType.FILE:
        return (
          <TouchableOpacity
            style={[styles.fileMessage, { borderColor: theme.colors.outline }]}
            onPress={() => {
              // TODO: Handle file download/open
              Alert.alert('File Download', 'File download will be available soon.');
            }}
            accessible={true}
            accessibilityLabel="Download file"
            accessibilityRole="button"
          >
            <View style={styles.fileIcon}>
              <Text style={[styles.fileExtension, { color: theme.colors.primary }]}>
                {message.metadata?.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
              </Text>
            </View>
            <View style={styles.fileInfo}>
              <Text
                variant="bodyMedium"
                style={[styles.fileName, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {message.metadata?.fileName || 'Unknown file'}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.fileSize, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}
              >
                {message.metadata?.fileSize ? `${(message.metadata.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      case MessageType.SYSTEM:
        return (
          <Text
            variant="bodySmall"
            style={[styles.systemMessage, { color: theme.colors.onSurfaceVariant }]}
          >
            {message.content}
          </Text>
        );
      default:
        return (
          <Text
            variant="bodyMedium"
            style={[
              styles.messageText,
              { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface }
            ]}
            selectable={true}
          >
            {message.content}
          </Text>
        );
    }
  };

  if (message.messageType === MessageType.SYSTEM) {
    return (
      <View style={styles.systemMessageContainer}>
        <Surface style={[styles.systemMessageBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
          {renderMessageContent()}
        </Surface>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(message)}
      style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}
      accessible={true}
      accessibilityLabel={`Message from ${isOwn ? 'you' : message.senderName}: ${message.content}`}
      accessibilityRole="button"
      accessibilityHint="Long press for more options"
    >
      {!isOwn && showAvatar && (
        <Avatar.Text
          size={32}
          label={message.senderName.charAt(0).toUpperCase()}
          style={[styles.messageAvatar, { backgroundColor: themeConstants.colors.secondary['500'] }]}
        />
      )}
      
      <View style={styles.messageBubbleContainer}>
        <Surface
          style={[
            styles.messageBubble,
            isOwn ? {
              backgroundColor: theme.colors.primary,
              borderBottomRightRadius: 4,
            } : {
              backgroundColor: theme.colors.surface,
              borderBottomLeftRadius: 4,
            },
            !isOwn && !showAvatar && { marginLeft: 40 },
          ]}
        >
          {renderMessageContent()}
        </Surface>
        
        <View style={[styles.messageMetadata, isOwn ? styles.ownMetadata : styles.otherMetadata]}>
          {showTime && (
            <Text
              variant="bodySmall"
              style={[styles.messageTime, { color: theme.colors.onSurfaceVariant }]}
            >
              {formatMessageTime(message.timestamp)}
            </Text>
          )}
          
          {isOwn && (
            <View style={styles.messageStatus}>
              {message.isRead ? (
                <Text style={[styles.statusIcon, { color: themeConstants.colors.primary['500'] }]}>
                  ✓✓
                </Text>
              ) : (
                <Text style={[styles.statusIcon, { color: theme.colors.onSurfaceVariant }]}>
                  ✓
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface TypingIndicatorProps {
  participants: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ participants }) => {
  const theme = useTheme();

  if (participants.length === 0) return null;

  return (
    <View style={styles.typingContainer}>
      <Surface style={[styles.typingBubble, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.typingDots}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text
            variant="bodySmall"
            style={[styles.typingText, { color: theme.colors.onSurfaceVariant }]}
          >
            {participants.length === 1
              ? `${participants[0]} is typing...`
              : `${participants.length} people are typing...`
            }
          </Text>
        </View>
      </Surface>
    </View>
  );
};

const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  const { chatId } = route.params as { chatId: string };
  const { messages, activeChat, isLoading } = useSelector((state: RootState) => state.chat);
  const chatMessages = messages[chatId] || [];
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (chatId) {
      dispatch(fetchMessages(chatId) as any);
      if (user?.id) {
        dispatch(markMessagesAsRead({ conversationId: chatId, userId: user.id }) as any);
      }
    }
  }, [dispatch, chatId, user?.id]);

  useEffect(() => {
    // Set navigation title
    if (activeChat) {
      const otherParticipant = activeChat.participants.find(p => p !== user?.id);
      navigation.setOptions({
        title: otherParticipant || 'Chat',
      });
    }
  }, [navigation, activeChat, user?.id]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !user?.id || !user?.firstName) return;

    const content = messageText.trim();
    setMessageText('');
    setIsTyping(false);

    try {
      await dispatch(sendMessage({
        conversationId: chatId,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        content,
        type: 'text',
      }) as any);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [messageText, user, chatId, dispatch]);

  const handleMessageLongPress = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
    setMenuVisible(true);
  }, []);

  const handleCopyMessage = useCallback(() => {
    if (selectedMessage) {
      // TODO: Implement clipboard copy
      Alert.alert('Copied', 'Message copied to clipboard');
      setMenuVisible(false);
      setSelectedMessage(null);
    }
  }, [selectedMessage]);

  const handleDeleteMessage = useCallback(() => {
    if (selectedMessage) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              // TODO: Implement message deletion
              console.log('Delete message:', selectedMessage.id);
              setMenuVisible(false);
              setSelectedMessage(null);
            },
          },
        ]
      );
    }
  }, [selectedMessage]);

  const handleAttachment = useCallback(() => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Photo Library', onPress: () => console.log('Open photo library') },
        { text: 'Document', onPress: () => console.log('Open document picker') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const groupedMessages = useMemo(() => {
    const grouped: { data: ChatMessage; showAvatar: boolean; showTime: boolean }[] = [];
    
    chatMessages.forEach((message, index) => {
      const previousMessage = chatMessages[index - 1];
      const nextMessage = chatMessages[index + 1];
      
      const isOwnMessage = message.senderId === user?.id;
      const isPreviousFromSameSender = previousMessage?.senderId === message.senderId;
      const isNextFromSameSender = nextMessage?.senderId === message.senderId;
      
      const timeDiff = previousMessage 
        ? new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime()
        : 0;
      
      const showAvatar = !isOwnMessage && (!isNextFromSameSender || !nextMessage);
      const showTime = !isPreviousFromSameSender || timeDiff > 300000; // 5 minutes
      
      grouped.push({
        data: message,
        showAvatar,
        showTime,
      });
    });
    
    return grouped.reverse(); // Reverse for FlatList inverted
  }, [chatMessages, user?.id]);

  const renderMessage = ({ item }: { item: { data: ChatMessage; showAvatar: boolean; showTime: boolean } }) => (
    <MessageBubble
      message={item.data}
      isOwn={item.data.senderId === user?.id}
      showAvatar={item.showAvatar}
      showTime={item.showTime}
      onLongPress={handleMessageLongPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        size={80}
        icon="message-outline"
        style={{ backgroundColor: themeConstants.colors.primary['100'] }}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        Start the conversation
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Send a message to begin your conversation
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.data.id}
        renderItem={renderMessage}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.messagesContainer,
          groupedMessages.length === 0 && styles.emptyMessagesContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when new messages arrive
          if (groupedMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        accessible={true}
        accessibilityLabel="Chat messages"
      />

      {/* Typing Indicator */}
      <TypingIndicator participants={typingUsers} />

      {/* Message Input */}
      <Surface style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="attachment"
          size={24}
          onPress={handleAttachment}
          accessible={true}
          accessibilityLabel="Add attachment"
        />
        
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            // Handle typing indicator
            if (text.length > 0 && !isTyping) {
              setIsTyping(true);
              // TODO: Send typing start event
            } else if (text.length === 0 && isTyping) {
              setIsTyping(false);
              // TODO: Send typing stop event
            }
          }}
          multiline
          mode="outlined"
          dense
          accessible={true}
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />
        
        <IconButton
          icon="send"
          size={24}
          disabled={!messageText.trim()}
          onPress={handleSendMessage}
          style={[
            styles.sendButton,
            messageText.trim() && { backgroundColor: theme.colors.primary },
          ]}
          iconColor={messageText.trim() ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
          accessible={true}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        />
      </Surface>

      {/* Message Context Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<View />}
        contentStyle={{ backgroundColor: theme.colors.surface }}
      >
        <Menu.Item
          onPress={handleCopyMessage}
          title="Copy"
          leadingIcon="content-copy"
        />
        {selectedMessage?.messageType !== MessageType.SYSTEM && (
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setSelectedMessage(null);
              // TODO: Implement reply functionality
              Alert.alert('Coming Soon', 'Reply feature will be available soon.');
            }}
            title="Reply"
            leadingIcon="reply"
          />
        )}
        {selectedMessage?.senderId === user?.id && (
          <>
            <Divider />
            <Menu.Item
              onPress={handleDeleteMessage}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: themeConstants.colors.error['500'] }}
            />
          </>
        )}
      </Menu>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: themeConstants.spacing.sm,
    paddingHorizontal: themeConstants.spacing.md,
  },
  emptyMessagesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: themeConstants.spacing.xs,
    maxWidth: width * 0.8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginHorizontal: themeConstants.spacing.xs,
    alignSelf: 'flex-end',
  },
  messageBubbleContainer: {
    flex: 1,
  },
  messageBubble: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.sm,
    borderRadius: themeConstants.borderRadius.lg,
    ...themeConstants.shadows.sm,
  },
  messageText: {
    fontSize: themeConstants.typography.fontSize.md,
    lineHeight: themeConstants.typography.lineHeight.normal,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: themeConstants.borderRadius.md,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeConstants.spacing.sm,
    borderWidth: 1,
    borderRadius: themeConstants.borderRadius.md,
    minWidth: 200,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: themeConstants.borderRadius.sm,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: themeConstants.spacing.sm,
  },
  fileExtension: {
    fontSize: 10,
    fontWeight: themeConstants.typography.fontWeight.bold,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: themeConstants.typography.fontWeight.medium,
  },
  fileSize: {
    marginTop: 2,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: themeConstants.spacing.md,
  },
  systemMessageBubble: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.sm,
    borderRadius: themeConstants.borderRadius.full,
  },
  systemMessage: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: themeConstants.spacing.xs,
    gap: themeConstants.spacing.xs,
  },
  ownMetadata: {
    justifyContent: 'flex-end',
  },
  otherMetadata: {
    justifyContent: 'flex-start',
    marginLeft: 40,
  },
  messageTime: {
    fontSize: themeConstants.typography.fontSize.xs,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: themeConstants.typography.fontWeight.bold,
  },
  typingContainer: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.xs,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.sm,
    borderRadius: themeConstants.borderRadius.lg,
    maxWidth: width * 0.8,
    ...themeConstants.shadows.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeConstants.spacing.sm,
  },
  typingText: {
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: themeConstants.spacing.sm,
    paddingVertical: themeConstants.spacing.sm,
    gap: themeConstants.spacing.sm,
    ...themeConstants.shadows.lg,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
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
    fontWeight: themeConstants.typography.fontWeight.bold,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: themeConstants.typography.lineHeight.normal,
  },
});

export default ChatScreen;
