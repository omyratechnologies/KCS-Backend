# Reminder API Documentation

## Overview

The Reminder API provides a comprehensive system for users to create, manage, and receive push notifications for personal reminders. The system supports one-time, daily, and weekly recurring reminders with automatic push notification delivery.

---

## Features

✅ **Create Personal Reminders** - Set reminders with title, note, date, and time
✅ **Recurring Reminders** - Support for one-time, daily, and weekly frequencies
✅ **Push Notifications** - Automatic Firebase push notifications at scheduled time
✅ **Date Range Filtering** - Filter reminders by date range
✅ **Reminder Statistics** - View statistics about your reminders
✅ **Automatic Scheduling** - Background scheduler processes reminders every minute
✅ **Smart Rescheduling** - Recurring reminders automatically schedule next occurrence

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [Create Reminder](#1-create-reminder)
   - [Get All Reminders](#2-get-all-reminders)
   - [Get Reminder by ID](#3-get-reminder-by-id)
   - [Update Reminder](#4-update-reminder)
   - [Delete Reminder](#5-delete-reminder)
   - [Get Reminder Statistics](#6-get-reminder-statistics)
   - [Admin: Process Pending Reminders](#7-admin-process-pending-reminders)
   - [Admin: Cleanup Old Reminders](#8-admin-cleanup-old-reminders)
3. [Data Models](#data-models)
4. [Frequency Types](#frequency-types)
5. [Push Notification Integration](#push-notification-integration)
6. [Frontend Integration Guide](#frontend-integration-guide)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Authentication

All reminder endpoints require authentication using JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Create Reminder

Create a new personal reminder.

**Endpoint:** `POST /api/reminders`

**Request Body:**
```json
{
  "title": "Submit Assignment",
  "note": "Remember to submit the math assignment before 5 PM",
  "reminder_date": "2025-02-15",
  "reminder_time": "14:30",
  "frequency": "one_time",
  "is_am": false
}
```

**Field Descriptions:**
- `title` (required) - Reminder title (1-200 characters)
- `note` (optional) - Additional notes (max 1000 characters)
- `reminder_date` (required) - Date in YYYY-MM-DD format
- `reminder_time` (required) - Time in HH:mm format (24-hour, e.g., 14:30 for 2:30 PM)
- `frequency` (required) - `"one_time"`, `"daily"`, or `"weekly"`
- `is_am` (optional) - For UI display: true for AM, false for PM

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "id": "reminder_abc123",
    "user_id": "user_123",
    "campus_id": "campus_123",
    "title": "Submit Assignment",
    "note": "Remember to submit the math assignment before 5 PM",
    "reminder_date": "2025-02-15T00:00:00.000Z",
    "reminder_time": "14:30",
    "reminder_datetime": "2025-02-15T14:30:00.000Z",
    "frequency": "one_time",
    "is_am": false,
    "is_active": true,
    "is_sent": false,
    "created_at": "2025-11-07T10:30:00.000Z",
    "updated_at": "2025-11-07T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST https://api.yourdomain.com/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Submit Assignment",
    "note": "Remember to submit the math assignment before 5 PM",
    "reminder_date": "2025-02-15",
    "reminder_time": "14:30",
    "frequency": "one_time",
    "is_am": false
  }'
```

---

### 2. Get All Reminders

Retrieve all reminders for the authenticated user with optional filters.

**Endpoint:** `GET /api/reminders`

**Query Parameters:**
- `is_active` (optional) - Filter by active status (`true` or `false`)
- `frequency` (optional) - Filter by frequency (`one_time`, `daily`, `weekly`)
- `from_date` (optional) - Filter reminders from this date (YYYY-MM-DD)
- `to_date` (optional) - Filter reminders up to this date (YYYY-MM-DD)

**Examples:**

Get all active reminders:
```
GET /api/reminders?is_active=true
```

Get daily reminders:
```
GET /api/reminders?frequency=daily
```

Get reminders in February 2025:
```
GET /api/reminders?from_date=2025-02-01&to_date=2025-02-28
```

Get all reminders in date range:
```
GET /api/reminders?from_date=2025-02-15&to_date=2025-03-15
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reminder_abc123",
      "user_id": "user_123",
      "campus_id": "campus_123",
      "title": "Submit Assignment",
      "note": "Remember to submit the math assignment before 5 PM",
      "reminder_date": "2025-02-15T00:00:00.000Z",
      "reminder_time": "14:30",
      "reminder_datetime": "2025-02-15T14:30:00.000Z",
      "frequency": "one_time",
      "is_am": false,
      "is_active": true,
      "is_sent": false,
      "created_at": "2025-11-07T10:30:00.000Z",
      "updated_at": "2025-11-07T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

**cURL Example:**
```bash
# Get reminders in a date range
curl -X GET "https://api.yourdomain.com/api/reminders?from_date=2025-02-01&to_date=2025-02-28" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Reminder by ID

Retrieve a specific reminder by its ID.

**Endpoint:** `GET /api/reminders/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "reminder_abc123",
    "user_id": "user_123",
    "campus_id": "campus_123",
    "title": "Submit Assignment",
    "note": "Remember to submit the math assignment before 5 PM",
    "reminder_date": "2025-02-15T00:00:00.000Z",
    "reminder_time": "14:30",
    "reminder_datetime": "2025-02-15T14:30:00.000Z",
    "frequency": "one_time",
    "is_am": false,
    "is_active": true,
    "is_sent": false,
    "created_at": "2025-11-07T10:30:00.000Z",
    "updated_at": "2025-11-07T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET https://api.yourdomain.com/api/reminders/reminder_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update Reminder

Update an existing reminder. All fields are optional.

**Endpoint:** `PUT /api/reminders/:id`

**Request Body:**
```json
{
  "title": "Updated: Submit Assignment",
  "note": "Updated note",
  "reminder_date": "2025-02-20",
  "reminder_time": "15:00",
  "frequency": "daily",
  "is_active": true,
  "is_am": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reminder updated successfully",
  "data": {
    "id": "reminder_abc123",
    "user_id": "user_123",
    "campus_id": "campus_123",
    "title": "Updated: Submit Assignment",
    "note": "Updated note",
    "reminder_date": "2025-02-20T00:00:00.000Z",
    "reminder_time": "15:00",
    "reminder_datetime": "2025-02-20T15:00:00.000Z",
    "frequency": "daily",
    "is_am": true,
    "is_active": true,
    "is_sent": false,
    "created_at": "2025-11-07T10:30:00.000Z",
    "updated_at": "2025-11-07T12:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT https://api.yourdomain.com/api/reminders/reminder_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Submit Assignment",
    "reminder_date": "2025-02-20",
    "reminder_time": "15:00"
  }'
```

---

### 5. Delete Reminder

Delete (deactivate) a reminder.

**Endpoint:** `DELETE /api/reminders/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reminder deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE https://api.yourdomain.com/api/reminders/reminder_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. Get Reminder Statistics

Get statistics about user's reminders.

**Endpoint:** `GET /api/reminders/stats`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "active": 10,
    "pending": 5,
    "completed": 5,
    "by_frequency": {
      "one_time": 8,
      "daily": 5,
      "weekly": 2
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET https://api.yourdomain.com/api/reminders/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 7. Admin: Process Pending Reminders

Manually trigger processing of pending reminders (Admin only).

**Endpoint:** `POST /api/reminders/admin/process`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Processed 5 pending reminders",
  "data": {
    "processed": 5,
    "successful": 4,
    "failed": 1
  }
}
```

**cURL Example:**
```bash
curl -X POST https://api.yourdomain.com/api/reminders/admin/process \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

### 8. Admin: Cleanup Old Reminders

Clean up old completed reminders (Admin only).

**Endpoint:** `POST /api/reminders/admin/cleanup`

**Query Parameters:**
- `older_than_days` (optional) - Remove reminders older than this many days (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cleaned up 10 old reminders",
  "data": {
    "cleaned": 10
  }
}
```

**cURL Example:**
```bash
curl -X POST "https://api.yourdomain.com/api/reminders/admin/cleanup?older_than_days=60" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Data Models

### Reminder Object

```typescript
{
  id: string;                    // Unique identifier
  user_id: string;               // User who owns the reminder
  campus_id: string;             // Campus ID
  title: string;                 // Reminder title (1-200 chars)
  note?: string;                 // Optional note (max 1000 chars)
  reminder_date: Date;           // Date of reminder
  reminder_time: string;         // Time in HH:mm format (24-hour)
  reminder_datetime: Date;       // Combined date+time for querying
  frequency: "one_time" | "daily" | "weekly";
  is_am?: boolean;               // For UI: true=AM, false=PM
  is_active: boolean;            // Active status
  is_sent: boolean;              // Whether notification was sent
  sent_at?: Date;                // When notification was sent
  notification_id?: string;      // Reference to sent notification
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Last update timestamp
}
```

---

## Frequency Types

### One-Time Reminder
- Triggers once at the specified date and time
- Automatically marked as sent after notification
- Can be cleaned up after 30 days

### Daily Reminder
- Repeats every day at the same time
- Automatically reschedules for next day after sending
- Remains active until user deactivates

### Weekly Reminder
- Repeats every 7 days at the same time
- Automatically reschedules for next week after sending
- Remains active until user deactivates

---

## Push Notification Integration

### How It Works

1. **Background Scheduler** - Runs every minute checking for pending reminders
2. **5-Minute Window** - Reminders due within next 5 minutes are processed
3. **Push Notification** - Firebase sends notification to user's devices
4. **Auto-Rescheduling** - Recurring reminders schedule next occurrence

### Notification Payload

```json
{
  "title": "🔔 Reminder: Submit Assignment",
  "message": "Remember to submit the math assignment before 5 PM",
  "data": {
    "reminder_id": "reminder_abc123",
    "type": "reminder",
    "frequency": "one_time"
  }
}
```

### Device Requirements

Users must have:
1. Registered device token via `/api/push-notification/register-token`
2. Firebase Cloud Messaging enabled on their device
3. Notification permissions granted

---

## Frontend Integration Guide

### 1. Calendar UI for Date Selection

The calendar UI should allow users to:
- Select a single date for creating a reminder
- View multiple months (February and March) for easy navigation
- Highlight selected date
- Show date ranges when filtering reminders

**Example: Date Range Filter**
```typescript
// Get reminders in February 2025
const response = await fetch(
  '/api/reminders?from_date=2025-02-01&to_date=2025-02-28',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### 2. Time Selection

**Converting 12-hour to 24-hour format:**
```typescript
function convertTo24Hour(time12h: string, isAM: boolean): string {
  const [hours, minutes] = time12h.split(':');
  let hour24 = parseInt(hours);
  
  if (!isAM && hour24 !== 12) {
    hour24 += 12;
  } else if (isAM && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

// Example: 2:30 PM -> 14:30
const time24h = convertTo24Hour('02:30', false); // "14:30"
```

### 3. Creating a Reminder

```typescript
async function createReminder(data: {
  title: string;
  note?: string;
  date: string;      // YYYY-MM-DD from calendar
  time: string;      // HH:mm (24-hour)
  frequency: 'one_time' | 'daily' | 'weekly';
  isAM: boolean;
}) {
  const response = await fetch('/api/reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: data.title,
      note: data.note,
      reminder_date: data.date,
      reminder_time: data.time,
      frequency: data.frequency,
      is_am: data.isAM
    })
  });
  
  return response.json();
}
```

### 4. Filtering Reminders by Date Range

```typescript
async function getRemindersInRange(fromDate: string, toDate: string) {
  const params = new URLSearchParams({
    from_date: fromDate,
    to_date: toDate,
    is_active: 'true'
  });
  
  const response = await fetch(`/api/reminders?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}

// Example: Get all reminders in February 2025
const reminders = await getRemindersInRange('2025-02-01', '2025-02-28');
```

### 5. Display Reminders on Calendar

```typescript
// Group reminders by date for calendar display
function groupRemindersByDate(reminders: Reminder[]) {
  return reminders.reduce((acc, reminder) => {
    const date = new Date(reminder.reminder_date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(reminder);
    return acc;
  }, {} as Record<string, Reminder[]>);
}

// Highlight dates on calendar that have reminders
const groupedReminders = groupRemindersByDate(reminders);
// Use groupedReminders to add badges/dots on calendar dates
```

---

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Date:**
```json
{
  "success": false,
  "message": "Invalid date format. Use YYYY-MM-DD"
}
```

**400 Bad Request - Past Date:**
```json
{
  "success": false,
  "message": "Reminder time must be in the future"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Reminder not found"
}
```

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden (Admin endpoints):**
```json
{
  "success": false,
  "message": "Unauthorized. Admin access required."
}
```

---

## Best Practices

### 1. Date and Time Handling

✅ **Always validate dates are in the future**
```typescript
const reminderDate = new Date(date + 'T' + time);
if (reminderDate <= new Date()) {
  alert('Please select a future date and time');
  return;
}
```

✅ **Use ISO date format (YYYY-MM-DD)**
```typescript
const dateString = date.toISOString().split('T')[0]; // "2025-02-15"
```

✅ **Convert to 24-hour format for API**
```typescript
// UI shows 2:30 PM
// Send to API: "14:30"
```

### 2. User Experience

✅ **Show confirmation after creating reminder**
```typescript
const result = await createReminder(data);
if (result.success) {
  showNotification('Reminder created! You will be notified on ' + formatDate(result.data.reminder_datetime));
}
```

✅ **Allow users to view upcoming reminders**
```typescript
// Get reminders for next 7 days
const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const upcomingReminders = await getRemindersInRange(today, nextWeek);
```

✅ **Indicate recurring reminders clearly**
```typescript
function getReminderFrequencyLabel(frequency: string) {
  return {
    one_time: 'Once',
    daily: 'Daily',
    weekly: 'Weekly'
  }[frequency];
}
```

### 3. Performance

✅ **Cache reminders locally**
```typescript
// Fetch and cache
const reminders = await fetchReminders();
localStorage.setItem('reminders_cache', JSON.stringify(reminders));
```

✅ **Use date range filters to limit results**
```typescript
// Only fetch current month instead of all reminders
const monthReminders = await getRemindersInRange(
  firstDayOfMonth,
  lastDayOfMonth
);
```

---

## Testing

### Test Scenarios

1. **Create One-Time Reminder**
   - Create reminder for 5 minutes from now
   - Verify push notification is received
   - Verify reminder marked as sent

2. **Create Daily Reminder**
   - Create daily reminder
   - Verify notification sent
   - Check reminder rescheduled for next day

3. **Date Range Filtering**
   - Create reminders across multiple months
   - Filter by date range
   - Verify correct reminders returned

4. **Update Reminder**
   - Update time to future
   - Verify `is_sent` reset to false
   - Verify notification sent at new time

---

## Support

For issues or questions:
- Check server logs for scheduler status
- Verify Firebase configuration
- Ensure device tokens are registered
- Check reminder `is_active` and `is_sent` status

---

## Changelog

### Version 1.0 (November 2025)
- Initial release
- Support for one-time, daily, and weekly reminders
- Firebase push notification integration
- Date range filtering
- Automatic background scheduler
- Admin endpoints for management

---

**Last Updated:** November 7, 2025
