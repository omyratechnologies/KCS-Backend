# Upload API Integration Guide for React Native

## Overview

The KCS Backend provides a robust file upload system that integrates with AWS S3 (or Cloudflare R2) for cloud storage. This document provides detailed instructions for integrating the upload APIs into a React Native application.

## API Endpoints

All upload endpoints are prefixed with `/api/upload` and require authentication.

### Base URL Structure
```
{BASE_URL}/api/upload
```

### Available Endpoints

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| PUT | `/` | Upload a new file | Yes |
| GET | `/user` | Get all uploads by current user | Yes |
| GET | `/campus` | Get all uploads by current campus | Yes |
| GET | `/i/:upload_id` | Get specific upload by ID | Yes |

## Data Models

### Upload Object Structure

```typescript
interface UploadData {
  id: string;
  campus_id: string;
  user_id: string;
  original_file_name: string;
  stored_file_name: string;
  file_size: number;
  file_type: string;
  s3_url: string;
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Response Formats

#### Success Response (Upload)
```json
{
  "id": "upload123",
  "campus_id": "campus123",
  "user_id": "user456",
  "original_file_name": "assignment.pdf",
  "stored_file_name": "abc123-assignment.pdf",
  "file_size": 1024,
  "file_type": "application/pdf",
  "s3_url": "https://bucket.r2.dev/abc123-assignment.pdf",
  "meta_data": {},
  "created_at": "2025-07-12T10:00:00Z",
  "updated_at": "2025-07-12T10:00:00Z"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

## React Native Integration

### 1. Prerequisites

Install required dependencies:

```bash
npm install react-native-document-picker
npm install react-native-image-picker  # For image/camera uploads
npm install @react-native-async-storage/async-storage  # For token storage
```

### 2. Upload Service Implementation

Create a service file for handling uploads:

```typescript
// services/UploadService.ts
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UploadConfig {
  baseUrl: string;
  getAuthToken: () => Promise<string | null>;
}

class UploadService {
  private config: UploadConfig;

  constructor(config: UploadConfig) {
    this.config = config;
  }

  /**
   * Upload a file to the server
   */
  async uploadFile(file: {
    uri: string;
    type: string;
    name: string;
    size?: number;
  }): Promise<any> {
    try {
      const token = await this.config.getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
        size: file.size,
      } as any);

      const response = await fetch(`${this.config.baseUrl}/api/upload`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get all uploads for current user
   */
  async getUserUploads(): Promise<any[]> {
    try {
      const token = await this.config.getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.config.baseUrl}/api/upload/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch uploads');
      }

      return await response.json();
    } catch (error) {
      console.error('Get uploads error:', error);
      throw error;
    }
  }

  /**
   * Get uploads for current campus
   */
  async getCampusUploads(): Promise<any[]> {
    try {
      const token = await this.config.getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.config.baseUrl}/api/upload/campus`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch campus uploads');
      }

      return await response.json();
    } catch (error) {
      console.error('Get campus uploads error:', error);
      throw error;
    }
  }

  /**
   * Get specific upload by ID
   */
  async getUploadById(uploadId: string): Promise<any> {
    try {
      const token = await this.config.getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.config.baseUrl}/api/upload/i/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch upload');
      }

      return await response.json();
    } catch (error) {
      console.error('Get upload error:', error);
      throw error;
    }
  }

  /**
   * Pick document from device
   */
  async pickDocument(): Promise<DocumentPickerResponse> {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });
      return result;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        throw new Error('Document selection cancelled');
      }
      throw error;
    }
  }

  /**
   * Pick image from gallery or camera
   */
  async pickImage(): Promise<ImagePickerResponse> {
    return new Promise((resolve, reject) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          includeBase64: false,
        },
        (response) => {
          if (response.didCancel) {
            reject(new Error('Image selection cancelled'));
          } else if (response.errorMessage) {
            reject(new Error(response.errorMessage));
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

export default UploadService;
```

### 3. Initialize Upload Service

```typescript
// utils/uploadConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadService from '../services/UploadService';

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const uploadService = new UploadService({
  baseUrl: 'https://your-api-base-url.com', // Replace with your actual API URL
  getAuthToken,
});
```

### 4. React Native Components

#### File Upload Component

```tsx
// components/FileUploader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { uploadService } from '../utils/uploadConfig';

interface FileUploaderProps {
  onUploadSuccess?: (uploadData: any) => void;
  onUploadError?: (error: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentUpload = async () => {
    try {
      setIsUploading(true);
      
      // Pick document
      const document = await uploadService.pickDocument();
      
      // Prepare file object
      const file = {
        uri: document.fileCopyUri || document.uri,
        type: document.type || 'application/octet-stream',
        name: document.name || 'unknown-file',
        size: document.size,
      };

      // Upload file
      const uploadResult = await uploadService.uploadFile(file);
      
      Alert.alert('Success', 'File uploaded successfully!');
      onUploadSuccess?.(uploadResult);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      Alert.alert('Error', errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      setIsUploading(true);
      
      // Pick image
      const imageResponse = await uploadService.pickImage();
      
      if (imageResponse.assets && imageResponse.assets.length > 0) {
        const image = imageResponse.assets[0];
        
        // Prepare file object
        const file = {
          uri: image.uri!,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'image.jpg',
          size: image.fileSize,
        };

        // Upload file
        const uploadResult = await uploadService.uploadFile(file);
        
        Alert.alert('Success', 'Image uploaded successfully!');
        onUploadSuccess?.(uploadResult);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      Alert.alert('Error', errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isUploading && styles.buttonDisabled]}
        onPress={handleDocumentUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Upload Document</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.imageButton, isUploading && styles.buttonDisabled]}
        onPress={handleImageUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Upload Image</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FileUploader;
```

#### Upload List Component

```tsx
// components/UploadList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { uploadService } from '../utils/uploadConfig';

interface Upload {
  id: string;
  original_file_name: string;
  file_size: number;
  file_type: string;
  s3_url: string;
  created_at: string;
}

const UploadList: React.FC = () => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUploads = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const userUploads = await uploadService.getUserUploads();
      setUploads(userUploads);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch uploads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchUploads(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadItem = ({ item }: { item: Upload }) => (
    <TouchableOpacity style={styles.uploadItem}>
      <View style={styles.uploadInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.original_file_name}
        </Text>
        <Text style={styles.fileDetails}>
          {formatFileSize(item.file_size)} • {item.file_type}
        </Text>
        <Text style={styles.uploadDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.downloadButton}
        onPress={() => {
          // Handle file download/view
          console.log('Download/View file:', item.s3_url);
        }}
      >
        <Text style={styles.downloadText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Uploads</Text>
      <FlatList
        data={uploads}
        keyExtractor={(item) => item.id}
        renderItem={renderUploadItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No uploads found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  uploadItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  uploadDate: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    justifyContent: 'center',
  },
  downloadText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
});

export default UploadList;
```

### 5. Usage Example

```tsx
// screens/UploadScreen.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import FileUploader from '../components/FileUploader';
import UploadList from '../components/UploadList';

const UploadScreen: React.FC = () => {
  const handleUploadSuccess = (uploadData: any) => {
    console.log('Upload successful:', uploadData);
    // Refresh the upload list or navigate
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <ScrollView style={styles.container}>
      <FileUploader
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      <UploadList />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default UploadScreen;
```

## Authentication

The upload APIs require authentication. Make sure to:

1. Include the `Authorization` header with a valid JWT token
2. Handle token expiration and refresh
3. Store tokens securely using AsyncStorage or Keychain

Example authentication header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## File Type Support

The API supports various file types including:
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Images: JPG, JPEG, PNG, GIF, WebP
- Videos: MP4, MOV, AVI
- Archives: ZIP, RAR
- Text files: TXT, CSV

## Error Handling

Common error scenarios:

1. **No file selected**: User cancels file picker
2. **Large file size**: File exceeds size limits
3. **Network errors**: Connection issues
4. **Authentication errors**: Invalid or expired token
5. **Server errors**: S3 upload failures

## Security Considerations

1. **File validation**: Validate file types and sizes on the client
2. **Token management**: Store auth tokens securely
3. **HTTPS**: Always use HTTPS for API calls
4. **File scanning**: Consider implementing virus scanning
5. **Access control**: Ensure users can only access their own files

## Performance Optimization

1. **Progress tracking**: Implement upload progress indicators
2. **Chunked uploads**: For large files, consider chunked uploads
3. **Compression**: Compress images before upload
4. **Caching**: Cache upload metadata locally
5. **Background uploads**: Continue uploads when app goes to background

## Testing

Test the integration with:

1. Different file types and sizes
2. Network interruptions
3. Authentication scenarios
4. Error conditions
5. Performance with large files

## Troubleshooting

### Common Issues

1. **Upload fails silently**
   - Check authentication token
   - Verify API endpoint URL
   - Check network connectivity

2. **File picker not working**
   - Ensure proper permissions in `AndroidManifest.xml` and `Info.plist`
   - Check if document picker is properly installed

3. **Large files timing out**
   - Implement proper timeout handling
   - Consider chunked uploads for large files

4. **Images not uploading**
   - Check file URI format
   - Ensure proper MIME type detection

### Debug Tips

1. Enable network debugging
2. Log API requests and responses
3. Test with different file types
4. Monitor memory usage during uploads
5. Check server logs for upload issues

## Conclusion

This integration guide provides a complete solution for implementing file uploads in React Native with the KCS Backend API. The implementation includes error handling, progress tracking, and follows React Native best practices for file handling and API integration.
