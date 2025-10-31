# React Native (Expo) Integration Guide for Audio/Video Calls

## 📱 GetStream.io Video & Audio Calls Integration

**Last Updated:** October 30, 2025  
**Target Platform:** React Native (Expo)  
**SDK Version:** @stream-io/video-react-native-sdk ^1.0.0  
**Backend API Version:** 1.0.0

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Setup](#project-setup)
4. [Authentication](#authentication)
5. [Making Audio Calls](#making-audio-calls)
6. [Making Video Calls](#making-video-calls)
7. [Receiving Calls](#receiving-calls)
8. [Call UI Components](#call-ui-components)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## 🎯 Prerequisites

### Backend Requirements
- Backend API running at: `https://devapi.letscatchup-kcs.com`
- Valid JWT authentication token
- User authenticated with `campus_id` and `user_id`

### GetStream Credentials
Your backend is already configured with:
- ✅ GETSTREAM_API_KEY
- ✅ GETSTREAM_API_SECRET

The backend will provide you with call tokens automatically.

---

## 📦 Installation

### Step 1: Install Required Packages

```bash
# Core GetStream SDK
npx expo install @stream-io/video-react-native-sdk

# Required peer dependencies
npx expo install @stream-io/react-native-webrtc

# Additional dependencies
npx expo install @react-native-community/netinfo
npx expo install react-native-incall-manager
npx expo install react-native-svg

# For better UX
npx expo install expo-av  # For ringtones
npx expo install expo-haptics  # For haptic feedback
```

### Step 2: Configure app.json

```json
{
  "expo": {
    "name": "KCS App",
    "slug": "kcs-app",
    "plugins": [
      [
        "@stream-io/video-react-native-sdk",
        {
          "ios": {
            "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for video calls.",
            "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for calls."
          },
          "android": {
            "cameraPermission": "Allow KCS to access your camera for video calls.",
            "microphonePermission": "Allow KCS to access your microphone for calls."
          }
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "KCS needs access to your camera for video calls.",
        "NSMicrophoneUsageDescription": "KCS needs access to your microphone for calls.",
        "UIBackgroundModes": ["audio", "voip"]
      }
    },
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "BLUETOOTH",
        "BLUETOOTH_CONNECT",
        "INTERNET"
      ]
    }
  }
}
```

### Step 3: Build Development Client

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

> ⚠️ **Note**: GetStream Video SDK requires a custom development client, not Expo Go.

---

## 🔧 Project Setup

### 1. Create API Service

**File:** `services/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://devapi.letscatchup-kcs.com';

// Store your JWT token (from login)
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;
```

### 2. Create Call Service

**File:** `services/callService.ts`

```typescript
import api from './api';

export interface Participant {
  user_id: string;
  name: string;
  role?: 'host' | 'participant';
}

export interface CreateCallResponse {
  success: boolean;
  data: {
    call: {
      id: string;
      call_id: string;
      campus_id: string;
      call_type: 'audio' | 'video';
      caller_id: string;
      participants: string[];
      call_status: string;
      call_settings: {
        audio_enabled: boolean;
        video_enabled: boolean;
        screen_sharing_enabled: boolean;
        recording_enabled: boolean;
      };
    };
    tokens: Array<{
      token: string;
      call_id: string;
      user_id: string;
      expires_at: string;
    }>;
  };
  message?: string;
  error?: string;
}

export interface JoinCallResponse {
  success: boolean;
  data?: {
    token: string;
    call: any;
  };
  error?: string;
}

class CallService {
  /**
   * Create an audio call
   */
  async createAudioCall(
    participants: Participant[],
    recordingEnabled: boolean = false
  ): Promise<CreateCallResponse> {
    const response = await api.post('/api/video-calls/audio', {
      participants,
      recording_enabled: recordingEnabled,
    });
    return response.data;
  }

  /**
   * Create a video call
   */
  async createVideoCall(
    participants: Participant[],
    screenSharingEnabled: boolean = false,
    recordingEnabled: boolean = false
  ): Promise<CreateCallResponse> {
    const response = await api.post('/api/video-calls/video', {
      participants,
      screen_sharing_enabled: screenSharingEnabled,
      recording_enabled: recordingEnabled,
    });
    return response.data;
  }

  /**
   * Join an existing call
   */
  async joinCall(callId: string): Promise<JoinCallResponse> {
    const response = await api.post(`/api/video-calls/${callId}/join`);
    return response.data;
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<{ success: boolean; error?: string }> {
    const response = await api.post(`/api/video-calls/${callId}/end`);
    return response.data;
  }

  /**
   * Get call history
   */
  async getCallHistory(page: number = 1, limit: number = 20) {
    const response = await api.get('/api/video-calls/history', {
      params: { page, limit },
    });
    return response.data;
  }
}

export default new CallService();
```

### 3. Create Stream Video Client Setup

**File:** `services/streamVideoClient.ts`

```typescript
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

let client: StreamVideoClient | null = null;

export const initializeStreamClient = async (
  apiKey: string,
  userId: string,
  token: string,
  userName: string
) => {
  if (client) {
    return client;
  }

  client = new StreamVideoClient({
    apiKey,
    user: {
      id: userId,
      name: userName,
    },
    token,
  });

  return client;
};

export const getStreamClient = () => {
  if (!client) {
    throw new Error('Stream client not initialized. Call initializeStreamClient first.');
  }
  return client;
};

export const disconnectStreamClient = async () => {
  if (client) {
    await client.disconnectUser();
    client = null;
  }
};
```

---

## 🔐 Authentication

### Setup Stream Video Client After Login

**File:** `screens/LoginScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { setAuthToken } from '../services/api';
import { initializeStreamClient } from '../services/streamVideoClient';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // 1. Login to your backend
      const loginResponse = await api.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = loginResponse.data;
      
      // 2. Set auth token for API calls
      setAuthToken(token);

      // 3. Get GetStream API key from backend (or hardcode if provided)
      const GETSTREAM_API_KEY = 'your_getstream_api_key'; // Ask backend team

      // 4. Initialize Stream Video Client
      // Note: Backend will provide tokens per call, this is just for user connection
      await initializeStreamClient(
        GETSTREAM_API_KEY,
        user.id,
        token, // Your JWT token works here
        user.name
      );

      // 5. Navigate to main app
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your login UI */}
      <Button title="Login" onPress={handleLogin} disabled={loading} />
    </View>
  );
};

export default LoginScreen;
```

---

## 📞 Making Audio Calls

### Audio Call Component

**File:** `components/AudioCallButton.tsx`

```typescript
import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import callService from '../services/callService';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AudioCallButtonProps {
  targetUser: {
    id: string;
    name: string;
  };
  currentUser: {
    id: string;
    name: string;
  };
}

const AudioCallButton: React.FC<AudioCallButtonProps> = ({
  targetUser,
  currentUser,
}) => {
  const [calling, setCalling] = useState(false);
  const navigation = useNavigation();

  const initiateAudioCall = async () => {
    try {
      setCalling(true);

      // 1. Create audio call on backend
      const response = await callService.createAudioCall([
        {
          user_id: targetUser.id,
          name: targetUser.name,
          role: 'participant',
        },
      ]);

      if (!response.success) {
        Alert.alert('Call Failed', response.error || 'Unable to create call');
        return;
      }

      // 2. Extract call data
      const { call, tokens } = response.data;
      
      // 3. Get token for current user
      const userToken = tokens.find((t) => t.user_id === currentUser.id);

      if (!userToken) {
        Alert.alert('Error', 'Failed to get call token');
        return;
      }

      // 4. Navigate to audio call screen
      navigation.navigate('AudioCall', {
        callId: call.call_id,
        callType: 'audio',
        token: userToken.token,
        isOutgoing: true,
        targetUser: targetUser,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
      console.error('Audio call error:', error);
    } finally {
      setCalling(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={initiateAudioCall}
      disabled={calling}
      style={{
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {calling ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Icon name="phone" size={20} color="white" />
          <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>
            Audio Call
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default AudioCallButton;
```

### Audio Call Screen

**File:** `screens/AudioCallScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {
  Call,
  StreamCall,
  CallContent,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import Icon from 'react-native-vector-icons/MaterialIcons';
import callService from '../services/callService';

const AudioCallScreen = ({ route, navigation }) => {
  const { callId, token, isOutgoing, targetUser } = route.params;
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  useEffect(() => {
    const setupCall = async () => {
      try {
        // 1. Create or join the call
        const streamCall = client.call('default', callId);
        
        if (isOutgoing) {
          // Outgoing call - already created on backend
          await streamCall.join();
        } else {
          // Incoming call - join existing
          await streamCall.join();
        }

        setCall(streamCall);
        setCallState('connected');

        // 2. Listen for call end
        streamCall.on('call.ended', () => {
          endCall();
        });

        // 3. Disable video for audio-only call
        await streamCall.camera.disable();
        await streamCall.microphone.enable();

      } catch (error) {
        console.error('Call setup error:', error);
        Alert.alert('Call Failed', 'Unable to connect to the call');
        navigation.goBack();
      }
    };

    setupCall();

    return () => {
      if (call) {
        call.leave();
      }
    };
  }, []);

  const endCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      
      // Notify backend
      await callService.endCall(callId);
      
      setCallState('ended');
      navigation.goBack();
    } catch (error) {
      console.error('End call error:', error);
      navigation.goBack();
    }
  };

  const toggleMute = async () => {
    if (call) {
      if (call.microphone.status === 'enabled') {
        await call.microphone.disable();
      } else {
        await call.microphone.enable();
      }
    }
  };

  const toggleSpeaker = async () => {
    // Toggle speaker/earpiece
    if (call) {
      // Implementation depends on your audio manager
      // You can use react-native-incall-manager for this
    }
  };

  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{ uri: targetUser.avatar || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{targetUser.name}</Text>
        <Text style={styles.callStatus}>
          {callState === 'connecting' ? 'Connecting...' : 'Connected'}
        </Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Icon name="mic" size={30} color="white" />
          <Text style={styles.controlLabel}>Mute</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleSpeaker}>
          <Icon name="volume-up" size={30} color="white" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Icon name="call-end" size={30} color="white" />
          <Text style={styles.controlLabel}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'space-between',
    padding: 20,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#888',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
  },
  endCallButton: {
    backgroundColor: '#f44336',
    borderRadius: 40,
    padding: 20,
  },
  controlLabel: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
  },
});

export default AudioCallScreen;
```

---

## 📹 Making Video Calls

### Video Call Button

**File:** `components/VideoCallButton.tsx`

```typescript
import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import callService from '../services/callService';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface VideoCallButtonProps {
  targetUser: {
    id: string;
    name: string;
  };
  currentUser: {
    id: string;
    name: string;
  };
}

const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  targetUser,
  currentUser,
}) => {
  const [calling, setCalling] = useState(false);
  const navigation = useNavigation();

  const initiateVideoCall = async () => {
    try {
      setCalling(true);

      // 1. Create video call on backend
      const response = await callService.createVideoCall([
        {
          user_id: targetUser.id,
          name: targetUser.name,
          role: 'participant',
        },
      ], false, false); // screen_sharing, recording

      if (!response.success) {
        Alert.alert('Call Failed', response.error || 'Unable to create call');
        return;
      }

      // 2. Extract call data
      const { call, tokens } = response.data;
      
      // 3. Get token for current user
      const userToken = tokens.find((t) => t.user_id === currentUser.id);

      if (!userToken) {
        Alert.alert('Error', 'Failed to get call token');
        return;
      }

      // 4. Navigate to video call screen
      navigation.navigate('VideoCall', {
        callId: call.call_id,
        callType: 'video',
        token: userToken.token,
        isOutgoing: true,
        targetUser: targetUser,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
      console.error('Video call error:', error);
    } finally {
      setCalling(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={initiateVideoCall}
      disabled={calling}
      style={{
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {calling ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Icon name="videocam" size={20} color="white" />
          <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>
            Video Call
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default VideoCallButton;
```

### Video Call Screen

**File:** `screens/VideoCallScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Call,
  StreamCall,
  CallContent,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import Icon from 'react-native-vector-icons/MaterialIcons';
import callService from '../services/callService';

const VideoCallScreen = ({ route, navigation }) => {
  const { callId, token, isOutgoing, targetUser } = route.params;
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const setupCall = async () => {
      try {
        // 1. Create or join the call
        const streamCall = client.call('default', callId);
        
        if (isOutgoing) {
          await streamCall.join();
        } else {
          await streamCall.join();
        }

        setCall(streamCall);

        // 2. Enable camera and microphone
        await streamCall.camera.enable();
        await streamCall.microphone.enable();

        // 3. Listen for call end
        streamCall.on('call.ended', () => {
          endCall();
        });

      } catch (error) {
        console.error('Call setup error:', error);
        Alert.alert('Call Failed', 'Unable to connect to the call');
        navigation.goBack();
      }
    };

    setupCall();

    return () => {
      if (call) {
        call.leave();
      }
    };
  }, []);

  const endCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      
      await callService.endCall(callId);
      navigation.goBack();
    } catch (error) {
      console.error('End call error:', error);
      navigation.goBack();
    }
  };

  const toggleMute = async () => {
    if (call) {
      if (isMuted) {
        await call.microphone.enable();
      } else {
        await call.microphone.disable();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (call) {
      if (isVideoOff) {
        await call.camera.enable();
      } else {
        await call.camera.disable();
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  const flipCamera = async () => {
    if (call) {
      await call.camera.flip();
    }
  };

  if (!call) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  return (
    <StreamCall call={call}>
      <View style={styles.container}>
        {/* Video Content */}
        <CallContent />

        {/* Overlay Controls */}
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.userName}>{targetUser.name}</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Icon
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
            >
              <Icon name="call-end" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
              <Icon
                name={isVideoOff ? 'videocam-off' : 'videocam'}
                size={28}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <Icon name="flip-camera-ios" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    padding: 20,
    paddingTop: 50,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#f44336',
  },
});

export default VideoCallScreen;
```

---

## 📲 Receiving Calls

### Call Notification Handler

**File:** `services/callNotificationService.ts`

```typescript
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'wss://devapi.letscatchup-kcs.com:4501';

let socket: Socket | null = null;

export const initializeCallNotifications = (userId: string, token: string) => {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Call notification socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Call notification socket disconnected');
  });

  return socket;
};

export const useCallNotifications = (currentUser: { id: string; name: string }) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!socket) {
      console.warn('Socket not initialized');
      return;
    }

    // Listen for incoming calls
    socket.on('incoming-call', async (data: any) => {
      const { call_id, caller, call_type } = data;

      Alert.alert(
        `Incoming ${call_type} Call`,
        `${caller.name} is calling...`,
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => {
              // Notify backend of rejection
              socket?.emit('reject-call', { call_id });
            },
          },
          {
            text: 'Answer',
            onPress: async () => {
              try {
                // Join the call
                const response = await callService.joinCall(call_id);
                
                if (response.success) {
                  navigation.navigate(
                    call_type === 'video' ? 'VideoCall' : 'AudioCall',
                    {
                      callId: call_id,
                      token: response.data.token,
                      isOutgoing: false,
                      targetUser: caller,
                    }
                  );
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to join call');
              }
            },
          },
        ],
        { cancelable: false }
      );
    });

    return () => {
      socket?.off('incoming-call');
    };
  }, [navigation, currentUser]);
};

export const disconnectCallNotifications = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### Integrate in Main App

**File:** `App.tsx` or `MainNavigator.tsx`

```typescript
import React, { useEffect } from 'react';
import { useCallNotifications, initializeCallNotifications } from './services/callNotificationService';

const MainApp = ({ user, token }) => {
  useEffect(() => {
    // Initialize call notifications
    initializeCallNotifications(user.id, token);
  }, [user.id, token]);

  // Listen for incoming calls
  useCallNotifications(user);

  return (
    // Your app navigation
    <NavigationContainer>
      {/* Your screens */}
    </NavigationContainer>
  );
};

export default MainApp;
```

---

## 🎨 Call UI Components

### Call History List

**File:** `screens/CallHistoryScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import callService from '../services/callService';

const CallHistoryScreen = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const response = await callService.getCallHistory();
      if (response.success) {
        setCalls(response.data);
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCallItem = ({ item }) => {
    const isVideo = item.call_type === 'video';
    const isMissed = item.call_status === 'missed';
    const isOutgoing = item.caller_id === currentUser.id;

    return (
      <TouchableOpacity style={styles.callItem}>
        <Icon
          name={isVideo ? 'videocam' : 'phone'}
          size={24}
          color={isMissed ? '#f44336' : '#4CAF50'}
        />
        <View style={styles.callInfo}>
          <Text style={styles.callerName}>
            {/* Get participant name */}
            {item.participants[0]}
          </Text>
          <Text style={styles.callTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        <Icon
          name={isOutgoing ? 'call-made' : 'call-received'}
          size={20}
          color="#888"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadCallHistory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callInfo: {
    flex: 1,
    marginLeft: 16,
  },
  callerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  callTime: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
});

export default CallHistoryScreen;
```

---

## 🚀 Advanced Features

### 1. Screen Sharing (Video Calls Only)

```typescript
const enableScreenShare = async () => {
  if (call) {
    try {
      await call.screenShare.enable();
      Alert.alert('Screen Sharing', 'Screen sharing started');
    } catch (error) {
      Alert.alert('Error', 'Failed to start screen sharing');
    }
  }
};

const disableScreenShare = async () => {
  if (call) {
    await call.screenShare.disable();
  }
};
```

### 2. Call Recording

```typescript
// Start recording (requires backend support)
const startRecording = async () => {
  if (call) {
    try {
      await call.startRecording();
      Alert.alert('Recording', 'Call recording started');
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  }
};

const stopRecording = async () => {
  if (call) {
    await call.stopRecording();
  }
};
```

### 3. Call Quality Indicators

```typescript
import { useCallStateHooks } from '@stream-io/video-react-native-sdk';

const CallQualityIndicator = () => {
  const { useCallStats } = useCallStateHooks();
  const stats = useCallStats();

  return (
    <View style={styles.qualityIndicator}>
      <Text>Quality: {stats.quality}</Text>
      <Text>Latency: {stats.latency}ms</Text>
    </View>
  );
};
```

### 4. Picture-in-Picture Mode

```typescript
import { usePictureInPicture } from '@stream-io/video-react-native-sdk';

const VideoCallScreen = () => {
  const { enablePictureInPicture } = usePictureInPicture();

  const handleMinimize = async () => {
    await enablePictureInPicture();
  };

  // Add minimize button to UI
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"Camera permission denied"**
```typescript
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const requestPermissions = async () => {
  const cameraPermission = await request(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA
  );

  const micPermission = await request(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO
  );

  if (cameraPermission !== RESULTS.GRANTED || micPermission !== RESULTS.GRANTED) {
    Alert.alert('Permissions Required', 'Camera and microphone access needed');
  }
};
```

#### 2. **"Call connection timeout"**
- Check network connectivity
- Verify backend API is reachable
- Ensure JWT token is valid
- Check if GetStream API key is correct

#### 3. **"No audio/video in call"**
```typescript
// Check device capabilities
const checkDevices = async () => {
  const devices = await call.camera.listDevices();
  console.log('Available cameras:', devices);

  const audioDevices = await call.microphone.listDevices();
  console.log('Available microphones:', audioDevices);
};
```

#### 4. **"Call ends immediately"**
- Verify token hasn't expired (24h validity)
- Check if participant has permission to call
- Ensure campus_id is correct

### Debug Mode

```typescript
// Enable debug logs
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

const client = new StreamVideoClient({
  apiKey: GETSTREAM_API_KEY,
  user: { id: userId, name: userName },
  token,
  options: {
    logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
  },
});
```

---

## ✅ Best Practices

### 1. **Token Management**
```typescript
// Store tokens securely
import * as SecureStore from 'expo-secure-store';

const storeToken = async (token: string) => {
  await SecureStore.setItemAsync('getstream_token', token);
};

const getToken = async () => {
  return await SecureStore.getItemAsync('getstream_token');
};
```

### 2. **Network Status Handling**
```typescript
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (!state.isConnected && call) {
    Alert.alert(
      'Connection Lost',
      'Your network connection is unstable. Call may be affected.'
    );
  }
});
```

### 3. **Background Mode (iOS)**
```typescript
// In app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio", "voip"]
      }
    }
  }
}
```

### 4. **Memory Management**
```typescript
useEffect(() => {
  return () => {
    // Cleanup on component unmount
    if (call) {
      call.leave();
      call.camera.disable();
      call.microphone.disable();
    }
  };
}, [call]);
```

### 5. **Error Boundaries**
```typescript
class CallErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Call error:', error, errorInfo);
    Alert.alert('Call Error', 'An unexpected error occurred');
    this.props.navigation.goBack();
  }

  render() {
    return this.props.children;
  }
}

// Wrap call screens
<CallErrorBoundary>
  <VideoCallScreen />
</CallErrorBoundary>
```

---

## 📊 Testing Checklist

- [ ] Login and initialize Stream client
- [ ] Create audio call
- [ ] Create video call
- [ ] Receive incoming call notification
- [ ] Answer incoming call
- [ ] Decline incoming call
- [ ] Toggle mute/unmute
- [ ] Toggle video on/off
- [ ] Flip camera (video calls)
- [ ] End call
- [ ] View call history
- [ ] Handle network disconnection
- [ ] Handle permissions denial
- [ ] Test on both iOS and Android
- [ ] Test on real devices (not just simulator)

---

## 🔗 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/video-calls/audio` | POST | Create audio call |
| `/api/video-calls/video` | POST | Create video call |
| `/api/video-calls/:id/join` | POST | Join existing call |
| `/api/video-calls/:id/end` | POST | End call |
| `/api/video-calls/history` | GET | Get call history |
| `/api/video-calls/:id` | GET | Get call details |

---

## 📚 Additional Resources

- **GetStream Video Docs**: https://getstream.io/video/docs/react-native/
- **Backend API Base URL**: https://devapi.letscatchup-kcs.com
- **WebSocket URL**: wss://devapi.letscatchup-kcs.com:4501
- **Support**: Contact backend team for GetStream API key

---

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review GetStream documentation
3. Contact backend team for API/token issues
4. Check server logs for call failures

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0  
**Maintained by:** KCS Backend Team
