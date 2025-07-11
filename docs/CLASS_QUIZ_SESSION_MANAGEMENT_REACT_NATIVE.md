# Class Quiz Session Management API - React Native Integration Guide

## Overview

This documentation provides a comprehensive guide for integrating the Class Quiz Session Management API with React Native applications. The session-based quiz system allows students to take quizzes with real-time state management, automatic session handling, and robust error recovery.

## Table of Contents

1. [Authentication & Setup](#authentication--setup)
2. [Session Lifecycle](#session-lifecycle)
3. [API Endpoints](#api-endpoints)
4. [React Native Implementation](#react-native-implementation)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Real-time Features](#real-time-features)
8. [Best Practices](#best-practices)
9. [Testing](#testing)

---

## Authentication & Setup

### Prerequisites

- Valid authentication token
- Campus ID and User ID from authentication
- React Native environment setup
- Network connectivity

### Headers Required

```javascript
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json',
  'Campus-ID': campusId,
  'User-ID': userId
};
```

---

## Session Lifecycle

### Quiz Session States

1. **STARTED** - Session initiated, quiz in progress
2. **PAUSED** - Session temporarily suspended (if supported)
3. **COMPLETED** - Session finished with submission
4. **EXPIRED** - Session automatically terminated due to timeout
5. **ABANDONED** - Session manually terminated without submission

### Session Flow Diagram

```
[Start Session] → [Answer Questions] → [Navigate] → [Complete/Abandon]
       ↓               ↓                 ↓              ↓
   [Get Session]   [Submit Answer]   [Next/Previous]  [Results]
```

---

## API Endpoints

### 1. Start Quiz Session

**Endpoint:** `POST /quiz/session/:class_id/:quiz_id/start`

**Purpose:** Initiates a new quiz session for a student

#### Request
```javascript
const startQuizSession = async (classId, quizId) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${classId}/${quizId}/start`, {
    method: 'POST',
    headers: headers,
  });
  return await response.json();
};
```

#### Response
```json
{
  "success": true,
  "message": "Quiz session started successfully",
  "data": {
    "session": {
      "id": "session_id_123",
      "session_token": "unique_session_token",
      "quiz_id": "quiz_id_456",
      "user_id": "user_id_789",
      "status": "STARTED",
      "started_at": "2025-07-11T10:00:00Z",
      "expires_at": "2025-07-11T11:30:00Z",
      "current_question_index": 0,
      "total_questions": 10,
      "time_limit_seconds": 5400
    },
    "quiz": {
      "id": "quiz_id_456",
      "quiz_name": "Math Quiz - Chapter 5",
      "quiz_description": "Algebra and Geometry",
      "quiz_meta_data": {
        "duration_minutes": 90,
        "passing_score": 70,
        "question_randomization": true
      }
    },
    "current_question": {
      "id": "question_id_001",
      "question_text": "What is the value of x in 2x + 5 = 15?",
      "question_type": "multiple_choice",
      "options": ["5", "10", "15", "20"],
      "meta_data": {
        "difficulty": "medium",
        "points": 10
      }
    },
    "questions_count": 10,
    "time_remaining_seconds": 5400
  }
}
```

### 2. Get Quiz Session

**Endpoint:** `GET /quiz/session/:session_token`

**Purpose:** Retrieves current session state and question

#### Request
```javascript
const getQuizSession = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}`, {
    method: 'GET',
    headers: headers,
  });
  return await response.json();
};
```

#### Response
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_id_123",
      "session_token": "unique_session_token",
      "status": "STARTED",
      "current_question_index": 2,
      "answers_submitted": ["A", "B"],
      "time_remaining_seconds": 4800
    },
    "quiz": {
      "quiz_name": "Math Quiz - Chapter 5",
      "total_questions": 10
    },
    "current_question": {
      "id": "question_id_003",
      "question_text": "Solve for y: 3y - 7 = 14",
      "question_type": "multiple_choice",
      "options": ["5", "7", "21", "9"]
    },
    "questions_count": 10,
    "time_remaining_seconds": 4800
  }
}
```

### 3. Submit Quiz Answer

**Endpoint:** `POST /quiz/session/:session_token/answer`

**Purpose:** Submits an answer for the current question

#### Request
```javascript
const submitQuizAnswer = async (sessionToken, questionId, answer) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/answer`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      question_id: questionId,
      answer: answer
    })
  });
  return await response.json();
};
```

