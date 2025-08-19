import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  useTheme,
  ActivityIndicator,
  Menu,
  IconButton,
  List,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store';
import { updateRequest } from '../../store/slices/requestsSlice';
import { addChatRoom } from '../../store/slices/messagesSlice';
import ApiService from '../../services/api.service';
import DatabaseService from '../../services/database.service';
import WebSocketService from '../../services/websocket.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { 
  SCREENS, 
  REQUEST_STATUS, 
  REQUEST_PRIORITY,
  REQUEST_CATEGORY,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants';
import { AccessRequest, ChatRoom } from '../../types';
import { formatFullDate } from '../../utils/date.utils';

type RequestDetailsRouteProp = RouteProp<{ Details: { requestId: string } }, 'Details'>;

const RequestDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<RequestDetailsRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { requestId } = route.params;
  
  const user = useSelector((state: RootState) => state.auth.user);
  const request = useSelector((state: RootState) => 
    state.requests.requests.find(r => r.id === requestId)
  );
  const chatRoom = useSelector((state: RootState) =>
    state.messages.chatRooms.find(room => room.requestId === requestId)
  );
  
  const [isLoading, setIsLoading] = useState(!request);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!request) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.get<AccessRequest>(`/api/requests/${requestId}`);
      
      if (response.success && response.data) {
        dispatch(updateRequest(response.data));
      } else {
        Alert.alert('Error', 'Request not found');
        navigation.goBack();
      }
    } catch (error) {
      LoggingService.error('Failed to load request', 'RequestDetails', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setShowStatusMenu(false);
    setIsUpdating(true);
    
    try {
      const updatedRequest: AccessRequest = {
        ...request!,
        status: newStatus as any,
        updatedAt: new Date(),
        completedAt: newStatus === REQUEST_STATUS.COMPLETED ? new Date() : undefined,
      };
      
      // Update locally
      await DatabaseService.saveRequest(updatedRequest);
      dispatch(updateRequest(updatedRequest));
      
      // Send via WebSocket for real-time update
      WebSocketService.updateRequestStatus(requestId, newStatus, adminNotes);
      
      // Update via API
      const response = await ApiService.patch(`/api/requests/${requestId}`, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Request status updated');
        LoggingService.info('Request status updated', 'RequestDetails', { requestId, newStatus });
      }
    } catch (error) {
      LoggingService.error('Failed to update request', 'RequestDetails', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenChat = () => {
    if (chatRoom) {
      navigation.navigate(SCREENS.CHAT as never, { 
        chatRoomId: chatRoom.id, 
        requestId: requestId 
      } as never);
    } else {
      // Create chat room if it doesn't exist
      const newChatRoom: ChatRoom = {
        id: `chat_${requestId}`,
        requestId: requestId,
        participants: [request!.userId, user!.id],
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      dispatch(addChatRoom(newChatRoom));
      
      navigation.navigate(SCREENS.CHAT as never, { 
        chatRoomId: newChatRoom.id, 
        requestId: requestId 
      } as never);
    }
  };

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

  if (isLoading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={globalStyles.centerContainer}>
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentContainer}>
        {/* Status Card */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={[globalStyles.row, globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <View>
                <Text variant="titleLarge">Request Status</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  ID: {request.id.slice(-8)}
                </Text>
              </View>
              {isAdmin && (
                <Menu
                  visible={showStatusMenu}
                  onDismiss={() => setShowStatusMenu(false)}
                  anchor={
                    <IconButton
                      icon="pencil"
                      onPress={() => setShowStatusMenu(true)}
                      disabled={isUpdating}
                    />
                  }
                >
                  {Object.values(REQUEST_STATUS).map((status) => (
                    <Menu.Item
                      key={status}
                      onPress={() => {
                        setShowStatusMenu(false);
                        if (status !== request.status) {
                          setShowNotesDialog(true);
                        }
                      }}
                      title={status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      leadingIcon={() => (
                        <Icon
                          name={status === request.status ? 'check-circle' : 'circle-outline'}
                          size={20}
                          color={getStatusColor(status)}
                        />
                      )}
                    />
                  ))}
                </Menu>
              )}
            </View>
            
            <View style={globalStyles.row}>
              <Chip
                mode="flat"
                style={{ 
                  backgroundColor: getStatusColor(request.status) + '20',
                  marginRight: 8,
                }}
                textStyle={{ 
                  color: getStatusColor(request.status),
                  textTransform: 'capitalize',
                }}
              >
                {request.status.replace('_', ' ')}
              </Chip>
              
              <Chip
                mode="outlined"
                icon={() => (
                  <Icon
                    name={getPriorityIcon(request.priority)}
                    size={16}
                    color={getPriorityColor(request.priority)}
                  />
                )}
                style={{ marginRight: 8 }}
              >
                {request.priority} Priority
              </Chip>
              
              <Chip mode="outlined">
                {request.category}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Contact Information
            </Text>
            
            <List.Item
              title={request.name}
              description="Name"
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            
            <List.Item
              title={request.phone}
              description="Phone"
              left={(props) => <List.Icon {...props} icon="phone" />}
              onPress={() => {/* Open phone dialer */}}
            />
            
            {request.userId && (
              <List.Item
                title={request.userId}
                description="User ID"
                left={(props) => <List.Icon {...props} icon="identifier" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Request Details */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Request Details
            </Text>
            
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {request.reason}
            </Text>
            
            <Divider style={{ marginVertical: 16 }} />
            
            <View style={globalStyles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Created
                </Text>
                <Text variant="bodyMedium">
                  {formatFullDate(request.createdAt)}
                </Text>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Updated
                </Text>
                <Text variant="bodyMedium">
                  {formatFullDate(request.updatedAt)}
                </Text>
              </View>
            </View>
            
            {request.completedAt && (
              <View style={{ marginTop: 12 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Completed
                </Text>
                <Text variant="bodyMedium">
                  {formatFullDate(request.completedAt)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Admin Notes */}
        {request.adminNotes && (
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                Admin Notes
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {request.adminNotes}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ marginBottom: 32 }}>
          <Button
            mode="contained"
            onPress={handleOpenChat}
            icon="message"
            style={{ marginBottom: 12 }}
          >
            {chatRoom ? 'Continue Conversation' : 'Start Conversation'}
          </Button>
          
          {isAdmin && request.status === REQUEST_STATUS.PENDING && (
            <Button
              mode="outlined"
              onPress={() => handleStatusUpdate(REQUEST_STATUS.IN_PROGRESS)}
              loading={isUpdating}
              disabled={isUpdating}
            >
              Mark as In Progress
            </Button>
          )}
        </View>
      </View>

      {/* Admin Notes Dialog */}
      <Portal>
        <Dialog visible={showNotesDialog} onDismiss={() => setShowNotesDialog(false)}>
          <Dialog.Title>Add Admin Notes</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Notes (Optional)"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
              placeholder="Add any notes about this status change..."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNotesDialog(false)}>Cancel</Button>
            <Button 
              onPress={() => {
                setShowNotesDialog(false);
                // The actual status update will be triggered here
              }}
            >
              Update Status
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

export default RequestDetailsScreen;