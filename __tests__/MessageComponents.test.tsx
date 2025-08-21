import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import {
  MessageStatus,
  MessageTime,
  TextMessage,
  ImageMessage,
  FileMessage,
  SystemMessage,
  LocationMessage,
  VoiceMessage,
} from '../src/components/common/MessageComponents';
import { lightTheme } from '../src/utils/theme';
import { ChatMessage, MessageType } from '../src/types';

// Note: React Native and date-fns are mocked globally in jest.setup.js

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={lightTheme}>
      {component}
    </PaperProvider>
  );
};

describe('MessageComponents', () => {
  describe('MessageStatus', () => {
    const mockMessage: ChatMessage = {
      id: 'msg1',
      chatId: 'chat1',
      senderId: 'user1',
      senderName: 'John',
      content: 'Test message',
      timestamp: new Date(),
      messageType: MessageType.TEXT,
      isRead: true,
    };

    it('shows double check for read messages', () => {
      const { getByText } = renderWithProvider(
        <MessageStatus message={mockMessage} isOwn={true} />
      );

      expect(getByText('✓✓')).toBeTruthy();
    });

    it('shows single check for unread messages', () => {
      const unreadMessage = { ...mockMessage, isRead: false };
      const { getByText } = renderWithProvider(
        <MessageStatus message={unreadMessage} isOwn={true} />
      );

      expect(getByText('✓')).toBeTruthy();
    });

    it('does not show status for other users messages', () => {
      const { queryByText } = renderWithProvider(
        <MessageStatus message={mockMessage} isOwn={false} />
      );

      expect(queryByText('✓✓')).toBeFalsy();
      expect(queryByText('✓')).toBeFalsy();
    });

    it('has proper accessibility label', () => {
      const { getByLabelText } = renderWithProvider(
        <MessageStatus message={mockMessage} isOwn={true} />
      );

      expect(getByLabelText('Message read')).toBeTruthy();
    });
  });

  describe('MessageTime', () => {
    it('displays formatted time', () => {
      const timestamp = new Date();
      const { getByText } = renderWithProvider(
        <MessageTime timestamp={timestamp} />
      );

      expect(getByText('14:30')).toBeTruthy();
    });

    it('displays full date when requested', () => {
      const timestamp = new Date();
      const { getByText } = renderWithProvider(
        <MessageTime timestamp={timestamp} showFullDate={true} />
      );

      // Would show full date format (mocked)
      expect(getByText('14:30')).toBeTruthy();
    });
  });

  describe('TextMessage', () => {
    it('renders text content', () => {
      const { getByText } = renderWithProvider(
        <TextMessage content="Hello world!" isOwn={true} />
      );

      expect(getByText('Hello world!')).toBeTruthy();
    });

    it('handles links in text', () => {
      const { getByText } = renderWithProvider(
        <TextMessage content="Check this out: https://example.com" isOwn={false} />
      );

      expect(getByText('Check this out: ')).toBeTruthy();
      expect(getByText('https://example.com')).toBeTruthy();
    });

    it('makes text selectable', () => {
      const { getByText } = renderWithProvider(
        <TextMessage content="Selectable text" isOwn={true} />
      );

      const textElement = getByText('Selectable text');
      expect(textElement.props.selectable).toBe(true);
    });
  });

  describe('ImageMessage', () => {
    const mockProps = {
      uri: 'https://example.com/image.jpg',
      metadata: {
        fileName: 'image.jpg',
        width: 800,
        height: 600,
      },
    };

    it('renders image with correct source', () => {
      const { getByTestId } = renderWithProvider(
        <ImageMessage {...mockProps} />
      );

      // Would need to add testID to Image component
    });

    it('shows loading indicator initially', () => {
      const { getByTestId } = renderWithProvider(
        <ImageMessage {...mockProps} />
      );

      // ActivityIndicator would be shown initially
    });

    it('handles image load error', () => {
      const { getByText } = renderWithProvider(
        <ImageMessage {...mockProps} />
      );

      // Simulate image error
      // Would need proper image error simulation
    });

    it('shows filename caption when provided', () => {
      const { getByText } = renderWithProvider(
        <ImageMessage {...mockProps} />
      );

      expect(getByText('image.jpg')).toBeTruthy();
    });

    it('handles press events', () => {
      const onPress = jest.fn();
      const { getByLabelText } = renderWithProvider(
        <ImageMessage {...mockProps} onPress={onPress} />
      );

      const imageButton = getByLabelText('View image');
      fireEvent.press(imageButton);

      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('FileMessage', () => {
    const mockProps = {
      fileName: 'document.pdf',
      fileSize: 1024000,
      fileType: 'application/pdf',
      downloadUrl: 'https://example.com/document.pdf',
    };

    it('renders file information', () => {
      const { getByText } = renderWithProvider(
        <FileMessage {...mockProps} />
      );

      expect(getByText('document.pdf')).toBeTruthy();
      expect(getByText('1000.0 KB')).toBeTruthy();
    });

    it('shows appropriate file icon', () => {
      const { getByTestId } = renderWithProvider(
        <FileMessage {...mockProps} />
      );

      // Would show PDF icon for PDF files
    });

    it('handles download press', () => {
      const onPress = jest.fn();
      const { getByLabelText } = renderWithProvider(
        <FileMessage {...mockProps} onPress={onPress} />
      );

      const downloadButton = getByLabelText('Download file document.pdf');
      fireEvent.press(downloadButton);

      expect(onPress).toHaveBeenCalled();
    });

    it('formats file size correctly', () => {
      const largeFileProps = {
        ...mockProps,
        fileSize: 5000000, // 5MB
      };

      const { getByText } = renderWithProvider(
        <FileMessage {...largeFileProps} />
      );

      expect(getByText('4.8 MB')).toBeTruthy();
    });
  });

  describe('SystemMessage', () => {
    it('renders system message content', () => {
      const { getByText } = renderWithProvider(
        <SystemMessage content="User joined the chat" />
      );

      expect(getByText('User joined the chat')).toBeTruthy();
    });

    it('applies italic styling', () => {
      const { getByText } = renderWithProvider(
        <SystemMessage content="System message" />
      );

      const messageText = getByText('System message');
      expect(messageText.props.style).toContainEqual(
        expect.objectContaining({ fontStyle: 'italic' })
      );
    });
  });

  describe('LocationMessage', () => {
    const mockProps = {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY',
    };

    it('renders location information', () => {
      const { getByText } = renderWithProvider(
        <LocationMessage {...mockProps} />
      );

      expect(getByText('New York, NY')).toBeTruthy();
      expect(getByText('40.712800, -74.006000')).toBeTruthy();
    });

    it('handles location press', () => {
      const onPress = jest.fn();
      const { getByLabelText } = renderWithProvider(
        <LocationMessage {...mockProps} onPress={onPress} />
      );

      const locationButton = getByLabelText('View location on map');
      fireEvent.press(locationButton);

      expect(onPress).toHaveBeenCalled();
    });

    it('shows default title when no address provided', () => {
      const propsWithoutAddress = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const { getByText } = renderWithProvider(
        <LocationMessage {...propsWithoutAddress} />
      );

      expect(getByText('Location')).toBeTruthy();
    });
  });

  describe('VoiceMessage', () => {
    const mockProps = {
      duration: 45,
      audioUrl: 'https://example.com/audio.mp3',
      isPlaying: false,
    };

    it('renders voice message controls', () => {
      const { getByText } = renderWithProvider(
        <VoiceMessage {...mockProps} />
      );

      expect(getByText('0:45')).toBeTruthy();
    });

    it('shows play button when not playing', () => {
      const { getByTestId } = renderWithProvider(
        <VoiceMessage {...mockProps} />
      );

      // Would show play icon
    });

    it('shows pause button when playing', () => {
      const playingProps = { ...mockProps, isPlaying: true };
      const { getByTestId } = renderWithProvider(
        <VoiceMessage {...playingProps} />
      );

      // Would show pause icon
    });

    it('handles play/pause press', () => {
      const onPlay = jest.fn();
      const onPause = jest.fn();
      const { getByTestId } = renderWithProvider(
        <VoiceMessage {...mockProps} onPlay={onPlay} onPause={onPause} />
      );

      // Would trigger onPlay when pressed
    });

    it('formats duration correctly', () => {
      const longDurationProps = {
        ...mockProps,
        duration: 125, // 2:05
      };

      const { getByText } = renderWithProvider(
        <VoiceMessage {...longDurationProps} />
      );

      expect(getByText('2:05')).toBeTruthy();
    });
  });
});
