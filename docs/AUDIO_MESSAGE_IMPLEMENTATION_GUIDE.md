# 🎙️ Audio/Voice Message Implementation Guide

## Overview

This guide explains how to implement audio/voice message functionality in the chat system. The backend already supports audio messages through the existing message types, but the frontend needs proper integration.

## Backend Support

The backend **already supports** audio messages with:
- `message_type: "audio"` in the ChatMessage model
- File upload through the upload service
- Real-time WebSocket broadcasting
- Push notifications for offline users

### Message Type Support

```typescript
interface IChatMessage {
  message_type: "text" | "video" | "image" | "file" | "audio"; // ✅ Audio supported
  file_url?: string; // URL to the uploaded audio file
  // ... other fields
}
```

## Implementation Steps

### 1. Frontend: Record Audio Message

#### React Native Implementation

```typescript
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioRecorder {
  private recording: Audio.Recording | null = null;
  
  async startRecording(): Promise<void> {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        throw new Error('Audio permission not granted');
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }
  
  async stopRecording(): Promise<string> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.recording = null;
      
      if (!uri) {
        throw new Error('Recording URI is null');
      }
      
      console.log('Recording stopped and stored at', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }
  
  async getDuration(): Promise<number> {
    if (!this.recording) return 0;
    
    const status = await this.recording.getStatusAsync();
    return status.durationMillis || 0;
  }
}
```

### 2. Frontend: Upload Audio File

```typescript
async function uploadAudioMessage(
  audioUri: string,
  roomId: string
): Promise<string> {
  try {
    // Create form data
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    
    // Append file to form data
    formData.append('file', {
      uri: audioUri,
      name: `audio_${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);
    
    formData.append('file_type', 'audio');
    formData.append('related_to', 'chat');
    formData.append('related_id', roomId);
    
    // Upload to server
    const token = await AsyncStorage.getItem('access_token');
    
    const response = await fetch('https://devapi.letscatchup-kcs.com/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    // Return the file URL
    return result.data.file_url;
  } catch (error) {
    console.error('Failed to upload audio:', error);
    throw error;
  }
}
```

### 3. Frontend: Send Audio Message

```typescript
import { chatApi } from '@/services/api/chatApi';

async function sendAudioMessage(
  roomId: string,
  audioUri: string,
  duration: number
): Promise<void> {
  try {
    // 1. Upload the audio file
    const fileUrl = await uploadAudioMessage(audioUri, roomId);
    
    // 2. Send message with audio type
    await chatApi.sendMessage(roomId, {
      content: `Voice message (${Math.round(duration / 1000)}s)`, // Duration in seconds
      message_type: 'audio',
      file_url: fileUrl,
    });
    
    console.log('Audio message sent successfully');
  } catch (error) {
    console.error('Failed to send audio message:', error);
    throw error;
  }
}
```

### 4. Frontend: Display Audio Message

```tsx
import { Audio } from 'expo-av';
import { useState } from 'react';

interface AudioMessageProps {
  fileUrl: string;
  duration: number;
  senderId: string;
  timestamp: string;
}