#### Request Body
```json
{
  "question_id": "question_id_003",
  "answer": "7"
}
```

#### Response
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "session": {
      "current_question_index": 2,
      "answers_submitted": ["A", "B", "7"],
      "time_remaining_seconds": 4750
    },
    "current_question": {
      "id": "question_id_003",
      "user_answer": "7",
      "answered_at": "2025-07-11T10:15:00Z"
    },
    "quiz": {
      "total_questions": 10
    },
    "questions_count": 10,
    "time_remaining_seconds": 4750
  }
}
```

### 4. Navigate to Next Question

**Endpoint:** `POST /quiz/session/:session_token/next`

#### Request
```javascript
const navigateToNext = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/next`, {
    method: 'POST',
    headers: headers,
  });
  return await response.json();
};
```

#### Response
```json
{
  "success": true,
  "message": "Moved to next question",
  "data": {
    "session": {
      "current_question_index": 3,
      "time_remaining_seconds": 4700
    },
    "current_question": {
      "id": "question_id_004",
      "question_text": "What is the area of a circle with radius 5?",
      "question_type": "multiple_choice",
      "options": ["25π", "10π", "5π", "50π"]
    },
    "can_go_previous": true,
    "can_go_next": true,
    "questions_count": 10,
    "time_remaining_seconds": 4700
  }
}
```

### 5. Navigate to Previous Question

**Endpoint:** `POST /quiz/session/:session_token/previous`

#### Request
```javascript
const navigateToPrevious = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/previous`, {
    method: 'POST',
    headers: headers,
  });
  return await response.json();
};
```

### 6. Complete Quiz Session

**Endpoint:** `POST /quiz/session/:session_token/complete`

**Purpose:** Completes the quiz and submits final results

#### Request
```javascript
const completeQuizSession = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/complete`, {
    method: 'POST',
    headers: headers,
  });
  return await response.json();
};
```

#### Response
```json
{
  "success": true,
  "message": "Quiz completed successfully",
  "data": {
    "score": 85,
    "total_questions": 10,
    "percentage": 85,
    "correct_answers": 8,
    "incorrect_answers": 2,
    "time_taken_seconds": 1800,
    "submission": {
      "id": "submission_id_123",
      "submission_date": "2025-07-11T10:30:00Z",
      "feedback": "Well done! Good understanding of the concepts.",
      "auto_submitted": false
    }
  }
}
```

### 7. Abandon Quiz Session

**Endpoint:** `POST /quiz/session/:session_token/abandon`

#### Request
```javascript
const abandonQuizSession = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/abandon`, {
    method: 'POST',
    headers: headers,
  });
  return await response.json();
};
```

### 8. Get Quiz Results by Session

**Endpoint:** `GET /quiz/session/:session_token/results`

#### Request
```javascript
const getQuizResultsBySession = async (sessionToken) => {
  const response = await fetch(`${BASE_URL}/quiz/session/${sessionToken}/results`, {
    method: 'GET',
    headers: headers,
  });
  return await response.json();
};
```

#### Response
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_id_123",
      "session_token": "unique_session_token",
      "status": "COMPLETED",
      "started_at": "2025-07-11T10:00:00Z",
      "completed_at": "2025-07-11T10:30:00Z",
      "time_taken_seconds": 1800
    },
    "quiz": {
      "id": "quiz_id_456",
      "quiz_name": "Math Quiz - Chapter 5",
      "quiz_description": "Algebra and Geometry"
    },
    "results": {
      "submission_id": "submission_id_123",
      "score": 85,
      "total_questions": 10,
      "correct_answers": 8,
      "incorrect_answers": 2,
      "percentage": 85,
      "submission_date": "2025-07-11T10:30:00Z",
      "feedback": "Well done!",
      "time_taken_seconds": 1800,
      "auto_submitted": false
    },
    "question_details": [
      {
        "question_id": "question_id_001",
        "question_text": "What is the value of x in 2x + 5 = 15?",
        "question_type": "multiple_choice",
        "options": ["5", "10", "15", "20"],
        "correct_answer": "5",
        "user_answer": "5",
        "is_correct": true,
        "points_earned": 10
      }
    ]
  }
}
```

