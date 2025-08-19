import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NotificationState, AppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = await notificationService.getNotifications();
      const unreadCount = await notificationService.getBadgeCount();
      return { notifications, unreadCount };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: any, { rejectWithValue }) => {
    try {
      // For now, just return success since updateSettings doesn't exist
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notification settings');
    }
  }
);

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<AppNotification> }>) => {
      const { id, updates } = action.payload;
      const notificationIndex = state.notifications.findIndex(notif => notif.id === id);
      
      if (notificationIndex !== -1) {
        const wasRead = state.notifications[notificationIndex].isRead;
        state.notifications[notificationIndex] = { 
          ...state.notifications[notificationIndex], 
          ...updates 
        };
        
        // Update unread count
        const isNowRead = state.notifications[notificationIndex].isRead;
        if (!wasRead && isNowRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (wasRead && !isNowRead) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(notif => notif.id === notificationId);
      
      if (notificationIndex !== -1) {
        const wasRead = state.notifications[notificationIndex].isRead;
        state.notifications.splice(notificationIndex, 1);
        
        // Update unread count
        if (!wasRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        // Transform NotificationData[] to AppNotification[]
        state.notifications = action.payload.notifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.body, // Map body to message
          type: 'system' as any, // Default to system type
          isRead: notification.read,
          timestamp: notification.timestamp,
          data: notification.data,
        }));
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const notificationId = action.payload;
        const notificationIndex = state.notifications.findIndex(notif => notif.id === notificationId);
        
        if (notificationIndex !== -1 && !state.notifications[notificationIndex].isRead) {
          state.notifications[notificationIndex].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark all notifications as read
    builder
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.isLoading = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        const notificationId = action.payload;
        const notificationIndex = state.notifications.findIndex(notif => notif.id === notificationId);
        
        if (notificationIndex !== -1) {
          const wasRead = state.notifications[notificationIndex].isRead;
          state.notifications.splice(notificationIndex, 1);
          
          if (!wasRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update notification settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  addNotification, 
  updateNotification, 
  removeNotification,
  clearNotifications,
  setUnreadCount
} = notificationSlice.actions;

export default notificationSlice.reducer;
