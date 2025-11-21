# Campus Feature Management System

## Overview
This system allows Super Admin to enable/disable specific features for any campus, providing granular control over platform functionality.

## Features That Can Be Controlled

### 1. **Chat** (`chat`)
- Enables/disables the entire chat system for a campus
- Includes personal chats, group chats, and messaging

### 2. **Meetings** (`meetings`)
- Enables/disables video conferencing and meeting functionality
- Includes WebRTC-based video calls, screen sharing, and meeting management

### 3. **Payments** (`payments`)
- Enables/disables both Razorpay and Cashfree payment systems
- Includes payment orders, templates, transactions, and vendor management

### 4. **Curriculum** (`curriculum`)
- Enables/disables curriculum management
- Includes curriculum creation, chapter management, and subject linking

### 5. **Subject Materials** (`subject_materials`)
- Enables/disables file uploads and materials for subjects
- Teachers can upload/manage study materials, assignments, notes
- Includes material downloads and teacher assignment to subjects

### 6. **Student & Parent Access** (`student_parent_access`)
- **SPECIAL**: Controls creation of Student and Parent accounts
- When disabled: NO new student or parent accounts can be created
- Other roles (Admin, Teacher, Staff, Principal) can still be created
- Applies to both single and bulk user creation

## Implementation Details

### Middleware Applied

#### 1. Feature Access Middleware (Route Level)
Applied in `src/routes/index.ts` BEFORE mounting routes:

```typescript
// Chat - blocks all chat operations
app.use("/chat/*", featureAccessMiddleware("chat")); 
app.route("/chat", chatRoute);

// Meetings - blocks all meeting operations
app.use("/meeting/*", featureAccessMiddleware("meetings"));
app.route("/meeting", meetingRoute);

// Payments - blocks all payment operations
app.use("/payments/*", featureAccessMiddleware("payments"));
app.route("/payments", paymentRoute);

app.use("/cashfree-payments/*", featureAccessMiddleware("payments"));
app.route("/cashfree-payments", cashfreePaymentRoute);

// Curriculum - blocks curriculum operations
app.use("/curriculum/*", featureAccessMiddleware("curriculum"));
app.route("/curriculum", curriculumRoute);
```

#### 2. Subject Materials Middleware (Inside Route File)
Applied in `src/routes/subject.route.ts` for specific routes:

```typescript
// Only applies to material-related and teacher assignment routes
app.use("/*/materials*", featureAccessMiddleware("subject_materials"));
app.use("/*/teachers*", featureAccessMiddleware("subject_materials"));
app.use("/*/details*", featureAccessMiddleware("subject_materials"));
```

#### 3. Student/Parent Creation Middleware
Applied in `src/routes/users.route.ts`:

```typescript
// Blocks student/parent creation when feature is disabled
app.use("/", studentParentCreationMiddleware());
app.use("/bulk", studentParentCreationMiddleware());
```

### How It Works

1. **Feature Check**: Middleware checks `campus_features` collection for the campus
2. **Super Admin Bypass**: Super Admin always bypasses all feature restrictions
3. **Default Behavior**: If no feature record exists, all features are enabled (backward compatibility)
4. **Error Response**: Returns 403 with clear message when feature is disabled

### API Endpoints (Super Admin Only)

All endpoints require Super Admin authentication:

#### Get All Campus Features
```http
GET /api/super-admin/campus-features
```

#### Get Campus Features
```http
GET /api/super-admin/campus-features/:campus_id
```

#### Update Campus Features
```http
PUT /api/super-admin/campus-features/:campus_id
Content-Type: application/json

{
  "features": {
    "chat": true,
    "meetings": false,
    "payments": true,
    "curriculum": true,
    "subject_materials": false,
    "student_parent_access": true
  }
}
```

#### Enable Specific Feature
```http
POST /api/super-admin/campus-features/:campus_id/enable/:feature_name
```

#### Disable Specific Feature
```http
POST /api/super-admin/campus-features/:campus_id/disable/:feature_name
```

#### Reset to Defaults
```http
POST /api/super-admin/campus-features/:campus_id/reset
```

#### Bulk Update Features
```http
POST /api/super-admin/campus-features/bulk-update
Content-Type: application/json

{
  "campus_ids": ["campus1", "campus2"],
  "features": {
    "chat": false,
    "meetings": false
  }
}
```

## Database Schema

### Collection: `campus_features`

```typescript
{
  id: string;
  campus_id: string;
  features: {
    chat: boolean;
    meetings: boolean;
    payments: boolean;
    curriculum: boolean;
    subject_materials: boolean;
    student_parent_access: boolean;
  };
  updated_by: string; // User ID of super admin
  updated_at: Date;
  created_at: Date;
}
```

## Error Responses

### Feature Disabled (403)
```json
{
  "error": "Feature Disabled",
  "message": "The chat feature is currently disabled for your campus. Please contact your administrator.",
  "feature": "chat",
  "campus_id": "campus_123"
}
```

### Student/Parent Creation Blocked (403)
```json
{
  "error": "Feature Disabled",
  "message": "Creation of student accounts is currently disabled for your campus. Please contact your administrator.",
  "feature": "student_parent_access",
  "campus_id": "campus_123"
}
```

## Files Modified/Created

### New Files
- `src/models/campus_features.model.ts` - Database model
- `src/middlewares/feature.middleware.ts` - Middleware implementation
- `src/services/campus_features.service.ts` - Business logic
- `src/controllers/campus_features.controller.ts` - API controllers
- `src/routes/campus_features.route.ts` - API routes

### Modified Files
- `src/routes/index.ts` - Added feature middleware
- `src/routes/subject.route.ts` - Added subject materials middleware
- `src/routes/users.route.ts` - Added student/parent creation middleware

## Testing

### Test Feature Disable
1. Disable chat for a campus
2. Try to access chat as a user from that campus
3. Should receive 403 error

### Test Student Creation Block
1. Disable `student_parent_access` for a campus
2. Try to create a student account
3. Should receive 403 error
4. Create a teacher account - should work fine

### Test Super Admin Bypass
1. Disable all features for a campus
2. Access any route as Super Admin
3. Should work without restrictions

## Notes

- ✅ Middleware is applied at the **index.ts level** for main features (chat, meetings, payments, curriculum)
- ✅ Middleware is applied at the **route file level** for subject materials (more granular control)
- ✅ Student/Parent creation is blocked at the **user creation route level**
- ✅ Super Admin always bypasses all restrictions
- ✅ Backward compatible - if no feature record exists, all features are enabled
- ✅ Strict type safety with TypeScript
