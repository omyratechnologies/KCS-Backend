# Bulk User Creation API Guide

## Overview
The bulk user creation endpoint allows administrators to create multiple users (Students, Teachers, Parents) at once, significantly improving efficiency when onboarding many users.

## Endpoint
```
POST /api/users/bulk
```

## Request Format

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "users": [
    {
      "user_id": "student001",
      "email": "student1@example.com",
      "password": "securepassword123",
      "first_name": "Alice",
      "last_name": "Smith",
      "phone": "+1234567890",
      "address": "123 Main St, City",
      "user_type": "Student",
      "meta_data": {},
      "campus_id": "campus123",
      "academic_year": "2024-2025",
      "class_id": "class123"
    },
    {
      "user_id": "teacher001",
      "email": "teacher1@example.com",
      "password": "securepassword123",
      "first_name": "Bob",
      "last_name": "Johnson",
      "phone": "+1234567891",
      "address": "456 Oak Ave, City",
      "user_type": "Teacher",
      "meta_data": {},
      "campus_id": "campus123"
    }
  ]
}
```

## Field Requirements

### Required Fields (All Users)
- `user_id`: Unique identifier for the user
- `email`: Valid email address (must be unique)
- `password`: User password
- `first_name`: User's first name
- `last_name`: User's last name
- `phone`: Contact phone number
- `address`: Physical address
- `user_type`: One of: "Student", "Teacher", "Parent", "Staff", "Principal", "Admin"

### Optional Fields
- `meta_data`: Additional user metadata (object)
- `campus_id`: Campus ID (required for non-Super Admin creators)
- `academic_year`: Academic year (required for Students)
- `class_id`: Class ID (required for Students)

## Response Format

```json
{
  "message": "Bulk user creation completed",
  "results": {
    "total": 10,
    "success_count": 8,
    "failed_count": 2,
    "successful": [
      {
        "index": 0,
        "user_id": "student001",
        "email": "student1@example.com",
        "id": "uuid-generated-123",
        "message": "User created successfully"
      }
    ],
    "failed": [
      {
        "index": 5,
        "user_id": "student006",
        "email": "duplicate@example.com",
        "error": "Email already exists"
      }
    ]
  }
}
```

## Limitations

1. **Maximum Users**: 100 users per request
2. **Minimum Users**: At least 1 user required

## Permission Rules

### Super Admin
- Can create users of any type in any campus
- Can create up to 100 users per request
- Campus ID is required for non-Super Admin users

### Admin
- Can create users in their own campus only
- **Non-deletable Admin** (created by Super Admin):
  - Can create Admins (with deletable=true) and all users below
- **Deletable Admin** (created by another Admin):
  - Can create users below Admin level only

### Principal
- Can create Staff, Teacher, Parent, Student in own campus only
- Cannot create Admins or other Principals

### Staff
- Can create Parent, Student, Teacher in own campus only
- Created users will have `created_by` field set to Staff's ID

## Error Handling

The bulk creation endpoint uses a **partial success** model:
- If some users fail, the successful ones are still created
- Each failure includes the index, user_id, email, and error message
- The response includes both successful and failed user lists

### Common Errors

1. **Email already exists**: The email is already registered
2. **Campus not found**: Invalid campus_id provided
3. **Academic year and class ID required for students**: Missing required fields
4. **Cannot create users in other campus**: Trying to create users outside assigned campus
5. **Invalid campus ID**: Campus doesn't exist or is inactive

## Use Cases

### 1. Student Bulk Enrollment
```json
{
  "users": [
    {
      "user_id": "2024-STU-001",
      "email": "student1@school.edu",
      "password": "Welcome2024!",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "address": "123 Main St",
      "user_type": "Student",
      "academic_year": "2024-2025",
      "class_id": "grade-10-a"
    }
  ]
}
```

### 2. Teacher Onboarding
```json
{
  "users": [
    {
      "user_id": "TCH-2024-001",
      "email": "teacher@school.edu",
      "password": "SecurePass123!",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "+1234567891",
      "address": "456 Oak Ave",
      "user_type": "Teacher",
      "meta_data": {
        "subjects": ["Math", "Physics"],
        "department": "Science"
      }
    }
  ]
}
```

### 3. Parent Registration
```json
{
  "users": [
    {
      "user_id": "PAR-2024-001",
      "email": "parent@example.com",
      "password": "ParentPass123!",
      "first_name": "Michael",
      "last_name": "Johnson",
      "phone": "+1234567892",
      "address": "789 Elm St",
      "user_type": "Parent",
      "meta_data": {
        "student_id": ["2024-STU-001"],
        "relation": "Father"
      }
    }
  ]
}
```

## Best Practices

1. **Validate Data**: Ensure all emails are unique and valid before sending
2. **Use Strong Passwords**: Generate secure passwords for users
3. **Campus ID**: Always provide correct campus_id for your institution
4. **Batch Size**: Keep batches under 50 users for optimal performance
5. **Error Review**: Always check the `failed` array in the response
6. **Retry Logic**: Implement retry for failed users with corrected data

## Example CSV to JSON Conversion

If you have a CSV file with user data, convert it to JSON format:

**CSV:**
```csv
user_id,email,password,first_name,last_name,phone,address,user_type
student001,s1@example.com,pass123,John,Doe,+1234567890,123 Main St,Student
student002,s2@example.com,pass123,Jane,Smith,+1234567891,456 Oak Ave,Student
```

**JSON:**
```json
{
  "users": [
    {
      "user_id": "student001",
      "email": "s1@example.com",
      "password": "pass123",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "address": "123 Main St",
      "user_type": "Student"
    },
    {
      "user_id": "student002",
      "email": "s2@example.com",
      "password": "pass123",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "+1234567891",
      "address": "456 Oak Ave",
      "user_type": "Student"
    }
  ]
}
```

## Security Considerations

1. All users inherit role-based permissions
2. Created users have `created_by` field tracking the creator
3. Campus validation ensures data isolation
4. Email uniqueness is enforced across all users
5. Passwords are hashed using PBKDF2 with salt
6. Welcome emails are sent to all successfully created users
