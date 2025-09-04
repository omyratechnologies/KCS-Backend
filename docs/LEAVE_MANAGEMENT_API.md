# Leave Management System

This document describes the Leave Management APIs implemented for the KCS Backend system.

## Features

- **Complete Leave Management**: Students and Teachers can apply for leave, view their requests, and check balances
- **Admin Dashboard**: Admins can view all leave requests, approve/reject them, and manage leave types
- **Multiple Leave Types**: Support for Sick Leave, Casual Leave, Personal Leave, Annual Leave, etc.
- **Leave Balances**: Track allocated, used, and available leave days per user per year
- **Analytics**: Dashboard with leave statistics and insights
- **Role-based Access**: Different permissions for Admin, Teachers, and Students

## API Endpoints

### Authentication
All endpoints require authentication. Use the existing auth middleware.

### Admin Endpoints

#### Initialize Leave System
```
POST /leave/admin/initialize
```
Sets up default leave types for a campus. Should be called once per campus.

#### Get All Leave Requests
```
GET /leave/admin/requests
Query Parameters:
- user_type: Student|Teacher (optional)
- status: Pending|Approved|Rejected|Cancelled (optional)
- leave_type: leave_type_id (optional)
- from_date: YYYY-MM-DD (optional)
- to_date: YYYY-MM-DD (optional)
- page: number (optional, default 1)
- limit: number (optional, default 20)
- search: string (optional)
```

#### Get Leave Analytics
```
GET /leave/admin/analytics
Query Parameters:
- period: week|month|quarter|year (optional)
```

#### Approve Leave Request
```
POST /leave/admin/requests/:request_id/approve
```

#### Reject Leave Request
```
POST /leave/admin/requests/:request_id/reject
Body: {
  "rejection_reason": "string"
}
```

#### Bulk Approve Requests
```
POST /leave/admin/requests/bulk-approve
Body: {
  "request_ids": ["id1", "id2", "id3"]
}
```

#### Manage Leave Types
```
POST /leave/admin/types           # Create leave type
PUT /leave/admin/types/:id        # Update leave type
DELETE /leave/admin/types/:id     # Hard delete leave type (with safety checks)
GET /leave/types                  # Get all leave types (public)
GET /leave/types/:id              # Get specific leave type by ID (public)
```

#### Get Leave Type by ID
```
GET /leave/types/:leave_type_id
```
**Description:** Retrieve a specific leave type by its ID.

**Response Examples:**

*Successful Response:*
```json
{
  "success": true,
  "data": {
    "_type": "leave_types",
    "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
    "carry_forward_allowed": true,
    "color": "#ef4444",
    "created_at": "2025-08-18T09:18:11.614Z",
    "default_allocation": 8,
    "description": "Medical emergencies",
    "icon": "🤒",
    "id": "cca92992-8763-42cf-91b4-de695c1b700b",
    "is_active": true,
    "max_carry_forward": 10,
    "name": "Sick Leave",
    "requires_approval": true,
    "updated_at": "2025-08-18T09:18:11.614Z"
  }
}
```

*Not Found Response:*
```json
{
  "success": false,
  "error": "document not found"
}
```

#### Hard Delete Leave Type
```
DELETE /leave/admin/types/:leave_type_id
```
**Safety Features:**
- Only deletes leave types with NO historical usage (no approved/rejected requests ever)
- Only deletes leave types with NO pending requests
- Automatically cleans up unused leave balance records
- Admin-only access with proper authentication

**Response Examples:**

*Protected Leave Type (has usage):*
```json
{
  "success": false,
  "message": "Cannot delete leave type as it has pending requests or historical usage",
  "data": {
    "pending_requests": 1,
    "total_requests": 2
  }
}
```

*Successful Deletion:*
```json
{
  "success": true,
  "message": "Leave type deleted successfully",
  "data": {
    "deleted_at": "2025-09-04T04:49:42.831Z",
    "message": "Leave type 'Test Type' has been permanently deleted along with 0 unused balance record(s)."
  }
}
```

### Student/Teacher Endpoints

#### Apply for Leave
```
POST /leave/apply
Body: {
  "leave_type_id": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD", 
  "reason": "string (min 10 chars)",
  "priority": "Normal|Urgent|Emergency",
  "supporting_documents": ["url1", "url2"] // optional
}
```

#### Get My Leave Requests
```
GET /leave/my-requests
Query Parameters:
- status: Pending|Approved|Rejected|Cancelled (optional)
- page: number (optional)
- limit: number (optional)
```

#### Get My Leave Balances
```
GET /leave/my-balances
Query Parameters:
- year: number (optional, defaults to current year)
```

#### Cancel Leave Request
```
POST /leave/requests/:request_id/cancel
```

### Teacher Specific Endpoints

#### View Student Leave Requests
```
GET /leave/teacher/student-requests
Query Parameters:
- status: Pending|Approved|Rejected|Cancelled (optional)
- search: string (optional)
```

## Data Models

### Leave Request
```typescript
{
  id: string
  campus_id: string
  user_id: string
  user_type: "Student" | "Teacher"
  leave_type_id: string
  start_date: Date
  end_date: Date
  total_days: number
  reason: string
  priority: "Normal" | "Urgent" | "Emergency"
  status: "Pending" | "Approved" | "Rejected" | "Cancelled"
  approved_by?: string
  approval_date?: Date
  rejection_reason?: string
  supporting_documents?: string[]
  applied_on: Date
}
```

### Leave Type
```typescript
{
  id: string
  campus_id: string
  name: string
  description?: string
  default_allocation: number
  max_carry_forward?: number
  carry_forward_allowed: boolean
  requires_approval: boolean
  color?: string
  icon?: string
  is_active: boolean
}
```

### Leave Balance
```typescript
{
  id: string
  campus_id: string
  user_id: string
  user_type: "Student" | "Teacher"
  leave_type_id: string
  year: number
  allocated_days: number
  used_days: number
  carry_forward_days?: number
  available_days: number
}
```

## Default Leave Types

The system comes with these predefined leave types:

1. **Sick Leave** (8 days) - Medical emergencies, carry forward allowed
2. **Casual Leave** (6 days) - General purposes, no carry forward
3. **Personal Leave** (3 days) - Personal matters, carry forward allowed  
4. **Annual Leave** (15 days) - Vacation time, carry forward allowed
5. **Maternity Leave** (90 days) - Maternity support, no carry forward
6. **Compensatory Off** (5 days) - Overtime compensation, no approval required

## Usage Flow

### For Admin:
1. Call `/leave/admin/initialize` to set up leave types
2. Users can now apply for leave
3. View requests at `/leave/admin/requests`
4. Approve/reject via `/leave/admin/requests/:id/approve` or `/leave/admin/requests/:id/reject`
5. Monitor analytics at `/leave/admin/analytics`

### For Students/Teachers:
1. Check available leave types at `/leave/types`
2. View current balances at `/leave/my-balances` 
3. Apply for leave at `/leave/apply`
4. Check request status at `/leave/my-requests`
5. Cancel if needed at `/leave/requests/:id/cancel`

## Response Format

All APIs follow this response format:

### Success Response:
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Working Days Calculation

The system automatically calculates working days between start and end dates, excluding weekends (Saturday and Sunday). Holidays can be added to the calculation in future updates.

## Future Enhancements

- Holiday calendar integration
- Leave approval workflows (multi-level approvals)
- Email notifications for leave status changes
- Leave policy management (blackout periods, etc.)
- Advanced reporting and analytics
- Mobile app support
