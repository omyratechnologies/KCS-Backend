# Event Media Gallery API Documentation

## Overview
The Event Media Gallery API allows teachers and administrators to upload, manage, and share event photos and videos with the campus community. This system provides controlled access where teachers and admins can upload media, admins can manage all content, and all authenticated users can view media from their campus.

## Base URL
```
/event-media
```

## Authentication
All endpoints require authentication via the `authMiddleware`. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Permissions

### Upload/Create
- **Teachers**: Can create event media galleries
- **Admins**: Can create event media galleries
- **Students/Parents**: Cannot create

### Update
- **Admins**: Can update any event media gallery
- **Teachers**: Can only update their own uploads
- **Students/Parents**: Cannot update

### Delete
- **Admins**: Can delete any event media gallery
- **Teachers**: Can only delete their own uploads
- **Students/Parents**: Cannot delete

### View
- **All authenticated users**: Can view event media galleries from their campus

---

## Endpoints

### 1. Create Event Media Gallery

Upload a new event media gallery entry.

**Endpoint:** `POST /event-media`

**Middleware:** `teacherOrAdminMiddleware()`

**Request Body:**
```json
{
  "title": "Annual Sports Day 2025",
  "description": "Highlights from our annual sports event",
  "date": "2025-10-15T00:00:00.000Z",
  "type": "img",
  "images": [
    "https://s3.amazonaws.com/bucket/sports_day_01.jpg",
    "https://s3.amazonaws.com/bucket/sports_day_02.jpg",
    "https://s3.amazonaws.com/bucket/sports_day_03.jpg"
  ]
}
```

**Request Fields:**
- `title` (string, **required**): Title of the event
- `description` (string, optional): Detailed description of the event
- `date` (ISO 8601 date string, **required**): Date of the event
- `type` (string, **required**): Media type - either `"img"` or `"video"`
- `images` (array of strings, **required**): Array of image/video URLs (must not be empty)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event media gallery created successfully",
  "data": {
    "id": "event_media_gallery::uuid",
    "title": "Annual Sports Day 2025",
    "description": "Highlights from our annual sports event",
    "date": "2025-10-15T00:00:00.000Z",
    "type": "img",
    "images": [
      "https://s3.amazonaws.com/bucket/sports_day_01.jpg",
      "https://s3.amazonaws.com/bucket/sports_day_02.jpg"
    ],
    "uploaded_by": "user::teacher123",
    "uploader_type": "Teacher",
    "campus_id": "campus::main",
    "is_deleted": false,
    "created_at": "2025-10-15T10:30:00.000Z",
    "updated_at": "2025-10-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

400 - Missing Required Fields:
```json
{
  "success": false,
  "error": "Title, date, type, and images are required"
}
```

400 - Invalid Type:
```json
{
  "success": false,
  "error": "Invalid type. Must be 'img' or 'video'"
}
```

400 - Empty Images Array:
```json
{
  "success": false,
  "error": "Images array is required and must not be empty"
}
```

400 - Invalid Date:
```json
{
  "success": false,
  "error": "Invalid date format"
}
```

403 - Unauthorized:
```json
{
  "success": false,
  "error": "Access denied. Only teachers and admins can access this resource."
}
```

**cURL Example:**
```bash
curl -X POST https://api.example.com/event-media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Annual Sports Day 2025",
    "description": "Highlights from our annual sports event",
    "date": "2025-10-15T00:00:00.000Z",
    "type": "img",
    "images": [
      "https://s3.amazonaws.com/bucket/sports_day_01.jpg",
      "https://s3.amazonaws.com/bucket/sports_day_02.jpg"
    ]
  }'
```

---

### 2. Get Event Media Galleries (List)

Retrieve a paginated list of event media galleries from the user's campus.

**Endpoint:** `GET /event-media`

**Query Parameters:**
- `type` (string, optional): Filter by media type - `"img"` or `"video"`
- `start_date` (ISO 8601 date string, optional): Filter events from this date onwards
- `end_date` (ISO 8601 date string, optional): Filter events up to this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 20): Number of items per page

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_media_gallery::uuid1",
      "title": "Annual Sports Day 2025",
      "description": "Highlights from our annual sports event",
      "date": "2025-10-15T00:00:00.000Z",
      "type": "img",
      "images": [
        "https://s3.amazonaws.com/bucket/sports_day_01.jpg",
        "https://s3.amazonaws.com/bucket/sports_day_02.jpg"
      ],
      "uploaded_by": "user::teacher123",
      "uploader_type": "Teacher",
      "campus_id": "campus::main",
      "created_at": "2025-10-15T10:30:00.000Z",
      "updated_at": "2025-10-15T10:30:00.000Z"
    },
    {
      "id": "event_media_gallery::uuid2",
      "title": "Science Fair 2025",
      "date": "2025-10-10T00:00:00.000Z",
      "type": "video",
      "images": [
        "https://s3.amazonaws.com/bucket/science_fair.mp4"
      ],
      "uploaded_by": "user::admin456",
      "uploader_type": "Admin",
      "campus_id": "campus::main",
      "created_at": "2025-10-11T09:00:00.000Z",
      "updated_at": "2025-10-11T09:00:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

**cURL Examples:**

Get all event media:
```bash
curl -X GET "https://api.example.com/event-media" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Filter by type (images only):
```bash
curl -X GET "https://api.example.com/event-media?type=img" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Filter by date range:
```bash
curl -X GET "https://api.example.com/event-media?start_date=2025-10-01&end_date=2025-10-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

With pagination:
```bash
curl -X GET "https://api.example.com/event-media?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Event Media Gallery by ID

Retrieve a single event media gallery by its ID.

**Endpoint:** `GET /event-media/:id`

**URL Parameters:**
- `id` (string, required): The event media gallery ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "event_media_gallery::uuid",
    "title": "Annual Sports Day 2025",
    "description": "Highlights from our annual sports event",
    "date": "2025-10-15T00:00:00.000Z",
    "type": "img",
    "images": [
      "https://s3.amazonaws.com/bucket/sports_day_01.jpg",
      "https://s3.amazonaws.com/bucket/sports_day_02.jpg"
    ],
    "uploaded_by": "user::teacher123",
    "uploader_type": "Teacher",
    "campus_id": "campus::main",
    "is_deleted": false,
    "created_at": "2025-10-15T10:30:00.000Z",
    "updated_at": "2025-10-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Event media gallery not found"
}
```

**cURL Example:**
```bash
curl -X GET "https://api.example.com/event-media/event_media_gallery::uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update Event Media Gallery

