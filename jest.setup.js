// Essential mocks for React Native testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
    },
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
      get: jest.fn(),
    },
    __fbBatchedBridgeConfig: {
      remoteModuleConfig: [],
      localModuleConfig: [],
    },
  };
});

// Mock essential React Native libraries
jest.mock('react-native-gesture-handler', () => ({}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-flash-message', () => 'FlashMessage');
jest.mock('react-native-modal', () => 'Modal');
jest.mock('react-native-skeleton-placeholder', () => 'SkeletonPlaceholder');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets-core', () => ({
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
}));

// Mock native modules
jest.mock('react-native-keychain', () => ({
  getInternetCredentials: jest.fn(),
  setInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
}));

jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(),
  createKeys: jest.fn(),
  deleteKeys: jest.fn(),
  createSignature: jest.fn(),
  simplePrompt: jest.fn(),
}));

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelLocalNotifications: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  requestPermissions: jest.fn(),
  abandonPermissions: jest.fn(),
  checkPermissions: jest.fn(),
  getInitialNotification: jest.fn(),
  getBadgeCount: jest.fn(),
  setBadgeCount: jest.fn(),
  clearAllNotifications: jest.fn(),
  getChannels: jest.fn(),
  channelExists: jest.fn(),
  createChannel: jest.fn(),
  channelBlocked: jest.fn(),
  deleteChannel: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

// Mock Redux
jest.mock('react-redux', () => ({
  Provider: ({ children }) => children,
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
  connect: () => (Component) => Component,
}));

jest.mock('@reduxjs/toolkit', () => ({
  configureStore: jest.fn(),
  createSlice: jest.fn(),
  createAsyncThunk: jest.fn(),
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

// Mock UI libraries
jest.mock('react-native-paper', () => ({
  Provider: ({ children }) => children,
  Text: 'Text',
  Button: 'Button',
  Card: 'Card',
  IconButton: 'IconButton',
  Switch: 'Switch',
  useTheme: () => ({
    colors: { primary: '#000', background: '#fff' },
  }),
}));

// Mock camera and permissions
jest.mock('react-native-camera-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const Camera = React.forwardRef((props, ref) => {
    return React.createElement(View, {
      ...props,
      testID: 'camera-component',
      style: [{ minWidth: 100, minHeight: 100 }, props.style]
    });
  });
  
  return {
    default: Camera,
  };
});

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: {
    IOS: { CAMERA: 'ios.permission.CAMERA' },
    ANDROID: { CAMERA: 'android.permission.CAMERA' },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
}));

// Mock networking
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

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock forms
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn(),
    formState: { errors: {} },
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
  }),
  Controller: ({ render }) => render({ field: { onChange: jest.fn(), value: '' } }),
}));

// Mock environment variables
jest.mock('react-native-dotenv', () => ({
  API_BASE_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3001',
}));

// Mock app-specific components
jest.mock('@react-native/new-app-screen', () => ({
  NewAppScreen: 'NewAppScreen',
}));

jest.mock('./src/components/common/TestQRCodeDisplay', () => 'TestQRCodeDisplay');

// Global console mock
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
