import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Avatar,
  IconButton,
  Surface,
  useTheme,
  ActivityIndicator,
  Button,
  Card,
} from 'react-native-paper';
import { themeConstants } from '../../utils/theme';
import { ChatMessage, MessageType } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';

const { width } = Dimensions.get('window');

interface MessageStatusProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ message, isOwn }) => {
  const theme = useTheme();

  if (!isOwn) return null;

  const getStatusIcon = () => {
    if (message.isRead) {
      return '✓✓'; // Double check for read
    } else {
      return '✓'; // Single check for sent/delivered
    }
  };

  const getStatusColor = () => {
    if (message.isRead) {
      return themeConstants.colors.primary['500'];
    } else {
      return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <Text
      style={[
        styles.statusIcon,
        { color: getStatusColor() }
      ]}
      accessible={true}
      accessibilityLabel={`Message ${message.isRead ? 'read' : 'sent'}`}
    >
      {getStatusIcon()}
    </Text>
  );
};

interface MessageTimeProps {
  timestamp: Date;
  showFullDate?: boolean;
}

export const MessageTime: React.FC<MessageTimeProps> = ({ timestamp, showFullDate = false }) => {
  const theme = useTheme();

  const formatTime = useCallback(() => {
    const date = new Date(timestamp);
    
    if (showFullDate) {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  }, [timestamp, showFullDate]);

  return (
    <Text
      variant="bodySmall"
      style={[styles.messageTime, { color: theme.colors.onSurfaceVariant }]}
    >
      {formatTime()}
    </Text>
  );
};

interface TextMessageProps {
  content: string;
  isOwn: boolean;
}

export const TextMessage: React.FC<TextMessageProps> = ({ content, isOwn }) => {
  const theme = useTheme();

  const handleLinkPress = useCallback((url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    });
  }, []);

  // Simple URL detection (in production, use a proper library like react-native-autolink)
  const renderTextWithLinks = useCallback((text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text
            key={index}
            style={[
              styles.linkText,
              { color: isOwn ? theme.colors.onPrimary : theme.colors.primary }
            ]}
            onPress={() => handleLinkPress(part)}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  }, [handleLinkPress, isOwn, theme.colors]);

  return (
    <Text
      variant="bodyMedium"
      style={[
        styles.messageText,
        { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface }
      ]}
      selectable={true}
    >
      {renderTextWithLinks(content)}
    </Text>
  );
};