Update an existing event media gallery. Admins can update any gallery, teachers can only update their own uploads.

**Endpoint:** `PUT /event-media/:id`

**Middleware:** `teacherOrAdminMiddleware()`

**URL Parameters:**
- `id` (string, required): The event media gallery ID

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "date": "2025-10-16T00:00:00.000Z",
  "type": "video",
  "images": [
    "https://s3.amazonaws.com/bucket/new_video.mp4"
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event media gallery updated successfully",
  "data": {
    "id": "event_media_gallery::uuid",
    "title": "Updated Event Title",
    "description": "Updated description",
    "date": "2025-10-16T00:00:00.000Z",
    "type": "video",
    "images": [
      "https://s3.amazonaws.com/bucket/new_video.mp4"
    ],
    "uploaded_by": "user::teacher123",
    "uploader_type": "Teacher",
    "campus_id": "campus::main",
    "created_at": "2025-10-15T10:30:00.000Z",
    "updated_at": "2025-10-15T11:45:00.000Z"
  }
}
```

**Error Responses:**

404 - Not Found:
```json
{
  "success": false,
  "error": "Event media gallery not found"
}
```

403 - Permission Denied:
```json
{
  "success": false,
  "error": "You do not have permission to update this event media gallery"
}
```

400 - Invalid Type:
```json
{
  "success": false,
  "error": "Invalid type. Must be 'img' or 'video'"
}
```

400 - Invalid Date:
```json
{
  "success": false,
  "error": "Invalid date format"
}
```

**cURL Example:**
```bash
curl -X PUT "https://api.example.com/event-media/event_media_gallery::uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Event Title",
    "description": "Updated description"
  }'
