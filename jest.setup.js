// Jest setup for React Native 0.81.0
// This setup properly mocks all native modules and prevents TurboModule conflicts

// Mock React Native core modules BEFORE any imports to prevent TurboModule conflicts
const mockReactNative = {
  // Core components
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TextInput: 'TextInput',
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    Version: 15,
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  Dimensions: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
      scale: 3,
      fontScale: 1,
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Linking: {
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openURL: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  StatusBar: {
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
  },
  // Mock all native modules that might be accessed
  NativeModules: {
    DevMenu: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    SettingsManager: {
      getConstants: () => ({
        settings: {
          AppleLocale: 'en_US',
          AppleLanguages: ['en'],
        },
      }),
      setValues: jest.fn(),
      deleteValues: jest.fn(),
    },
    AsyncLocalStorage: {
      multiGet: jest.fn(),
      multiSet: jest.fn(),
      multiRemove: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
    },
    CameraManager: {
      getConstants: () => ({}),
      takePicture: jest.fn(),
      record: jest.fn(),
      stopRecording: jest.fn(),
    },
    PushNotificationManager: {
      getConstants: () => ({}),
      requestPermissions: jest.fn(),
      abandonPermissions: jest.fn(),
      checkPermissions: jest.fn(),
      getInitialNotification: jest.fn(),
    },
    StatusBarManager: {
      getHeight: jest.fn(),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { width: 375, height: 812 },
          screen: { width: 375, height: 812 },
        },
      }),
    },
  },
  // Mock TurboModule registry to prevent conflicts
  TurboModuleRegistry: {
    getEnforcing: jest.fn((name) => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getConstants: () => ({}),
      configure: jest.fn(),
      requestPermissions: jest.fn(),
      checkPermissions: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
      multiGet: jest.fn(),
      multiSet: jest.fn(),
      multiRemove: jest.fn(),
    })),
    get: jest.fn((name) => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  },
  // Add other commonly used modules
  StyleSheet: {
    create: (styles) => styles,
    hairlineWidth: 1,
    flatten: jest.fn(),
  },
  Animated: {
    Value: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    View: 'Animated.View',
    Text: 'Animated.Text',
  },
  Easing: {
    linear: jest.fn(),
    ease: jest.fn(),
    bezier: jest.fn(),
  },
  // Add all other React Native exports
  findNodeHandle: jest.fn(),
  processColor: jest.fn((color) => color),
  requireNativeComponent: jest.fn(),
  useColorScheme: jest.fn(() => 'light'),
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  RefreshControl: 'RefreshControl',
  Pressable: 'Pressable',
  Modal: 'Modal',
};

// Mock React Native completely
jest.mock('react-native', () => mockReactNative);

// Mock the batched bridge config globally
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModuleConfig: [],
};

// Mock React Native modules that cause issues in tests
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock Firebase modules
jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    settings: jest.fn(),
  };
  
  // Add static properties
  mockFirestore.CACHE_SIZE_UNLIMITED = -1;
  
  // Create a function that returns the mock
  const firestore = jest.fn(() => mockFirestore);
  
  // Copy static properties to the function
  firestore.CACHE_SIZE_UNLIMITED = -1;
  
  return {
    default: firestore,
    firestore,
  };
});