### 9. Get Quiz Session History

**Endpoint:** `GET /quiz/session/history?quiz_id=optional`

#### Request
```javascript
const getQuizSessionHistory = async (quizId = null) => {
  const url = quizId 
    ? `${BASE_URL}/quiz/session/history?quiz_id=${quizId}`
    : `${BASE_URL}/quiz/session/history`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });
  return await response.json();
};
```

---

## React Native Implementation

### 1. Quiz Session Hook

```javascript
import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useQuizSession = () => {
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);
  const sessionTokenRef = useRef(null);

  // Start quiz session
  const startSession = async (classId, quizId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await startQuizSession(classId, quizId);
      
      if (response.success) {
        setSession(response.data.session);
        setCurrentQuestion(response.data.current_question);
        setTimeRemaining(response.data.time_remaining_seconds);
        sessionTokenRef.current = response.data.session.session_token;
        
        // Start timer
        startTimer();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start session');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async (questionId, answer) => {
    try {
      setLoading(true);
      
      const response = await submitQuizAnswer(
        sessionTokenRef.current, 
        questionId, 
        answer
      );
      
      if (response.success) {
        setSession(prev => ({
          ...prev,
          ...response.data.session
        }));
        setTimeRemaining(response.data.time_remaining_seconds);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Navigate to next question
  const goToNext = async () => {
    try {
      setLoading(true);
      
      const response = await navigateToNext(sessionTokenRef.current);
      
      if (response.success) {
        setCurrentQuestion(response.data.current_question);
        setSession(prev => ({
          ...prev,
          ...response.data.session
        }));
        setTimeRemaining(response.data.time_remaining_seconds);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to navigate');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous question
  const goToPrevious = async () => {
    try {
      setLoading(true);
      
      const response = await navigateToPrevious(sessionTokenRef.current);
      
      if (response.success) {
        setCurrentQuestion(response.data.current_question);
        setSession(prev => ({
          ...prev,
          ...response.data.session
        }));
        setTimeRemaining(response.data.time_remaining_seconds);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to navigate');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete session
  const completeSession = async () => {
    try {
      setLoading(true);
      
      const response = await completeQuizSession(sessionTokenRef.current);
      
      if (response.success) {
        stopTimer();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to complete quiz');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Abandon session
  const abandonSession = async () => {
    try {
      setLoading(true);
      
      const response = await abandonQuizSession(sessionTokenRef.current);
      
      if (response.success) {
        stopTimer();
        resetSession();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to abandon quiz');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Timer management
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time expires
          handleTimeExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeExpiry = async () => {
    try {
      await completeSession();
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  // Reset session state
  const resetSession = () => {
    setSession(null);
    setCurrentQuestion(null);
    setTimeRemaining(0);
    setError(null);
    sessionTokenRef.current = null;
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && session) {
        // Save current state to AsyncStorage for recovery
        saveSessionState();
      } else if (nextAppState === 'active' && session) {
        // Refresh session when app becomes active
        refreshSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      stopTimer();
    };
  }, [session]);

  // Save session state for recovery
  const saveSessionState = async () => {
    try {
      const stateToSave = {
        sessionToken: sessionTokenRef.current,
        timeRemaining,
        session,
        currentQuestion,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem('quiz_session_state', JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save session state:', err);
    }
  };

  // Refresh session from server
  const refreshSession = async () => {
    try {
      if (sessionTokenRef.current) {
        const response = await getQuizSession(sessionTokenRef.current);
        
        if (response.success) {
          setSession(response.data.session);
          setCurrentQuestion(response.data.current_question);
          setTimeRemaining(response.data.time_remaining_seconds);
        }
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    session,
    currentQuestion,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    loading,
    error,
    startSession,
    submitAnswer,
    goToNext,
    goToPrevious,
    completeSession,
    abandonSession,
    refreshSession,
    resetSession
  };
};
```