```

---

### 5. Delete Event Media Gallery

Permanently delete an event media gallery. Admins can delete any gallery, teachers can only delete their own uploads.

**Endpoint:** `DELETE /event-media/:id`

**Middleware:** `teacherOrAdminMiddleware()`

**URL Parameters:**
- `id` (string, required): The event media gallery ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event media gallery deleted successfully"
}
```

**Error Responses:**

404 - Not Found:
```json
{
  "success": false,
  "error": "Event media gallery not found"
}
```

403 - Permission Denied:
```json
{
  "success": false,
  "error": "You do not have permission to delete this event media gallery"
}
```

**cURL Example:**
```bash
curl -X DELETE "https://api.example.com/event-media/event_media_gallery::uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Models

### EventMediaGallery Model

```typescript
interface IEventMediaGallery {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: "img" | "video";
  images: string[];
  uploaded_by: string;
  uploader_type: "Teacher" | "Admin" | "Super Admin";
  campus_id: string;
  created_at: Date;
  updated_at: Date;
}
```

---

## Common Use Cases

### 1. Upload Event Photos (Teacher)
A teacher uploads photos from a school event:

```javascript
const eventData = {
  title: "Science Fair 2025",
  description: "Students showcasing their innovative projects",
  date: "2025-10-10T00:00:00.000Z",
  type: "img",
  images: [
    "https://s3.example.com/science-fair-1.jpg",
    "https://s3.example.com/science-fair-2.jpg",
    "https://s3.example.com/science-fair-3.jpg"
  ]
};

const response = await fetch('/event-media', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(eventData)
});
```

### 2. View Recent Events (Student/Parent)
A student or parent views recent event galleries:

```javascript
const response = await fetch('/event-media?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data, total } = await response.json();
```

### 3. Update Event Details (Admin)
An admin updates event details:

```javascript
const updates = {
  title: "Annual Science Fair 2025 - Updated",
  description: "Featuring 50+ innovative student projects"
};

const response = await fetch('/event-media/event_media_gallery::uuid', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
});
```

### 4. Filter Event Media
Get only video content from October 2025:

```javascript
const params = new URLSearchParams({
  type: 'video',
  start_date: '2025-10-01T00:00:00.000Z',
  end_date: '2025-10-31T23:59:59.000Z'
});

const response = await fetch(`/event-media?${params}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "message": "Optional detailed error information"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Best Practices

1. **File Upload Flow**:
   - First upload files using the `/upload` endpoint to get the file URLs
   - Then create the event media gallery with the returned URLs in the images array

2. **Image Optimization**:
   - Compress and optimize images before uploading
   - Use appropriate file formats (JPEG for photos, MP4 for videos)
   - Consider generating thumbnails on the client or server side

3. **Date Handling**:
   - Always use ISO 8601 format for dates
   - Convert to user's timezone on the client side

4. **Pagination**:
   - Use reasonable page sizes (10-50 items)
   - Display total count for user reference

5. **Permissions**:
   - Check user permissions on the client side before showing edit/delete buttons
   - Always validate permissions on the server side

---

## Testing Guide

### Test Cases

1. **Create Event Media**:
   - ✓ As teacher, create with all required fields
   - ✓ As admin, create with all required fields
   - ✗ As student, attempt to create (should fail with 403)
   - ✗ Create without title (should fail with 400)
   - ✗ Create with invalid type (should fail with 400)
   - ✗ Create with empty images array (should fail with 400)

2. **Get Event Media**:
   - ✓ Get all events from campus
   - ✓ Filter by type (img/video)
   - ✓ Filter by date range
   - ✓ Pagination works correctly

3. **Update Event Media**:
   - ✓ Teacher updates own upload
   - ✓ Admin updates any upload
   - ✗ Teacher attempts to update another teacher's upload (should fail with 403)
   - ✗ Student attempts to update (should fail with 403)

4. **Delete Event Media**:
   - ✓ Teacher deletes own upload
   - ✓ Admin deletes any upload
   - ✗ Teacher attempts to delete another teacher's upload (should fail with 403)
   - ✗ Student attempts to delete (should fail with 403)

---

## Changelog

### Version 1.0.0 (October 15, 2025)
- Initial release
- Create, read, update, delete event media galleries
- Permission-based access control
- Campus-based filtering
- Date and type filtering
- Pagination support
