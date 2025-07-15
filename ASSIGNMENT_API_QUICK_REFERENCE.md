# 🚀 Assignment API Quick Reference

## 📋 Essential Endpoints

### 🎓 **Student Unified View** (Solves fragmentation problem)
```http
GET /api/v1/assignments/student/my-assignments
Authorization: Bearer <student-token>
```

### 👩‍🏫 **Teacher Assignment Management**
```http
GET /api/v1/assignments/teacher/my-assignments
POST /api/v1/assignments/teacher/submissions/{id}/grade
```

### 🔐 **Admin System Overview**
```http
GET /api/v1/assignments/admin/overview
GET /api/v1/assignments/admin/analytics
```

### 👨‍👩‍👧‍👦 **Parent Monitoring**
```http
GET /api/v1/assignments/parent/student/{student_id}/assignments
```

## 🔑 Key Features

- ✅ **Unified Student View** - All assignments in one place
- ✅ **Role-Based Access** - Admin, Teacher, Student, Parent
- ✅ **Smart Analytics** - Performance tracking & insights
- ✅ **Mobile-Ready** - Optimized for mobile apps
- ✅ **Real-time Dashboard** - Live assignment updates

## 📊 Common Request Examples

### Filter Student Assignments
```http
GET /api/v1/assignments/student/my-assignments?status=pending&sort_by=due_date&limit=10
```

### Get Overdue Assignments
```http
GET /api/v1/assignments/student/my-assignments?status=overdue
```

### Submit Assignment
```http
POST /api/v1/assignments/student/{assignment_id}/submit
Content-Type: application/json

{
  "submission_text": "My solution...",
  "attachments": [{"filename": "solution.pdf", "url": "..."}]
}
```

### Grade Submission
```http
POST /api/v1/assignments/teacher/submissions/{submission_id}/grade
Content-Type: application/json

{
  "grade": 85,
  "feedback": "Excellent work!"
}
```

## 🎯 Response Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
```

## 🔐 Authentication

All endpoints require JWT in header:
```http
Authorization: Bearer <your-jwt-token>
```

## 📱 Mobile Integration Tips

1. **Use pagination** for large assignment lists
2. **Cache dashboard data** for offline viewing
3. **Poll `/student/dashboard`** for real-time updates
4. **Filter by `due_in_days`** for urgent assignments
5. **Use `status=pending`** for action items

## 🎪 Testing Commands

```bash
# Test unified student view
curl -H "Authorization: Bearer TOKEN" \
  "https://api.example.com/v1/assignments/student/my-assignments"

# Test teacher assignments
curl -H "Authorization: Bearer TOKEN" \
  "https://api.example.com/v1/assignments/teacher/my-assignments"

# Test admin overview
curl -H "Authorization: Bearer TOKEN" \
  "https://api.example.com/v1/assignments/admin/overview"
```

## 🎯 Key Benefits

- **🔄 Unified Experience**: No more fragmented assignment views
- **📊 Smart Analytics**: Data-driven insights for improvement
- **🎯 Priority System**: Focus on what matters most
- **📱 Mobile-First**: Perfect for student mobile apps
- **🔐 Secure**: Role-based access control

## 📚 Full Documentation

See `ASSIGNMENT_API_DOCUMENTATION.md` for complete details, examples, and data models.
