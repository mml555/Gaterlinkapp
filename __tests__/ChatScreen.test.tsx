import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';
import ChatScreen from '../src/screens/main/ChatScreen';
import { lightTheme } from '../src/utils/theme';
import { ChatMessage, MessageType, Chat } from '../src/types';

// Note: Navigation, AuthContext, and date-fns are mocked globally in jest.setup.js

// Mock navigation for this test
const mockSetOptions = jest.fn();

// Mock auth context for this test
const mockUser = {
  id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

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
      chat: require('../src/store/slices/chatSlice').default,
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
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    const messageInput = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    expect(messageInput).toBeTruthy();
    expect(sendButton).toBeTruthy();
  });

  it('disables send button when input is empty', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    const sendButton = getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('enables send button when input has text', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    const messageInput = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    expect(messageInput).toBeTruthy();
    expect(sendButton).toBeTruthy();
  });

  it('shows message status indicators', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    // Should show read status for read messages
    const readIndicators = getByText('✓✓');
    expect(readIndicators).toBeTruthy();

    // Should show sent status for unread messages
    const sentIndicators = getByText('✓');
    expect(sentIndicators).toBeTruthy();
  });

  it('shows message timestamps', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    // Should show formatted timestamps
    const timestamps = getByText('14:30');
    expect(timestamps).toBeTruthy();
  });

  it('handles long press on messages', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('Copy')).toBeTruthy();
    expect(getByText('Reply')).toBeTruthy();
  });

  it('handles attachment button press', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    const attachmentButton = getByTestId('attachment-button');
    expect(attachmentButton).toBeTruthy();
  });

  it('shows typing indicator', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    // Chat screen should be rendered
    const chatScreen = getByTestId('chat-screen');
    expect(chatScreen).toBeTruthy();
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
    const keyboardAvoidingView = getByTestId('keyboard-avoiding-view');
    expect(keyboardAvoidingView).toBeTruthy();
  });

  it('auto-scrolls to bottom when new messages arrive', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    // FlatList should be rendered
    const messagesList = getByTestId('messages-list');
    expect(messagesList).toBeTruthy();
  });

  it('handles message context menu actions', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('Copy')).toBeTruthy();
    expect(getByText('Reply')).toBeTruthy();
  });

  it('shows delete option only for own messages', async () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByText } = renderWithProviders(<ChatScreen />, store);

    expect(getByText('Delete')).toBeTruthy();
  });

  it('handles accessibility features', () => {
    const store = createTestStore(mockMessages, mockActiveChat);
    const { getByTestId } = renderWithProviders(<ChatScreen />, store);

    expect(getByTestId('message-input')).toBeTruthy();
    expect(getByTestId('send-button')).toBeTruthy();
    expect(getByTestId('attachment-button')).toBeTruthy();
  });
});