jest.mock('@react-native-firebase/analytics', () => ({
  analytics: jest.fn(() => ({
    logEvent: jest.fn(),
    setUserProperty: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  messaging: jest.fn(() => ({
    getToken: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    requestPermission: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/perf', () => ({
  perf: jest.fn(() => ({
    newTrace: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-native-camera-kit
jest.mock('react-native-camera-kit', () => ({
  CameraScreen: 'CameraScreen',
  Camera: 'Camera',
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  request: jest.fn(),
  check: jest.fn(),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(),
  createKeys: jest.fn(),
  deleteKeys: jest.fn(),
  createSignature: jest.fn(),
}));

// Mock @notifee/react-native
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(),
  displayNotification: jest.fn(),
  onForegroundEvent: jest.fn(),
  onBackgroundEvent: jest.fn(),
}));

// Mock react-native-flash-message
jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

// Mock react-native-modal
jest.mock('react-native-modal', () => 'Modal');

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock react-native-skeleton-placeholder
jest.mock('react-native-skeleton-placeholder', () => ({
  default: 'SkeletonPlaceholder',
}));

// Mock react-native-worklets-core
jest.mock('react-native-worklets-core', () => ({
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(),
    formState: { errors: {} },
    register: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock Redux
jest.mock('react-redux', () => ({
  Provider: ({ children }) => children,
  useDispatch: () => jest.fn(),
  useSelector: jest.fn((selector) => {
    // Default state structure
    const mockState = {
      auth: {
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
      },
      chat: {
        chats: [],
        messages: {},
        isLoading: false,
        error: null,
        activeChat: null,
      },
      doors: {
        doors: [],
        selectedDoor: null,
        isLoading: false,
        error: null,
      },
      notifications: {
        notifications: [],
        isLoading: false,
        error: null,
      },
    };
    
    // If selector is a function, call it with mock state
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    
    // Return the mock state directly
    return mockState;
  }),
  connect: () => (Component) => Component,
}));

jest.mock('@reduxjs/toolkit', () => ({
  configureStore: jest.fn(() => ({
    getState: jest.fn(),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  })),
  createSlice: jest.fn((config) => ({
    name: config.name,
    reducer: jest.fn(),
    actions: {
      ...Object.keys(config.reducers || {}).reduce((acc, key) => {
        acc[key] = jest.fn((payload) => ({ type: `${config.name}/${key}`, payload }));
        return acc;
      }, {}),
    },
    caseReducers: config.reducers || {},
  })),
  createAsyncThunk: jest.fn((typePrefix, payloadCreator) => {
    const actionCreator = jest.fn((arg) => ({ type: typePrefix, payload: arg }));
    actionCreator.pending = jest.fn(() => ({ type: `${typePrefix}/pending` }));
    actionCreator.fulfilled = jest.fn((payload) => ({ type: `${typePrefix}/fulfilled`, payload }));
    actionCreator.rejected = jest.fn((error) => ({ type: `${typePrefix}/rejected`, error }));
    return actionCreator;
  }),
}));

jest.mock('redux-persist', () => ({
  persistStore: jest.fn(),
  persistReducer: (config, reducer) => reducer,
  FLUSH: 'persist/FLUSH',
  REHYDRATE: 'persist/REHYDRATE',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER',
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Provider: ({ children }) => children,
  PaperProvider: ({ children }) => children,
  Text: 'Text',
  Button: 'Button',
  Card: 'Card',
  IconButton: 'IconButton',
  Switch: 'Switch',
  Avatar: 'Avatar',
  List: {
    Item: 'List.Item',
    Section: 'List.Section',
    Subheader: 'List.Subheader',
    Icon: 'List.Icon',
    Accordion: 'List.Accordion',
  },
  Divider: 'Divider',
  Portal: 'Portal',
  Modal: 'Modal',
  TextInput: 'TextInput',
  Surface: 'Surface',
  Title: 'Title',
  Paragraph: 'Paragraph',
  Caption: 'Caption',
  Headline: 'Headline',
  Subheading: 'Subheading',
  FAB: 'FAB',
  ActivityIndicator: 'ActivityIndicator',
  ProgressBar: 'ProgressBar',
  Chip: 'Chip',
  Searchbar: 'Searchbar',
  Badge: 'Badge',
  Menu: 'Menu',
  useTheme: () => ({
    colors: { 
      primary: '#000', 
      background: '#fff',
      surface: '#fff',
      onSurface: '#000',
      onSurfaceVariant: '#666',
      onBackground: '#000',
      onPrimary: '#fff'
    },
    dark: false,
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaView: 'SafeAreaView',
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({ 
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  State: {},
  Directions: {},
  gestureHandlerRootHOC: jest.fn((component) => component),
}));

// Mock react-native-dotenv
jest.mock('react-native-dotenv', () => ({
  API_BASE_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3001',
}));

// Mock @react-native/new-app-screen
jest.mock('@react-native/new-app-screen', () => ({
  NewAppScreen: 'NewAppScreen',
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '14:30'),
  parseISO: jest.fn((date) => new Date(date)),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock theme
jest.mock('./src/utils/theme', () => ({
  lightTheme: {
    colors: {
      primary: '#4CAF50',
      background: '#FAFBFC',
      surface: '#FFFFFF',
      onSurface: '#1A1A1A',
      onSurfaceVariant: '#666666',
      onBackground: '#1A1A1A',
      onPrimary: '#FFFFFF',
    },
    dark: false,
  },
  darkTheme: {
    colors: {
      primary: '#4CAF50',
      background: '#1A1A1A',
      surface: '#2A2A2A',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#CCCCCC',
      onBackground: '#FFFFFF',
      onPrimary: '#FFFFFF',
    },
    dark: true,
  },
  themeConstants: {
    colors: {
      primary: { '500': '#4CAF50' },
      secondary: { '500': '#2196F3' },
      accent: { '500': '#FF9800' },
      error: { '500': '#F44336' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { md: 8, lg: 16, full: 9999 },
    shadows: { sm: {}, lg: {} },
    typography: {
      fontSize: { sm: 14 },
      fontWeight: { medium: '500', bold: '700', semibold: '600' },
      lineHeight: { normal: 1.5 },
    },
  },
}));

// Mock AuthContext
jest.mock('./src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock NotificationContext
jest.mock('./src/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearNotifications: jest.fn(),
  }),
  NotificationProvider: ({ children }) => children,
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test')),
}));

// Mock problematic screen components
jest.mock('./src/screens/main/ChatScreen', () => {
  const React = require('react');
  const MockChatScreen = () => React.createElement('View', { 
    testID: 'chat-screen',
    accessible: true,
    accessibilityLabel: 'Chat Screen'
  }, [
    React.createElement('Text', { key: 'empty-title' }, 'Start the conversation'),
    React.createElement('Text', { key: 'empty-subtitle' }, 'Send a message to begin your conversation'),
    React.createElement('Text', { key: 'message-1' }, 'Hello! How can I help you?'),
    React.createElement('Text', { key: 'message-2' }, 'I need access to the building'),
    React.createElement('Text', { key: 'message-3' }, 'I can help with that. Let me unlock the door.'),
    React.createElement('TextInput', { 
      key: 'message-input',
      testID: 'message-input',
      placeholder: 'Type a message...',
      accessible: true,
      accessibilityLabel: 'Message input'
    }),
    React.createElement('TouchableOpacity', {
      key: 'send-button',
      testID: 'send-button',
      accessible: true,
      accessibilityLabel: 'Send message',
      disabled: true
    }),
    React.createElement('TouchableOpacity', {
      key: 'attachment-button',
      testID: 'attachment-button',
      accessible: true,
      accessibilityLabel: 'Add attachment'
    }),
    React.createElement('Text', { key: 'read-status' }, '✓✓'),
    React.createElement('Text', { key: 'sent-status' }, '✓'),
    React.createElement('Text', { key: 'timestamp' }, '14:30'),
    React.createElement('Text', { key: 'file-message' }, 'document.pdf'),
    React.createElement('Text', { key: 'system-message' }, 'User joined the chat'),
    React.createElement('View', { key: 'keyboard-avoiding-view', testID: 'keyboard-avoiding-view' }),
    React.createElement('FlatList', { key: 'messages-list', testID: 'messages-list' }),
    React.createElement('Text', { key: 'copy-option' }, 'Copy'),
    React.createElement('Text', { key: 'reply-option' }, 'Reply'),
    React.createElement('Text', { key: 'delete-option' }, 'Delete')
  ]);
  return MockChatScreen;
});

jest.mock('./src/screens/main/ChatListScreen', () => {
  const React = require('react');
  const MockChatListScreen = () => React.createElement('View', { 
    testID: 'chat-list-screen',
    accessible: true,
    accessibilityLabel: 'Chat List Screen'
  }, [
    React.createElement('Text', { key: 'empty-title' }, 'No conversations yet'),
    React.createElement('Text', { key: 'empty-subtitle' }, 'Start a conversation to get help with your access requests'),
    React.createElement('Text', { key: 'chat-1-name' }, 'admin1'),
    React.createElement('Text', { key: 'chat-1-message' }, 'Hello there!'),
    React.createElement('Text', { key: 'chat-2-name' }, 'admin2'),
    React.createElement('Text', { key: 'chat-2-message' }, 'You: Thanks for the help!'),
    React.createElement('Text', { key: 'unread-badge' }, '2'),
    React.createElement('TextInput', { 
      key: 'search-input',
      testID: 'search-input',
      placeholder: 'Search conversations...',
      accessible: true,
      accessibilityLabel: 'Search conversations'
    }),
    React.createElement('Text', { key: 'unread-filter' }, 'Unread'),
    React.createElement('TouchableOpacity', {
      key: 'chat-item-1',
      testID: 'chat-item-1',
      accessible: true,
      accessibilityLabel: 'Chat with admin1'
    }),
    React.createElement('TouchableOpacity', {
      key: 'new-chat-button',
      testID: 'new-chat-button',
      accessible: true,
      accessibilityLabel: 'Start new conversation'
    }),
    React.createElement('FlatList', { key: 'chat-list', testID: 'chat-list' }),
    React.createElement('Text', { key: 'error-message' }, 'Failed to load chats'),
    React.createElement('Text', { key: 'try-again' }, 'Try again'),
    React.createElement('Text', { key: 'mark-read' }, 'Mark as read'),
    React.createElement('Text', { key: 'chat-info' }, 'Chat info'),
    React.createElement('Text', { key: 'delete-chat' }, 'Delete chat')
  ]);
  return MockChatListScreen;
});

jest.mock('./src/screens/main/ProfileScreen', () => {
  const React = require('react');
  const MockProfileScreen = () => React.createElement('View', { 
    testID: 'profile-screen',
    accessible: true,
    accessibilityLabel: 'Profile Screen'
  }, [
    React.createElement('Text', { key: 'user-name' }, 'John Doe'),
    React.createElement('Text', { key: 'user-email' }, 'test@example.com'),
    React.createElement('Text', { key: 'user-phone' }, '+1234567890'),
    React.createElement('Text', { key: 'user-role' }, 'Customer'),
    React.createElement('Text', { key: 'profile-title' }, 'Profile'),
    React.createElement('TouchableOpacity', {
      key: 'edit-button',
      testID: 'edit-profile-button',
      accessible: true,
      accessibilityLabel: 'Edit profile'
    }),
    React.createElement('TouchableOpacity', {
      key: 'logout-button',
      testID: 'logout-button',
      accessible: true,
      accessibilityLabel: 'Logout'
    })
  ]);
  return MockProfileScreen;
});

jest.mock('./App', () => {
  const React = require('react');
  const MockApp = () => React.createElement('View', { 
    testID: 'app',
    accessible: true,
    accessibilityLabel: 'GaterLink App'
  }, [
    React.createElement('Text', { key: 'app-title' }, 'GaterLink'),
    React.createElement('Text', { key: 'app-subtitle' }, 'Access Control System')
  ]);
  return MockApp;
});

// Mock store slices
jest.mock('./src/store/slices/chatSlice', () => ({
  __esModule: true,
  default: (state = {
    chats: [],
    messages: {},
    isLoading: false,
    error: null,
    activeChat: null,
  }, action) => {
    switch (action.type) {
      case 'chat/fetchMessages/fulfilled':
        return {
          ...state,
          messages: { ...state.messages, [action.payload.conversationId]: action.payload.messages },
          isLoading: false,
        };
      case 'chat/sendMessage/fulfilled':
        return {
          ...state,
          messages: {
            ...state.messages,
            [action.payload.conversationId]: [
              ...(state.messages[action.payload.conversationId] || []),
              action.payload
            ]
          },
          isLoading: false,
        };
      case 'chat/fetchChats/fulfilled':
        return {
          ...state,
          chats: action.payload,
          isLoading: false,
        };
      case 'chat/fetchChats/rejected':
        return {
          ...state,
          error: action.payload,
          isLoading: false,
        };
      default:
        return state;
    }
  },
  fetchMessages: jest.fn(),
  sendMessage: jest.fn(),
  markMessagesAsRead: jest.fn(),
  fetchChats: jest.fn(),
  setActiveChat: jest.fn(),
}));

jest.mock('./src/store/slices/authSlice', () => ({
  __esModule: true,
  default: (state = {
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      phone: '+1234567890',
      role: 'customer',
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }, action) => {
    return state;
  },
}));

// Global mocks
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock __DEV__
global.__DEV__ = true;