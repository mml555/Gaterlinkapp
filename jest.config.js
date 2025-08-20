module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-camera-kit|react-native-vision-camera|react-native-permissions|react-native-vector-icons|react-native-paper|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-flash-message|react-native-modal|react-native-skeleton-placeholder|react-native-keychain|react-native-biometrics|react-native-push-notification|@react-native-async-storage|@react-native-community|@react-navigation|@reduxjs|redux-persist|socket.io-client|axios|react-hook-form|react-native-dotenv|react-redux)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['TestApp/__tests__/'],
};
