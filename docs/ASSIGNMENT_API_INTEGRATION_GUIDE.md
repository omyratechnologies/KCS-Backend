# Assignment APIs Integration Guide for React and React Native

## Overview

The KCS Backend provides a comprehensive assignment management system that supports both class-based assignments and course-based assignments. This document provides detailed instructions for integrating the assignment APIs into React and React Native applications with role-based access control.

## API Architecture

### Assignment Types
1. **Class Assignments** - Traditional classroom assignments linked to specific classes and subjects
2. **Course Assignments** - Course-specific assignments for enrolled students

### User Roles
- **Teachers** - Create, update, grade assignments and view submissions
- **Students** - View assignments, submit work, check grades
- **Admins** - Full access to all assignment operations
- **Parents** - View child's assignments and grades (read-only)

## API Endpoints

All assignment endpoints require authentication and are prefixed with `/api/class` or `/api/course`.

### Class Assignment Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|--------|
| GET | `/class/assignments/all` | Get all assignments from all classes | Admin, Teacher |
| GET | `/class/:class_id/assignments` | Get assignments by class ID | All |
| GET | `/class/assignment/:assignment_id` | Get specific assignment | All |
| POST | `/class/:class_id/assignments` | Create new assignment | Teacher, Admin |
| PUT | `/class/assignment/:assignment_id` | Update assignment | Teacher, Admin |
| DELETE | `/class/assignment/:assignment_id` | Delete assignment | Teacher, Admin |

### Assignment Submission Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|--------|
| GET | `/class/assignment-submission/:submission_id` | Get submission by ID | All |
| POST | `/class/assignment-submission/:assignment_id` | Create submission | Student |
| GET | `/class/assignment-submission/:assignment_id/submissions` | Get all submissions for assignment | Teacher, Admin |
| GET | `/class/assignment-submission/user/:user_id` | Get user's submissions | Student, Parent |
| GET | `/class/assignment-submission/class/:class_id` | Get class submissions | Teacher, Admin |
| DELETE | `/class/assignment-submission/:submission_id` | Delete submission | Student, Admin |

### Course Assignment Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|--------|
| POST | `/course/:course_id/assignment` | Create course assignment | Teacher, Admin |
| GET | `/course/:course_id/assignments` | Get course assignments | All |
| GET | `/course/assignment/:assignment_id` | Get course assignment by ID | All |

## Data Models

### Assignment Model

```typescript
interface Assignment {
  id: string;
  campus_id: string;
  class_id: string;
  subject_id: string;
  user_id: string; // Creator (teacher)
  title: string;
  description: string;
  due_date: string; // ISO date string
  is_graded: boolean;
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Assignment Submission Model

```typescript
interface AssignmentSubmission {
  id: string;
  campus_id: string;
  assignment_id: string;
  user_id: string; // Student who submitted
  submission_date: string;
  grade: number;
  feedback: string;
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Course Assignment Model

```typescript
interface CourseAssignment {
  id: string;
  campus_id: string;
  course_id: string;
  assignment_title: string;
  assignment_description: string;
  due_date: string;
  is_graded: boolean;
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

## React Implementation

### 1. Assignment Service

```typescript
// services/AssignmentService.ts
import { ApiClient } from './ApiClient';

interface AssignmentCreateData {
  title: string;
  description: string;
  due_date: string;
  subject_id: string;
  is_graded?: boolean;
  meta_data?: Record<string, any>;
}

interface SubmissionCreateData {
  user_id: string;
  submission_date: string;
  grade?: number;
  feedback?: string;
  meta_data?: Record<string, any>;
}

class AssignmentService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Class Assignments
  async getAllAssignments(): Promise<Assignment[]> {
    return this.apiClient.get('/class/assignments/all');
  }

  async getAssignmentsByClassId(classId: string): Promise<Assignment[]> {
    return this.apiClient.get(`/class/${classId}/assignments`);
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    return this.apiClient.get(`/class/assignment/${assignmentId}`);
  }

  async createAssignment(classId: string, data: AssignmentCreateData): Promise<Assignment> {
    return this.apiClient.post(`/class/${classId}/assignments`, data);
  }

  async updateAssignment(assignmentId: string, data: Partial<AssignmentCreateData>): Promise<Assignment> {
    return this.apiClient.put(`/class/assignment/${assignmentId}`, data);
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    return this.apiClient.delete(`/class/assignment/${assignmentId}`);
  }