interface ImageMessageProps {
  uri: string;
  metadata?: {
    width?: number;
    height?: number;
    fileName?: string;
  };
  onPress?: () => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ uri, metadata, onPress }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      // Default action: open image viewer
      Alert.alert('Image Viewer', 'Image viewer will be available soon.');
    }
  }, [onPress]);

  if (error) {
    return (
      <View style={styles.errorMessage}>
        <IconButton icon="image-broken" size={24} />
        <Text variant="bodySmall">Failed to load image</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessible={true}
      accessibilityLabel="View image"
      accessibilityRole="button"
    >
      <View style={styles.imageContainer}>
        {loading && (
          <View style={styles.imageLoading}>
            <ActivityIndicator size="small" />
          </View>
        )}
        <Image
          source={{ uri }}
          style={[
            styles.messageImage,
            loading ? styles.hiddenImage : null
          ]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {metadata?.fileName && (
          <Text
            variant="bodySmall"
            style={styles.imageCaption}
            numberOfLines={1}
          >
            {metadata.fileName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface FileMessageProps {
  fileName: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
  onPress?: () => void;
}

export const FileMessage: React.FC<FileMessageProps> = ({
  fileName,
  fileSize,
  fileType,
  downloadUrl,
  onPress,
}) => {
  const theme = useTheme();

  const getFileIcon = useCallback(() => {
    if (!fileType) return 'file-document';
    
    const lowerType = fileType.toLowerCase();
    if (lowerType.includes('pdf')) return 'file-pdf-box';
    if (lowerType.includes('word') || lowerType.includes('doc')) return 'file-word-box';
    if (lowerType.includes('excel') || lowerType.includes('sheet')) return 'file-excel-box';
    if (lowerType.includes('powerpoint') || lowerType.includes('presentation')) return 'file-powerpoint-box';
    if (lowerType.includes('zip') || lowerType.includes('rar')) return 'file-archive';
    if (lowerType.includes('audio') || lowerType.includes('mp3')) return 'file-music';
    if (lowerType.includes('video') || lowerType.includes('mp4')) return 'file-video';
    
    return 'file-document';
  }, [fileType]);

  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else if (downloadUrl) {
      Linking.openURL(downloadUrl);
    } else {
      Alert.alert('File Download', 'File download will be available soon.');
    }
  }, [onPress, downloadUrl]);

  return (
    <TouchableOpacity
      style={[styles.fileMessage, { borderColor: theme.colors.outline }]}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={`Download file ${fileName}`}
      accessibilityRole="button"
    >
      <View style={styles.fileIcon}>
        <IconButton
          icon={getFileIcon()}
          size={24}
          iconColor={theme.colors.primary}
        />
      </View>
      <View style={styles.fileInfo}>
        <Text
          variant="bodyMedium"
          style={[styles.fileName, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {fileName}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.fileSize, { color: theme.colors.onSurfaceVariant }]}
        >
          {formatFileSize(fileSize)}
        </Text>
      </View>
      <IconButton
        icon="download"
        size={20}
        iconColor={theme.colors.primary}
      />
    </TouchableOpacity>
  );
};

interface SystemMessageProps {
  content: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  const theme = useTheme();

  return (
    <View style={styles.systemMessageContainer}>
      <Surface style={[styles.systemMessageBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text
          variant="bodySmall"
          style={[styles.systemMessageText, { color: theme.colors.onSurfaceVariant }]}
        >
          {content}
        </Text>
      </Surface>
    </View>
  );
};

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address?: string;
  onPress?: () => void;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({
  latitude,
  longitude,
  address,
  onPress,
}) => {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      // Open in maps app
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  }, [onPress, latitude, longitude]);

  return (
    <TouchableOpacity
      style={[styles.locationMessage, { borderColor: theme.colors.outline }]}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel="View location on map"
      accessibilityRole="button"
    >
      <View style={styles.locationIcon}>
        <IconButton
          icon="map-marker"
          size={24}
          iconColor={theme.colors.primary}
        />
      </View>
      <View style={styles.locationInfo}>
        <Text
          variant="bodyMedium"
          style={[styles.locationTitle, { color: theme.colors.onSurface }]}
        >
          {address || 'Location'}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.locationCoords, { color: theme.colors.onSurfaceVariant }]}
        >
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      </View>
      <IconButton
        icon="open-in-new"
        size={20}
        iconColor={theme.colors.primary}
      />
    </TouchableOpacity>
  );
};

interface VoiceMessageProps {
  duration: number;
  audioUrl: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  duration,
  audioUrl,
  isPlaying = false,
  onPlay,
  onPause,
}) => {
  const theme = useTheme();

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePress = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  return (
    <View style={[styles.voiceMessage, { backgroundColor: theme.colors.surfaceVariant }]}>
      <IconButton
        icon={isPlaying ? 'pause' : 'play'}
        size={24}
        iconColor={theme.colors.primary}
        onPress={handlePress}
      />
      <View style={styles.voiceWaveform}>
        {/* Placeholder for waveform visualization */}
        <View style={[styles.waveformBars, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.waveformBars, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.waveformBars, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.waveformBars, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.waveformBars, { backgroundColor: theme.colors.primary }]} />
      </View>
      <Text
        variant="bodySmall"
        style={[styles.voiceDuration, { color: theme.colors.onSurfaceVariant }]}
      >
        {formatDuration(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusIcon: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  messageTime: {
    fontSize: themeConstants.typography.fontSize.xs,
  },
  messageText: {
    fontSize: themeConstants.typography.fontSize.md,
    lineHeight: themeConstants.typography.lineHeight.normal,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  imageContainer: {
    borderRadius: themeConstants.borderRadius.md,
    overflow: 'hidden',
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.45,
    borderRadius: themeConstants.borderRadius.md,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageCaption: {
    padding: themeConstants.spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeConstants.spacing.md,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeConstants.spacing.sm,
    borderWidth: 1,
    borderRadius: themeConstants.borderRadius.md,
    minWidth: 200,
    maxWidth: width * 0.7,
  },
  fileIcon: {
    marginRight: themeConstants.spacing.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: '500' as const,
  },
  fileSize: {
    marginTop: 2,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: themeConstants.spacing.md,
  },
  systemMessageBubble: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.sm,
    borderRadius: themeConstants.borderRadius.full,
    maxWidth: width * 0.8,
  },
  systemMessageText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  locationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeConstants.spacing.sm,
    borderWidth: 1,
    borderRadius: themeConstants.borderRadius.md,
    minWidth: 200,
    maxWidth: width * 0.7,
  },
  locationIcon: {
    marginRight: themeConstants.spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontWeight: '500' as const,
  },
  locationCoords: {
    marginTop: 2,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeConstants.spacing.sm,
    borderRadius: themeConstants.borderRadius.md,
    minWidth: 200,
    maxWidth: width * 0.7,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: themeConstants.spacing.sm,
    gap: 2,
  },
  waveformBars: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
  },
  voiceDuration: {
    marginLeft: themeConstants.spacing.sm,
  },
});
