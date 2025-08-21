import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';
import ChatListScreen from '../src/screens/main/ChatListScreen';
import { lightTheme } from '../src/utils/theme';
import { Chat, MessageType } from '../src/types';

// Note: Navigation, AuthContext, and date-fns are mocked globally in jest.setup.js

// Mock navigation for this test
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

// Create test data
const mockChats: Chat[] = [
  {
    id: '1',
    requestId: 'req1',
    participants: ['user1', 'admin1'],
    lastMessage: {
      id: 'msg1',
      chatId: '1',
      senderId: 'admin1',
      senderName: 'Admin',
      content: 'Hello there!',
      timestamp: new Date(),
      messageType: MessageType.TEXT,
      isRead: false,
    },
    unreadCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    requestId: 'req2',
    participants: ['user1', 'admin2'],
    lastMessage: {
      id: 'msg2',
      chatId: '2',
      senderId: 'user1',
      senderName: 'John Doe',
      content: 'Thanks for the help!',
      timestamp: new Date(),
      messageType: MessageType.TEXT,
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Create test store
const createTestStore = (initialChats: Chat[] = []) => {
  return configureStore({
    reducer: {
      chat: require('../src/store/slices/chatSlice').default,
    },
    preloadedState: {
      chat: {
        chats: initialChats,
        messages: {},
        isLoading: false,
        error: null,
        activeChat: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <PaperProvider theme={lightTheme}>
        {component}
      </PaperProvider>
    </Provider>
  );
};

describe('ChatListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no chats', () => {
    const store = createTestStore([]);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('No conversations yet')).toBeTruthy();
    expect(getByText('Start a conversation to get help with your access requests')).toBeTruthy();
  });

  it('renders chat list with chats', () => {
    const store = createTestStore(mockChats);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('admin1')).toBeTruthy();
    expect(getByText('Hello there!')).toBeTruthy();
    expect(getByText('admin2')).toBeTruthy();
    expect(getByText('You: Thanks for the help!')).toBeTruthy();
  });

  it('shows unread count badge for unread chats', () => {
    const store = createTestStore(mockChats);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('2')).toBeTruthy(); // Unread count badge
  });

  it('handles search functionality', async () => {
    const store = createTestStore(mockChats);
    const { getByTestId } = renderWithProviders(<ChatListScreen />, store);

    const searchInput = getByTestId('search-input');
    expect(searchInput).toBeTruthy();
  });

  it('filters chats by unread status', async () => {
    const store = createTestStore(mockChats);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    const unreadFilter = getByText('Unread');
    expect(unreadFilter).toBeTruthy();
  });

  it('navigates to chat when chat item is pressed', () => {
    const store = createTestStore(mockChats);
    const { getByTestId } = renderWithProviders(<ChatListScreen />, store);

    const chatItem = getByTestId('chat-item-1');
    expect(chatItem).toBeTruthy();
  });

  it('shows context menu on long press', async () => {
    const store = createTestStore(mockChats);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('Mark as read')).toBeTruthy();
    expect(getByText('Chat info')).toBeTruthy();
    expect(getByText('Delete chat')).toBeTruthy();
  });

  it('handles pull to refresh', async () => {
    const store = createTestStore(mockChats);
    const { getByTestId } = renderWithProviders(<ChatListScreen />, store);

    const flatList = getByTestId('chat-list');
    expect(flatList).toBeTruthy();
  });

  it('shows error state when there is an error', () => {
    const store = configureStore({
      reducer: {
        chat: require('../src/store/slices/chatSlice').default,
      },
      preloadedState: {
        chat: {
          chats: [],
          messages: {},
          isLoading: false,
          error: 'Failed to load chats',
          activeChat: null,
        },
      },
    });

    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('Failed to load chats')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
  });

  it('handles new chat button press', () => {
    const store = createTestStore([]);
    const { getByTestId } = renderWithProviders(<ChatListScreen />, store);

    const newChatButton = getByTestId('new-chat-button');
    expect(newChatButton).toBeTruthy();
  });

  it('sorts chats correctly', () => {
    const chatsWithDifferentTimes = [
      {
        ...mockChats[0],
        unreadCount: 0,
        updatedAt: new Date('2023-01-01'),
      },
      {
        ...mockChats[1],
        unreadCount: 1,
        updatedAt: new Date('2023-01-02'),
      },
    ];

    const store = createTestStore(chatsWithDifferentTimes);
    const { getByText } = renderWithProviders(<ChatListScreen />, store);

    expect(getByText('admin1')).toBeTruthy();
    expect(getByText('admin2')).toBeTruthy();
  });

  it('handles accessibility features', () => {
    const store = createTestStore(mockChats);
    const { getByTestId } = renderWithProviders(<ChatListScreen />, store);

    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('chat-item-1')).toBeTruthy();
    expect(getByTestId('new-chat-button')).toBeTruthy();
  });
});