  // Assignment Submissions
  async getSubmissionById(submissionId: string): Promise<AssignmentSubmission> {
    return this.apiClient.get(`/class/assignment-submission/${submissionId}`);
  }

  async createSubmission(assignmentId: string, data: SubmissionCreateData): Promise<AssignmentSubmission> {
    return this.apiClient.post(`/class/assignment-submission/${assignmentId}`, data);
  }

  async getSubmissionsByAssignmentId(assignmentId: string): Promise<AssignmentSubmission[]> {
    return this.apiClient.get(`/class/assignment-submission/${assignmentId}/submissions`);
  }

  async getSubmissionsByUserId(userId: string): Promise<AssignmentSubmission[]> {
    return this.apiClient.get(`/class/assignment-submission/user/${userId}`);
  }

  async getSubmissionsByClassId(classId: string): Promise<AssignmentSubmission[]> {
    return this.apiClient.get(`/class/assignment-submission/class/${classId}`);
  }

  async deleteSubmission(submissionId: string): Promise<void> {
    return this.apiClient.delete(`/class/assignment-submission/${submissionId}`);
  }

  // Course Assignments
  async createCourseAssignment(courseId: string, data: any): Promise<CourseAssignment> {
    return this.apiClient.post(`/course/${courseId}/assignment`, data);
  }

  async getCourseAssignments(courseId: string): Promise<CourseAssignment[]> {
    return this.apiClient.get(`/course/${courseId}/assignments`);
  }

  async getCourseAssignmentById(assignmentId: string): Promise<CourseAssignment> {
    return this.apiClient.get(`/course/assignment/${assignmentId}`);
  }
}

export default AssignmentService;
```

### 2. Role-Based Hook

```typescript
// hooks/useAssignments.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { AssignmentService } from '../services/AssignmentService';

export const useAssignments = (classId?: string) => {
  const { user, userRole } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignmentService = new AssignmentService();

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: Assignment[] = [];
      
      switch (userRole) {
        case 'admin':
        case 'teacher':
          data = classId 
            ? await assignmentService.getAssignmentsByClassId(classId)
            : await assignmentService.getAllAssignments();
          break;
        case 'student':
        case 'parent':
          if (classId) {
            data = await assignmentService.getAssignmentsByClassId(classId);
          }
          break;
        default:
          throw new Error('Unauthorized access');
      }
      
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId, userRole]);

  const createAssignment = async (data: AssignmentCreateData) => {
    if (!['admin', 'teacher'].includes(userRole)) {
      throw new Error('Unauthorized to create assignments');
    }
    
    if (!classId) {
      throw new Error('Class ID is required');
    }

    const newAssignment = await assignmentService.createAssignment(classId, data);
    setAssignments(prev => [newAssignment, ...prev]);
    return newAssignment;
  };

  const updateAssignment = async (assignmentId: string, data: Partial<AssignmentCreateData>) => {
    if (!['admin', 'teacher'].includes(userRole)) {
      throw new Error('Unauthorized to update assignments');
    }

    const updatedAssignment = await assignmentService.updateAssignment(assignmentId, data);
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId ? updatedAssignment : assignment
      )
    );
    return updatedAssignment;
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!['admin', 'teacher'].includes(userRole)) {
      throw new Error('Unauthorized to delete assignments');
    }

    await assignmentService.deleteAssignment(assignmentId);
    setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
  };

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    canCreate: ['admin', 'teacher'].includes(userRole),
    canEdit: ['admin', 'teacher'].includes(userRole),
    canDelete: ['admin', 'teacher'].includes(userRole),
  };
};
```

### 3. Teacher Assignment Management Component

```tsx
// components/teacher/AssignmentManager.tsx
import React, { useState } from 'react';
import { useAssignments } from '../../hooks/useAssignments';
import { AssignmentForm } from './AssignmentForm';
import { AssignmentList } from './AssignmentList';