function AudioMessage({ fileUrl, duration, senderId, timestamp }: AudioMessageProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  const playAudio = async () => {
    try {
      if (sound) {
        // Resume existing sound
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Create and play new sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fileUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  const pauseAudio = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={isPlaying ? pauseAudio : playAudio}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.waveformContainer}>
        {/* Waveform visualization */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              { width: `${(playbackPosition / (duration * 1000)) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.duration}>
          {formatDuration(playbackPosition)} / {formatDuration(duration * 1000)}
        </Text>
      </View>
    </View>
  );
}

function formatDuration(millis: number): string {
  const seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 4,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
```

### 5. Frontend: Recording UI Component

```tsx
import { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Audio } from 'expo-av';

function VoiceRecorder({ onSend }: { onSend: (uri: string, duration: number) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorder = useRef(new AudioRecorder()).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Update duration
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      await recorder.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };
  
  const stopRecording = async () => {
    try {
      const uri = await recorder.stopRecording();
      setIsRecording(false);
      
      // Send the recorded audio
      onSend(uri, recordingDuration);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to stop recording.');
    }
  };
  
  const cancelRecording = async () => {
    try {
      await recorder.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };
  
  if (!isRecording) {
    return (
      <TouchableOpacity
        style={styles.recordButton}
        onPress={startRecording}
      >
        <Icon name="microphone" size={24} color="#007AFF" />
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.recordingContainer}>
      <Animated.View
        style={[
          styles.recordingIndicator,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={styles.recordingDot} />
      </Animated.View>
      
      <Text style={styles.recordingTime}>
        {formatDuration(recordingDuration)}
      </Text>
      
      <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
        <Icon name="close" size={20} color="#FF3B30" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={stopRecording} style={styles.sendButton}>
        <Icon name="send" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}
```

## Backend: Verify Audio Support

The backend already supports audio messages. Here's what's already implemented:

### 1. Message Type Validation

```typescript
// In chat.service.ts - sendMessage method
message_type: messageData.message_type || "text", // Accepts "audio"
file_url: messageData.file_url, // Stores audio file URL
```

### 2. WebSocket Broadcasting

```typescript
// Audio messages are broadcasted like any other message
SocketService.broadcastChatMessage(room_id, {
  id: message.id,
  room_id: message.room_id,
  sender_id: message.sender_id,
  content: message.content,
  message_type: message.message_type, // "audio"
  file_url: message.file_url, // Audio file URL
  // ... other fields
}, sender_id);
```

### 3. Push Notifications

```typescript
// In sendChatPushNotification
notificationBody = message.message_type === "text" 
  ? message.content 
  : `Sent a ${message.message_type}`; // "Sent a audio"
```

## Testing Checklist

- [ ] Request microphone permissions
- [ ] Record audio successfully
- [ ] Stop recording and get audio file URI
- [ ] Upload audio file to server
- [ ] Send message with type "audio" and file_url
- [ ] Receive audio message via WebSocket
- [ ] Display audio message in chat
- [ ] Play/pause audio playback
- [ ] Show playback progress
- [ ] Handle audio in push notifications
- [ ] Test with multiple audio messages
- [ ] Test audio message deletion
- [ ] Test audio message in different chat types (personal, group)

## Required Packages

### React Native

```json
{
  "expo-av": "^13.x.x",
  "expo-file-system": "^15.x.x"
}
```

Install with:
```bash
npx expo install expo-av expo-file-system
```

## Permissions

### iOS (ios/Info.plist)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to record voice messages.</string>
```

### Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Additional Features to Consider

1. **Waveform Visualization**: Display audio waveform while recording and playing
2. **Voice Activity Detection**: Auto-stop recording when no voice detected
3. **Audio Compression**: Compress audio files before upload to save bandwidth
4. **Audio Formats**: Support multiple formats (m4a, mp3, wav)
5. **Maximum Duration**: Limit recording to 2-5 minutes
6. **Minimum Duration**: Prevent sending very short recordings (<1 second)
7. **Background Recording**: Allow recording while app is in background (if needed)
8. **Audio Quality Settings**: Let users choose quality (low/medium/high)

## Troubleshooting

### Common Issues

1. **"Recording failed" error**
   - Check microphone permissions
   - Verify audio mode configuration
   - Test on a real device (not simulator)

2. **Upload fails**
   - Check file size limits
   - Verify upload service endpoint
   - Check network connectivity

3. **Playback issues**
   - Verify file URL is accessible
   - Check audio format support
   - Test audio file integrity

4. **Permission denied**
   - Request permissions before recording
   - Handle permission denial gracefully
   - Guide user to app settings

## Summary

The backend **already fully supports** audio messages. You only need to:

1. **Frontend**: Implement audio recording UI
2. **Frontend**: Upload audio files using existing upload endpoint
3. **Frontend**: Send messages with `message_type: "audio"`
4. **Frontend**: Display and play audio messages
5. **Frontend**: Handle audio in different states (sending, playing, error)

The backend will automatically:
- ✅ Store audio messages
- ✅ Broadcast via WebSocket
- ✅ Send push notifications
- ✅ Track delivery/read status
- ✅ Support all chat features (edit, delete, reactions, etc.)
