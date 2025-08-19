import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  useTheme,
  Avatar,
  Surface,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import { format, isToday, isYesterday } from 'date-fns';
import { RootState, AppDispatch } from '../../store';
import { 
  setMessages, 
  addMessage, 
  markMessageAsRead,
  resetUnreadCount,
} from '../../store/slices/messagesSlice';
import WebSocketService from '../../services/websocket.service';
import ApiService from '../../services/api.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { Message, ChatRoom } from '../../types';
import { formatDate } from '../../utils/date.utils';

type ChatScreenRouteProp = RouteProp<{ Chat: { chatRoomId: string; requestId?: string } }, 'Chat'>;

const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const flatListRef = useRef<FlatList>(null);
  
  const { chatRoomId, requestId } = route.params;
  
  const user = useSelector((state: RootState) => state.auth.user);
  const messages = useSelector((state: RootState) => state.messages.messages[chatRoomId] || []);
  const typingUsers = useSelector((state: RootState) => state.messages.typingUsers[chatRoomId] || []);
  const chatRoom = useSelector((state: RootState) => 
    state.messages.chatRooms.find(room => room.id === chatRoomId)
  );
  
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    joinChatRoom();
    markMessagesAsRead();
    
    return () => {
      leaveChatRoom();
    };
  }, [chatRoomId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.get<Message[]>(`/api/chat/${chatRoomId}/messages`);
      
      if (response.success && response.data) {
        dispatch(setMessages({ chatRoomId, messages: response.data }));
      }
    } catch (error) {
      LoggingService.error('Failed to load messages', 'Chat', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinChatRoom = () => {
    WebSocketService.joinRoom(chatRoomId);
    LoggingService.info('Joined chat room', 'Chat', { chatRoomId });
  };

  const leaveChatRoom = () => {
    WebSocketService.leaveRoom(chatRoomId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    WebSocketService.sendTyping(chatRoomId, false);
  };

  const markMessagesAsRead = () => {
    dispatch(resetUnreadCount(chatRoomId));
    // Mark unread messages as read
    messages.filter(m => !m.isRead && m.senderId !== user?.id).forEach(message => {
      WebSocketService.markMessageAsRead(chatRoomId, message.id);
      dispatch(markMessageAsRead({ chatRoomId, messageId: message.id }));
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      chatRoomId,
      senderId: user!.id,
      content: messageText.trim(),
      type: 'text',
      timestamp: new Date(),
      isRead: false,
    };

    setMessageText('');
    setIsSending(true);
    WebSocketService.sendTyping(chatRoomId, false);

    try {
      // Optimistically add message
      dispatch(addMessage({ chatRoomId, message: tempMessage }));
      
      // Send via WebSocket
      WebSocketService.sendMessage(chatRoomId, {
        senderId: user!.id,
        content: tempMessage.content,
        type: 'text',
        isRead: false,
      });

      // Also send via API for persistence
      await ApiService.post(`/api/chat/${chatRoomId}/messages`, {
        content: tempMessage.content,
        type: 'text',
      });
    } catch (error) {
      LoggingService.error('Failed to send message', 'Chat', error as Error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    // Send typing indicator
    if (text.length > 0) {
      WebSocketService.sendTyping(chatRoomId, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        WebSocketService.sendTyping(chatRoomId, false);
      }, 2000);
    } else {
      WebSocketService.sendTyping(chatRoomId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleImagePicker = () => {
    setShowAttachmentMenu(false);
    
    Alert.alert(
      'Select Image',
      'Choose from where you want to select an image',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 1024,
        height: 1024,
        cropping: true,
        includeBase64: false,
      });
      
      await uploadImage(image);
    } catch (error) {
      LoggingService.error('Camera error', 'Chat', error as Error);
    }
  };

  const openGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1024,
        height: 1024,
        cropping: true,
        includeBase64: false,
      });
      
      await uploadImage(image);
    } catch (error) {
      LoggingService.error('Gallery error', 'Chat', error as Error);
    }
  };

  const uploadImage = async (image: any) => {
    try {
      const response = await ApiService.uploadFile(
        `/api/chat/${chatRoomId}/upload`,
        {
          uri: image.path,
          type: image.mime,
          name: `image_${Date.now()}.jpg`,
        },
        { type: 'image' }
      );

      if (response.success && response.data) {
        const imageMessage: Message = {
          id: `temp_${Date.now()}`,
          chatRoomId,
          senderId: user!.id,
          content: 'Image',
          type: 'image',
          timestamp: new Date(),
          isRead: false,
          metadata: {
            imageUrl: response.data.url,
            fileName: response.data.fileName,
            fileSize: response.data.fileSize,
          },
        };

        dispatch(addMessage({ chatRoomId, message: imageMessage }));
        
        WebSocketService.sendMessage(chatRoomId, {
          senderId: user!.id,
          content: 'Image',
          type: 'image',
          isRead: false,
          metadata: imageMessage.metadata,
        });
      }
    } catch (error) {
      LoggingService.error('Failed to upload image', 'Chat', error as Error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleFilePicker = async () => {
    setShowAttachmentMenu(false);
    
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      const file = result[0];
      
      const response = await ApiService.uploadFile(
        `/api/chat/${chatRoomId}/upload`,
        {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'file',
        },
        { type: 'file' }
      );

      if (response.success && response.data) {
        const fileMessage: Message = {
          id: `temp_${Date.now()}`,
          chatRoomId,
          senderId: user!.id,
          content: file.name || 'File',
          type: 'file',
          timestamp: new Date(),
          isRead: false,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
          },
        };

        dispatch(addMessage({ chatRoomId, message: fileMessage }));
        
        WebSocketService.sendMessage(chatRoomId, {
          senderId: user!.id,
          content: file.name || 'File',
          type: 'file',
          isRead: false,
          metadata: fileMessage.metadata,
        });
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
      } else {
        LoggingService.error('Failed to pick file', 'Chat', error as Error);
        Alert.alert('Error', 'Failed to upload file. Please try again.');
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.senderId.charAt(0).toUpperCase()}
            style={{ marginRight: 8 }}
          />
        )}
        
        <Surface
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwnMessage
                ? theme.colors.primary
                : theme.colors.surfaceVariant,
              maxWidth: '75%',
            },
          ]}
        >
          {item.type === 'text' && (
            <Text
              style={{
                color: isOwnMessage
                  ? theme.colors.onPrimary
                  : theme.colors.onSurface,
              }}
            >
              {item.content}
            </Text>
          )}
          
          {item.type === 'image' && item.metadata?.imageUrl && (
            <TouchableOpacity>
              <Image
                source={{ uri: item.metadata.imageUrl }}
                style={{ width: 200, height: 200, borderRadius: 8 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          {item.type === 'file' && (
            <TouchableOpacity style={styles.fileAttachment}>
              <Icon 
                name="file-document" 
                size={24} 
                color={isOwnMessage ? theme.colors.onPrimary : theme.colors.primary} 
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    color: isOwnMessage ? theme.colors.onPrimary : theme.colors.onSurface,
                    fontSize: 14,
                  }}
                  numberOfLines={1}
                >
                  {item.metadata?.fileName || 'File'}
                </Text>
                {item.metadata?.fileSize && (
                  <Text
                    style={{
                      color: isOwnMessage ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      fontSize: 12,
                    }}
                  >
                    {formatFileSize(item.metadata.fileSize)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          
          <Text
            style={{
              color: isOwnMessage
                ? theme.colors.onPrimary + '80'
                : theme.colors.onSurfaceVariant,
              fontSize: 11,
              marginTop: 4,
            }}
          >
            {format(new Date(item.timestamp), 'h:mm a')}
            {item.isRead && isOwnMessage && ' ✓✓'}
          </Text>
        </Surface>
      </View>
    );
  };

  const renderDateSeparator = (date: Date) => {
    let dateText = '';
    
    if (isToday(date)) {
      dateText = 'Today';
    } else if (isYesterday(date)) {
      dateText = 'Yesterday';
    } else {
      dateText = format(date, 'MMMM d, yyyy');
    }
    
    return (
      <View style={styles.dateSeparator}>
        <Chip compact style={{ backgroundColor: theme.colors.surfaceVariant }}>
          {dateText}
        </Chip>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <View style={[styles.messageContainer, styles.otherMessage]}>
        <Avatar.Text
          size={32}
          label="?"
          style={{ marginRight: 8 }}
        />
        <Surface style={[styles.messageBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
          </View>
        </Surface>
      </View>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={globalStyles.container}>
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListFooterComponent={renderTypingIndicator}
        />
        
        <Surface style={styles.inputContainer}>
          <IconButton
            icon="attachment"
            onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
          />
          
          <TextInput
            value={messageText}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            style={styles.textInput}
            right={
              <TextInput.Icon
                icon={isSending ? 'loading' : 'send'}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              />
            }
          />
        </Surface>
        
        {showAttachmentMenu && (
          <Surface style={styles.attachmentMenu}>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleImagePicker}>
              <Icon name="image" size={24} color={theme.colors.primary} />
              <Text style={{ marginLeft: 12 }}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleFilePicker}>
              <Icon name="file-document" size={24} color={theme.colors.primary} />
              <Text style={{ marginLeft: 12 }}>Document</Text>
            </TouchableOpacity>
          </Surface>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = {
  messageContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ownMessage: {
    justifyContent: 'flex-end' as const,
  },
  otherMessage: {
    justifyContent: 'flex-start' as const,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    marginHorizontal: 8,
  },
  dateSeparator: {
    alignItems: 'center' as const,
    marginVertical: 16,
  },
  typingDots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  fileAttachment: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  attachmentMenu: {
    position: 'absolute' as const,
    bottom: 80,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 8,
  },
  attachmentOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
};

export default ChatScreen;