interface AssignmentManagerProps {
  classId: string;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ classId }) => {
  const {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    canCreate,
    canEdit,
    canDelete
  } = useAssignments(classId);

  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const handleCreateAssignment = async (data: AssignmentCreateData) => {
    try {
      await createAssignment(data);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const handleUpdateAssignment = async (data: Partial<AssignmentCreateData>) => {
    if (!editingAssignment) return;
    
    try {
      await updateAssignment(editingAssignment.id, data);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteAssignment(assignmentId);
      } catch (error) {
        console.error('Failed to delete assignment:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading assignments...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="assignment-manager">
      <div className="assignment-header">
        <h2>Assignment Management</h2>
        {canCreate && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary"
          >
            Create Assignment
          </button>
        )}
      </div>

      {isCreating && (
        <AssignmentForm
          onSubmit={handleCreateAssignment}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {editingAssignment && (
        <AssignmentForm
          initialData={editingAssignment}
          onSubmit={handleUpdateAssignment}
          onCancel={() => setEditingAssignment(null)}
        />
      )}

      <AssignmentList
        assignments={assignments}
        onEdit={canEdit ? setEditingAssignment : undefined}
        onDelete={canDelete ? handleDeleteAssignment : undefined}
        showActions={canEdit || canDelete}
      />
    </div>
  );
};
```

### 4. Student Assignment View Component

```tsx
// components/student/StudentAssignments.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AssignmentService } from '../../services/AssignmentService';
import { AssignmentSubmissionForm } from './AssignmentSubmissionForm';

export const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);

  const assignmentService = new AssignmentService();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch assignments for student's classes
      const userSubmissions = await assignmentService.getSubmissionsByUserId(user.id);
      setSubmissions(userSubmissions);
      
      // You might need to fetch assignments based on student's enrolled classes
      // This depends on your specific implementation
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string, submissionData: any) => {
    try {
      const submission = await assignmentService.createSubmission(assignmentId, {
        user_id: user.id,
        submission_date: new Date().toISOString(),
        ...submissionData
      });
      
      setSubmissions(prev => [submission, ...prev]);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(sub => sub.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="student-assignments">
      <h2>My Assignments</h2>
      
      <div className="assignment-grid">
        {assignments.map(assignment => {
          const submission = getSubmissionForAssignment(assignment.id);
          const overdue = isOverdue(assignment.due_date);
          
          return (
            <div
              key={assignment.id}
              className={`assignment-card ${submission ? 'submitted' : ''} ${overdue ? 'overdue' : ''}`}
            >
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              <div className="assignment-meta">
                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                {assignment.is_graded && (
                  <span className="graded-badge">Graded</span>
                )}
              </div>
              
              {submission ? (
                <div className="submission-status">
                  <span className="submitted">✓ Submitted</span>
                  {submission.grade && (
                    <span className="grade">Grade: {submission.grade}</span>
                  )}
                  {submission.feedback && (
                    <div className="feedback">
                      <strong>Feedback:</strong> {submission.feedback}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`btn ${overdue ? 'btn-warning' : 'btn-primary'}`}
                  disabled={overdue}
                >
                  {overdue ? 'Overdue' : 'Submit Assignment'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedAssignment && (
        <AssignmentSubmissionForm
          assignment={selectedAssignment}
          onSubmit={(data) => handleSubmitAssignment(selectedAssignment.id, data)}
          onCancel={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
};
```

## React Native Implementation

### 1. Assignment Service for React Native

```typescript
// services/AssignmentService.ts (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiConfig {
  baseUrl: string;
  getAuthToken: () => Promise<string | null>;
}

class AssignmentService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.config.getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${this.config.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Assignment methods
  async getAssignmentsByClassId(classId: string): Promise<Assignment[]> {
    return this.makeRequest(`/class/${classId}/assignments`);
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    return this.makeRequest(`/class/assignment/${assignmentId}`);
  }

  async createAssignment(classId: string, data: AssignmentCreateData): Promise<Assignment> {
    return this.makeRequest(`/class/${classId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(assignmentId: string, data: Partial<AssignmentCreateData>): Promise<Assignment> {
    return this.makeRequest(`/class/assignment/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    return this.makeRequest(`/class/assignment/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  // Submission methods
  async createSubmission(assignmentId: string, data: SubmissionCreateData): Promise<AssignmentSubmission> {
    return this.makeRequest(`/class/assignment-submission/${assignmentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubmissionsByUserId(userId: string): Promise<AssignmentSubmission[]> {
    return this.makeRequest(`/class/assignment-submission/user/${userId}`);
  }

  async getSubmissionsByAssignmentId(assignmentId: string): Promise<AssignmentSubmission[]> {
    return this.makeRequest(`/class/assignment-submission/${assignmentId}/submissions`);
  }
}

export default AssignmentService;
```

### 2. Assignment List Component (React Native)

```tsx
// components/AssignmentList.tsx (React Native)
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
import { AssignmentService } from '../services/AssignmentService';
import { useAuth } from '../hooks/useAuth';

interface AssignmentListProps {
  classId?: string;
  navigation: any;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({ classId, navigation }) => {
  const { user, userRole } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const assignmentService = new AssignmentService({
    baseUrl: 'https://your-api-url.com',
    getAuthToken: async () => await AsyncStorage.getItem('authToken'),
  });

  const fetchAssignments = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    try {
      let data: Assignment[] = [];
      
      if (classId) {
        data = await assignmentService.getAssignmentsByClassId(classId);
      }
      
      setAssignments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments(false);
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    navigation.navigate('AssignmentDetail', { assignment });
  };

  const handleCreateAssignment = () => {
    if (['admin', 'teacher'].includes(userRole)) {
      navigation.navigate('CreateAssignment', { classId });
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const renderAssignmentItem = ({ item }: { item: Assignment }) => {
    const overdue = isOverdue(item.due_date);
    
    return (
      <TouchableOpacity
        style={[styles.assignmentCard, overdue && styles.overdueCard]}
        onPress={() => handleAssignmentPress(item)}
      >
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTitle}>{item.title}</Text>
          {item.is_graded && (
            <View style={styles.gradedBadge}>
              <Text style={styles.gradedText}>Graded</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.assignmentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.assignmentFooter}>
          <Text style={[styles.dueDate, overdue && styles.overdueDueDate]}>
            Due: {new Date(item.due_date).toLocaleDateString()}
          </Text>
          {overdue && (
            <Text style={styles.overdueLabel}>Overdue</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        {['admin', 'teacher'].includes(userRole) && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAssignment}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignmentItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assignments found</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  assignmentCard: {
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
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  gradedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
  },
  overdueDueDate: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  overdueLabel: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
```

### 3. Assignment Submission Component (React Native)

```tsx
// components/AssignmentSubmission.tsx (React Native)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { AssignmentService } from '../services/AssignmentService';
import { useAuth } from '../hooks/useAuth';

interface AssignmentSubmissionProps {
  assignment: Assignment;
  navigation: any;
}

export const AssignmentSubmission: React.FC<AssignmentSubmissionProps> = ({
  assignment,
  navigation
}) => {
  const { user } = useAuth();
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const assignmentService = new AssignmentService({
    baseUrl: 'https://your-api-url.com',
    getAuthToken: async () => await AsyncStorage.getItem('authToken'),
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      
      setAttachments(prev => [...prev, result]);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && attachments.length === 0) {
      Alert.alert('Error', 'Please add content or attachments');
      return;
    }

    setLoading(true);
    
    try {
      const submissionData = {
        user_id: user.id,
        submission_date: new Date().toISOString(),
        meta_data: {
          content: submissionText,
          attachments: attachments.map(att => ({
            name: att.name,
            uri: att.uri,
            type: att.type,
          })),
        },
      };

      await assignmentService.createSubmission(assignment.id, submissionData);
      
      Alert.alert(
        'Success',
        'Assignment submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const isOverdue = new Date(assignment.due_date) < new Date();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.assignmentInfo}>
        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
        <Text style={styles.assignmentDescription}>{assignment.description}</Text>
        <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
          Due: {new Date(assignment.due_date).toLocaleDateString()}
        </Text>
        {isOverdue && (
          <Text style={styles.overdueWarning}>This assignment is overdue</Text>
        )}
      </View>

      <View style={styles.submissionSection}>
        <Text style={styles.sectionTitle}>Your Submission</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Write your submission here..."
          value={submissionText}
          onChangeText={setSubmissionText}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.attachButton}
          onPress={handlePickDocument}
        >
          <Text style={styles.attachButtonText}>📎 Add Attachment</Text>
        </TouchableOpacity>

        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.attachmentsTitle}>Attachments:</Text>
            {attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Text style={styles.attachmentName}>{attachment.name}</Text>
                <TouchableOpacity
                  onPress={() => removeAttachment(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (loading || isOverdue) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || isOverdue}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isOverdue ? 'Submission Closed' : 'Submit Assignment'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  assignmentInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  assignmentDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
  },
  overdueDueDate: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  overdueWarning: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  submissionSection: {
    backgroundColor: 'white',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  attachButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  attachButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  attachmentsContainer: {
    marginBottom: 20,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  attachmentName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Authentication & Role Management

### Role-based Access Control

```typescript
// utils/rolePermissions.ts
export const permissions = {
  assignments: {
    create: ['admin', 'teacher'],
    read: ['admin', 'teacher', 'student', 'parent'],
    update: ['admin', 'teacher'],
    delete: ['admin', 'teacher'],
  },
  submissions: {
    create: ['student'],
    read: ['admin', 'teacher', 'student', 'parent'],
    update: ['admin', 'teacher'],
    delete: ['admin', 'student'],
    grade: ['admin', 'teacher'],
  },
};

export const hasPermission = (userRole: string, resource: string, action: string): boolean => {
  return permissions[resource]?.[action]?.includes(userRole) || false;
};

// Usage example
const canCreateAssignment = hasPermission(userRole, 'assignments', 'create');
const canGradeSubmission = hasPermission(userRole, 'submissions', 'grade');
```

## Error Handling

### Centralized Error Handler

```typescript
// utils/errorHandler.ts
export class AssignmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AssignmentError';
  }
}

export const handleApiError = (error: any) => {
  if (error.name === 'AssignmentError') {
    return error.message;
  }
  
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return 'Unauthorized access. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Assignment not found.';
      case 422:
        return 'Invalid assignment data provided.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  return 'Network error. Please check your connection.';
};
```

## Performance Optimization

### Caching Strategy

```typescript
// utils/assignmentCache.ts
class AssignmentCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  clearPattern(pattern: string) {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}

export const assignmentCache = new AssignmentCache();
```

## Testing

### Unit Tests Example

```typescript
// __tests__/AssignmentService.test.ts
import { AssignmentService } from '../services/AssignmentService';

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;

  beforeEach(() => {
    assignmentService = new AssignmentService({
      baseUrl: 'http://localhost:3000',
      getAuthToken: jest.fn().mockResolvedValue('mock-token'),
    });
  });

  test('should fetch assignments by class ID', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', title: 'Test Assignment' }]),
    });

    const assignments = await assignmentService.getAssignmentsByClassId('class1');
    
    expect(assignments).toHaveLength(1);
    expect(assignments[0].title).toBe('Test Assignment');
  });

  test('should create assignment successfully', async () => {
    const mockAssignment = { id: '1', title: 'New Assignment' };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAssignment),
    });

    const result = await assignmentService.createAssignment('class1', {
      title: 'New Assignment',
      description: 'Test description',
      due_date: '2023-12-31',
      subject_id: 'subject1',
    });

    expect(result).toEqual(mockAssignment);
  });
});
```

## Security Considerations

1. **Input Validation** - Validate all assignment data on both client and server
2. **File Upload Security** - Implement file type and size restrictions
3. **Access Control** - Ensure users can only access assignments for their classes
4. **Data Encryption** - Use HTTPS for all API communications
5. **Rate Limiting** - Implement rate limiting for submission endpoints
6. **Audit Logging** - Log all assignment and submission activities

## Deployment & Configuration

### Environment Configuration

```typescript
// config/environments.ts
export const environments = {
  development: {
    apiUrl: 'http://localhost:3000',
    enableCache: false,
    logLevel: 'debug',
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    enableCache: true,
    logLevel: 'info',
  },
  production: {
    apiUrl: 'https://api.example.com',
    enableCache: true,
    logLevel: 'error',
  },
};
```

## Conclusion

This comprehensive guide provides role-based assignment management integration for both React and React Native applications. The implementation includes:

- **Complete CRUD operations** for assignments and submissions
- **Role-based access control** for different user types
- **File upload support** for assignment submissions
- **Real-time updates** and caching strategies
- **Error handling** and validation
- **Performance optimization** techniques
- **Security best practices**

The solution is designed to be scalable, maintainable, and provides a smooth user experience across different platforms and user roles.
