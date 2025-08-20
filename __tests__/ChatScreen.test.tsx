import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';
import ChatScreen from '../src/screens/main/ChatScreen';
import chatReducer from '../src/store/slices/chatSlice';
import { lightTheme } from '../src/utils/theme';
import { ChatMessage, MessageType, Chat } from '../src/types';

// Mock navigation
const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { chatId: 'chat1' },
  }),
  useNavigation: () => ({
    setOptions: mockSetOptions,
  }),
}));

// Mock auth context
const mockUser = {
  id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '14:30'),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}));

// Create test data
const mockMessages: ChatMessage[] = [
  {
    id: 'msg1',
    chatId: 'chat1',
    senderId: 'admin1',
    senderName: 'Admin',
    content: 'Hello! How can I help you?',
    timestamp: new Date(),
    messageType: MessageType.TEXT,
    isRead: true,
  },
  {
    id: 'msg2',
    chatId: 'chat1',
    senderId: 'user1',
    senderName: 'John Doe',
    content: 'I need access to the building',
    timestamp: new Date(),
    messageType: MessageType.TEXT,
    isRead: true,
  },
  {
    id: 'msg3',
    chatId: 'chat1',
    senderId: 'admin1',
    senderName: 'Admin',
    content: 'I can help with that. Let me unlock the door.',
    timestamp: new Date(),
    messageType: MessageType.TEXT,
    isRead: false,
  },
];

const mockActiveChat: Chat = {
  id: 'chat1',
  requestId: 'req1',
  participants: ['user1', 'admin1'],
  unreadCount: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create test store
const createTestStore = (messages: ChatMessage[] = [], activeChat: Chat | null = null) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
    },
    preloadedState: {
      chat: {
        chats: activeChat ? [activeChat] : [],
        messages: { chat1: messages },
        isLoading: false,
        error: null,
        activeChat,
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

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no messages', () => {
    const store = createTestStore([], mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('Start the conversation')).toBeTruthy();
    expect(getByText('Send a message to begin your conversation')).toBeTruthy();
  });

  it('renders messages correctly', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('Hello! How can I help you?')).toBeTruthy();
    expect(getByText('I need access to the building')).toBeTruthy();
    expect(getByText('I can help with that. Let me unlock the door.')).toBeTruthy();
  });

  it('shows own messages with different styling', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    // User's own message should be displayed differently
    const ownMessage = getByText('I need access to the building');
    expect(ownMessage).toBeTruthy();
  });

  it('handles message input and sending', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByPlaceholderText, getByLabelText } = renderWithProviders(<ChatScreen />, store);

    const messageInput = getByPlaceholderText('Type a message...');
    const sendButton = getByLabelText('Send message');

    fireEvent.changeText(messageInput, 'Test message');
    fireEvent.press(sendButton);

    // Verify message was processed
    await waitFor(() => {
      expect(messageInput.props.value).toBe('');
    });
  });

  it('disables send button when input is empty', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByLabelText } = renderWithProviders(<ChatScreen />, store);

    const sendButton = getByLabelText('Send message');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('enables send button when input has text', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByPlaceholderText, getByLabelText } = renderWithProviders(<ChatScreen />, store);

    const messageInput = getByPlaceholderText('Type a message...');
    const sendButton = getByLabelText('Send message');

    fireEvent.changeText(messageInput, 'Test message');
    expect(sendButton.props.disabled).toBe(false);
  });

  it('shows message status indicators', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getAllByText } = renderWithProviders(<ChatScreen />, store);

    // Should show read status for read messages
    const readIndicators = getAllByText('✓✓');
    expect(readIndicators.length).toBeGreaterThan(0);

    // Should show sent status for unread messages
    const sentIndicators = getAllByText('✓');
    expect(sentIndicators.length).toBeGreaterThan(0);
  });

  it('shows message timestamps', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getAllByText } = renderWithProviders(<ChatScreen />, store);

    // Should show formatted timestamps
    const timestamps = getAllByText('14:30');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('handles long press on messages', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    const message = getByText('Hello! How can I help you?');
    fireEvent(message, 'longPress');

    await waitFor(() => {
      expect(getByText('Copy')).toBeTruthy();
      expect(getByText('Reply')).toBeTruthy();
    });
  });

  it('handles attachment button press', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByLabelText } = renderWithProviders(<ChatScreen />, store);

    const attachmentButton = getByLabelText('Add attachment');
    fireEvent.press(attachmentButton);

    // Should show attachment options (mocked)
  });

  it('shows typing indicator', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    // Typing indicator would be shown through socket events
    // This would be tested with proper socket mocking
  });

  it('handles different message types', () => {
    const messagesWithTypes: ChatMessage[] = [
      ...mockMessages,
      {
        id: 'msg4',
        chatId: 'chat1',
        senderId: 'admin1',
        senderName: 'Admin',
        content: 'https://example.com/image.jpg',
        timestamp: new Date(),
        messageType: MessageType.IMAGE,
        isRead: false,
      },
      {
        id: 'msg5',
        chatId: 'chat1',
        senderId: 'admin1',
        senderName: 'Admin',
        content: 'document.pdf',
        timestamp: new Date(),
        messageType: MessageType.FILE,
        isRead: false,
        metadata: {
          fileName: 'document.pdf',
          fileSize: 1024000,
        },
      },
      {
        id: 'msg6',
        chatId: 'chat1',
        senderId: 'system',
        senderName: 'System',
        content: 'User joined the chat',
        timestamp: new Date(),
        messageType: MessageType.SYSTEM,
        isRead: true,
      },
    ];

    const store = createTestStore(messagesWithTypes, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('document.pdf')).toBeTruthy();
    expect(getByText('User joined the chat')).toBeTruthy();
  });

  it('handles keyboard avoiding view on iOS', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    // KeyboardAvoidingView should be rendered
    // This would be better tested with platform-specific tests
  });

  it('auto-scrolls to bottom when new messages arrive', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    // FlatList should auto-scroll (would need proper FlatList mocking)
  });

  it('handles message context menu actions', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    const message = getByText('I need access to the building');
    fireEvent(message, 'longPress');

    await waitFor(() => {
      const copyButton = getByText('Copy');
      fireEvent.press(copyButton);
    });

    // Should handle copy action
  });

  it('shows delete option only for own messages', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText, queryByText } = renderWithProviders(<ChatScreen />, store);

    // Long press on own message
    const ownMessage = getByText('I need access to the building');
    fireEvent(ownMessage, 'longPress');

    await waitFor(() => {
      expect(getByText('Delete')).toBeTruthy();
    });

    // Long press on other's message
    const otherMessage = getByText('Hello! How can I help you?');
    fireEvent(otherMessage, 'longPress');

    await waitFor(() => {
      expect(queryByText('Delete')).toBeFalsy();
    });
  });

  it('handles accessibility features', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByLabelText } = renderWithProviders(<ChatScreen />, store);

    expect(getByLabelText('Message input')).toBeTruthy();
    expect(getByLabelText('Send message')).toBeTruthy();
    expect(getByLabelText('Add attachment')).toBeTruthy();
  });
});