### 2. Quiz Screen Component

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
  StyleSheet
} from 'react-native';
import { useQuizSession } from './useQuizSession';

const QuizScreen = ({ route, navigation }) => {
  const { classId, quizId } = route.params;
  const {
    session,
    currentQuestion,
    timeRemaining,
    formattedTime,
    loading,
    error,
    startSession,
    submitAnswer,
    goToNext,
    goToPrevious,
    completeSession,
    abandonSession
  } = useQuizSession();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    initializeQuiz();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const initializeQuiz = async () => {
    try {
      await startSession(classId, quizId);
    } catch (err) {
      Alert.alert('Error', 'Failed to start quiz. Please try again.');
      navigation.goBack();
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      Alert.alert('Warning', 'Please select an answer before proceeding.');
      return;
    }

    try {
      await submitAnswer(currentQuestion.id, selectedAnswer);
      
      // Store answer locally
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer
      }));
      
      setSelectedAnswer(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    }
  };

  const handleNext = async () => {
    try {
      await goToNext();
      
      // Load previously selected answer if exists
      if (answers[currentQuestion?.id]) {
        setSelectedAnswer(answers[currentQuestion.id]);
      } else {
        setSelectedAnswer(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to navigate. Please try again.');
    }
  };

  const handlePrevious = async () => {
    try {
      await goToPrevious();
      
      // Load previously selected answer if exists
      if (answers[currentQuestion?.id]) {
        setSelectedAnswer(answers[currentQuestion.id]);
      } else {
        setSelectedAnswer(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to navigate. Please try again.');
    }
  };

  const handleCompleteQuiz = () => {
    Alert.alert(
      'Complete Quiz',
      'Are you sure you want to submit your quiz? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitQuiz }
      ]
    );
  };

  const submitQuiz = async () => {
    try {
      const result = await completeSession();
      
      navigation.replace('QuizResults', {
        results: result,
        sessionToken: session.session_token
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: handleAbandon }
      ]
    );
  };

  const handleAbandon = async () => {
    try {
      await abandonSession();
      navigation.goBack();
    } catch (err) {
      navigation.goBack();
    }
  };

  if (loading && !session) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  if (error && !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{session?.quiz?.quiz_name}</Text>
        <Text style={styles.timer}>Time: {formattedTime}</Text>
        <Text style={styles.progress}>
          Question {session?.current_question_index + 1} of {session?.total_questions}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion?.question_text}
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                selectedAnswer === option && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(option)}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, session?.current_question_index === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={session?.current_question_index === 0 || loading}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitAnswer}
          disabled={!selectedAnswer || loading}
        >
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>

        {session?.current_question_index < session?.total_questions - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteQuiz}
            disabled={loading}
          >
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  timer: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  progress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  option: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: '#dee2e6',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default QuizScreen;
```

---

## State Management

### Using Redux Toolkit

```javascript
// quizSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const startQuizSessionAsync = createAsyncThunk(
  'quiz/startSession',
  async ({ classId, quizId }, { rejectWithValue }) => {
    try {
      const response = await startQuizSession(classId, quizId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitAnswerAsync = createAsyncThunk(
  'quiz/submitAnswer',
  async ({ sessionToken, questionId, answer }, { rejectWithValue }) => {
    try {
      const response = await submitQuizAnswer(sessionToken, questionId, answer);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    session: null,
    currentQuestion: null,
    answers: {},
    timeRemaining: 0,
    loading: false,
    error: null,
    sessionHistory: []
  },
  reducers: {
    setSelectedAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
    },
    decrementTimer: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    resetQuizState: (state) => {
      state.session = null;
      state.currentQuestion = null;
      state.answers = {};
      state.timeRemaining = 0;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startQuizSessionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startQuizSessionAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.currentQuestion = action.payload.current_question;
        state.timeRemaining = action.payload.time_remaining_seconds;
      })
      .addCase(startQuizSessionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setSelectedAnswer,
  decrementTimer,
  resetQuizState,
  setError
} = quizSlice.actions;

export default quizSlice.reducer;
```

---

## Error Handling

### Common Error Scenarios

1. **Network Connectivity Issues**
2. **Session Expiry**
3. **Invalid Session Token**
4. **Server Errors**
5. **Authentication Failures**

### Error Handler Implementation

```javascript
// errorHandler.js
export const handleQuizError = (error, context) => {
  console.error(`Quiz Error [${context}]:`, error);

  switch (error.code) {
    case 'SESSION_EXPIRED':
      return {
        title: 'Session Expired',
        message: 'Your quiz session has expired. Please start again.',
        action: 'restart'
      };
    
    case 'INVALID_SESSION':
      return {
        title: 'Invalid Session',
        message: 'Your session is no longer valid. Please start a new quiz.',
        action: 'restart'
      };
    
    case 'NETWORK_ERROR':
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        action: 'retry'
      };
    
    case 'QUIZ_COMPLETED':
      return {
        title: 'Quiz Already Completed',
        message: 'This quiz has already been submitted.',
        action: 'navigate_results'
      };
    
    default:
      return {
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.',
        action: 'retry'
      };
  }
};

// Retry mechanism
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};
```

---

## Real-time Features

### WebSocket Integration

```javascript
// quizWebSocket.js
import { useEffect, useRef } from 'react';

export const useQuizWebSocket = (sessionToken, onSessionUpdate) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (sessionToken) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [sessionToken]);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(`${WS_URL}/quiz-session/${sessionToken}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        attemptReconnect();
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      setTimeout(() => {
        connectWebSocket();
      }, 1000 * reconnectAttempts.current);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'SESSION_UPDATE':
        onSessionUpdate(data.payload);
        break;
      
      case 'TIME_WARNING':
        // Show time warning notification
        showTimeWarning(data.payload.minutes_remaining);
        break;
      
      case 'FORCE_SUBMIT':
        // Force submit quiz due to admin action
        handleForceSubmit();
        break;
      
      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  const sendMessage = (type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  };

  return {
    sendMessage,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};
```

### Background Sync

```javascript
// backgroundSync.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

export class QuizBackgroundSync {
  constructor() {
    this.pendingActions = [];
    this.isOnline = true;
    
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      if (wasOffline && this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  async addPendingAction(action) {
    this.pendingActions.push({
      ...action,
      timestamp: Date.now(),
      id: generateUniqueId()
    });
    
    await this.savePendingActions();
    
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  async syncPendingActions() {
    const actions = [...this.pendingActions];
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
        this.removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
        // Action remains in pending list
      }
    }
    
    await this.savePendingActions();
  }

  async executeAction(action) {
    switch (action.type) {
      case 'SUBMIT_ANSWER':
        return await submitQuizAnswer(
          action.sessionToken,
          action.questionId,
          action.answer
        );
      
      case 'COMPLETE_SESSION':
        return await completeQuizSession(action.sessionToken);
      
      case 'ABANDON_SESSION':
        return await abandonQuizSession(action.sessionToken);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  removePendingAction(actionId) {
    this.pendingActions = this.pendingActions.filter(
      action => action.id !== actionId
    );
  }

  async savePendingActions() {
    try {
      await AsyncStorage.setItem(
        'quiz_pending_actions',
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  }

  async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem('quiz_pending_actions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }
}
```

---

## Best Practices

### 1. Session Management

- **Always validate session token** before making API calls
- **Implement automatic session refresh** when app becomes active
- **Handle session expiry gracefully** with appropriate user feedback
- **Store minimal session data locally** for recovery

### 2. Performance Optimization

- **Debounce answer submissions** to prevent rapid API calls
- **Cache quiz questions** to reduce server load
- **Implement progressive loading** for large quizzes
- **Use image optimization** for question media

### 3. User Experience

- **Provide clear visual feedback** for all actions
- **Show loading states** during API operations
- **Implement auto-save** for user answers
- **Display time warnings** before quiz expiry

### 4. Error Recovery

- **Implement retry mechanisms** for failed requests
- **Provide offline support** with background sync
- **Show helpful error messages** with actionable suggestions
- **Log errors** for debugging and monitoring

### 5. Security

- **Validate all user inputs** before submission
- **Implement request timeouts** to prevent hanging requests
- **Use secure storage** for sensitive session data
- **Implement proper authentication** checks

---

## Testing

### Unit Tests

```javascript
// quizSession.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useQuizSession } from '../useQuizSession';

describe('useQuizSession', () => {
  test('should start session successfully', async () => {
    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startSession('class123', 'quiz456');
    });

    expect(result.current.session).toBeDefined();
    expect(result.current.currentQuestion).toBeDefined();
    expect(result.current.timeRemaining).toBeGreaterThan(0);
  });

  test('should submit answer correctly', async () => {
    const { result } = renderHook(() => useQuizSession());

    // First start session
    await act(async () => {
      await result.current.startSession('class123', 'quiz456');
    });

    // Then submit answer
    await act(async () => {
      await result.current.submitAnswer('question1', 'option1');
    });

    expect(result.current.session.answers_submitted).toContain('option1');
  });

  test('should handle session expiry', async () => {
    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startSession('class123', 'quiz456');
    });

    // Simulate time expiry
    act(() => {
      result.current.setTimeRemaining(0);
    });

    // Session should be automatically completed
    expect(result.current.session.status).toBe('COMPLETED');
  });
});
```

### Integration Tests

```javascript
// quizFlow.test.js
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuizScreen from '../QuizScreen';

describe('QuizScreen Integration', () => {
  test('complete quiz flow', async () => {
    const mockRoute = {
      params: { classId: 'class123', quizId: 'quiz456' }
    };
    const mockNavigation = { goBack: jest.fn(), replace: jest.fn() };

    const { getByText, getByTestId } = render(
      <QuizScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Wait for quiz to load
    await waitFor(() => {
      expect(getByText('Math Quiz - Chapter 5')).toBeTruthy();
    });

    // Select an answer
    fireEvent.press(getByText('Option 1'));

    // Submit answer
    fireEvent.press(getByText('Submit Answer'));

    // Navigate to next question
    fireEvent.press(getByText('Next'));

    // Complete quiz
    fireEvent.press(getByText('Complete'));

    // Confirm completion
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('QuizResults', expect.any(Object));
    });
  });
});
```

---

## Monitoring and Analytics

### Performance Metrics

```javascript
// quizAnalytics.js
export class QuizAnalytics {
  static trackSessionStart(classId, quizId, timestamp) {
    // Track when quiz session starts
    analytics.track('Quiz Session Started', {
      classId,
      quizId,
      timestamp,
      platform: 'react-native'
    });
  }

  static trackAnswerSubmission(questionId, timeTaken, isCorrect) {
    // Track answer submission with timing
    analytics.track('Answer Submitted', {
      questionId,
      timeTaken,
      isCorrect,
      timestamp: Date.now()
    });
  }

  static trackSessionCompletion(score, totalQuestions, timeTaken) {
    // Track quiz completion
    analytics.track('Quiz Session Completed', {
      score,
      totalQuestions,
      percentage: (score / totalQuestions) * 100,
      timeTaken,
      timestamp: Date.now()
    });
  }

  static trackError(errorType, errorMessage, context) {
    // Track errors for debugging
    analytics.track('Quiz Error', {
      errorType,
      errorMessage,
      context,
      timestamp: Date.now()
    });
  }

  static trackPerformance(metric, value) {
    // Track performance metrics
    analytics.track('Quiz Performance', {
      metric,
      value,
      timestamp: Date.now()
    });
  }
}
```

---

This comprehensive documentation provides everything needed to integrate the Class Quiz Session Management API with React Native applications, including complete code examples, best practices, and testing strategies.
