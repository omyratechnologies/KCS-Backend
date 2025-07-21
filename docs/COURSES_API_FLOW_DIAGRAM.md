# Course API Flow Diagram

## High-Level Architecture Flow

```mermaid
graph TD
    A[Client Request] --> B[Authentication Middleware]
    B --> C[Role Middleware]
    C --> D[Course Route Handler]
    D --> E[Course Controller]
    E --> F[Course Service]
    F --> G[Database Models]
    G --> H[Response]
    
    subgraph "Database Models"
        G1[Course Model]
        G2[Course Content Model] 
        G3[Course Enrollment Model]
        G4[Course Assignment Model]
        G5[Course Assignment Submission Model]
    end
    
    G --> G1
    G --> G2
    G --> G3
    G --> G4
    G --> G5
```

## Course Management Flow

```mermaid
graph LR
    A[Admin/Teacher] --> B[Create Course]
    B --> C[Add Course Content]
    C --> D[Set Access Permissions]
    D --> E[Publish Course]
    E --> F[Students Can Enroll]
    F --> G[Track Progress]
    G --> H[Grade & Feedback]
```

## Student Course Journey

```mermaid
graph TD
    A[Student Login] --> B[Browse Available Courses]
    B --> C[View Course Details]
    C --> D{Enrollment Required?}
    D -->|Yes| E[Enroll in Course]
    D -->|No| F[Access Course Content]
    E --> F
    F --> G[View Learning Materials]
    G --> H[Complete Activities]
    H --> I[Submit Assignments]
    I --> J[Receive Feedback]
    J --> K[Track Progress]
    K --> L{Course Complete?}
    L -->|No| G
    L -->|Yes| M[Receive Certificate]
```

## API Endpoint Relationships

```mermaid
graph TB
    subgraph "Course Management"
        A[POST /api/course/]
        B[GET /api/course/]
        C[GET /api/course/{id}]
        D[PUT /api/course/{id}]
        E[DELETE /api/course/{id}]
    end
    
    subgraph "Content Management"
        F[POST /api/course/{id}/content]
        G[GET /api/course/{id}/content]
        H[GET /api/course/{id}/content/{content_id}]
        I[PUT /api/course/{id}/content/{content_id}]
        J[DELETE /api/course/{id}/content/{content_id}]
    end
    
    subgraph "Enrollment Management"
        K[POST /api/course/{id}/enroll]
        L[GET /api/course/{id}/enrollment]
        M[GET /api/course/{id}/enrollment/{enrollment_id}]
        N[PUT /api/course/{id}/enrollment/{enrollment_id}]
        O[DELETE /api/course/{id}/enrollment/{enrollment_id}]
        P[GET /api/course/enrollment/user/{user_id}]
    end
    
    A --> F
    A --> K
    C --> G
    C --> L
```

## Role-Based Access Flow

```mermaid
graph TD
    A[API Request] --> B[Extract JWT Token]
    B --> C[Verify Token]
    C --> D[Extract User Role]
    D --> E{Role Check}
    
    E -->|Student| F[Student Permissions]
    E -->|Teacher| G[Teacher Permissions]
    E -->|Admin| H[Admin Permissions]
    E -->|Super Admin| I[Super Admin Permissions]
    
    F --> F1[View Enrolled Courses]
    F --> F2[View Course Content]
    F --> F3[Enroll in Courses]
    F --> F4[Track Progress]
    
    G --> G1[Create Course Content]
    G --> G2[Manage Course Materials]
    G --> G3[View Course Analytics]
    G --> G4[Grade Students]
    
    H --> H1[Full Course CRUD]
    H --> H2[Manage All Enrollments]
    H --> H3[System Analytics]
    H --> H4[User Management]
    
    I --> I1[Campus Management]
    I --> I2[System Configuration]
    I --> I3[Global Analytics]
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Middleware
    participant R as Role Middleware  
    participant CC as Course Controller
    participant CS as Course Service
    participant DB as Database
    
    C->>A: API Request + JWT Token
    A->>A: Verify Token
    A->>R: Pass Request
    R->>R: Check Role Permissions
    R->>CC: Route to Controller
    CC->>CC: Extract Request Data
    CC->>CS: Call Service Method
    CS->>DB: Database Query
    DB->>CS: Return Data
    CS->>CC: Process & Return
    CC->>C: JSON Response
```

## Course Content Structure

```mermaid
graph TD
    A[Course] --> B[Course Content]
    B --> C[Lessons]
    B --> D[Quizzes] 
    B --> E[Assignments]
    B --> F[Resources]
    B --> G[Assessments]
    
    C --> C1[Text Content]
    C --> C2[Video Content]
    C --> C3[Audio Content]
    C --> C4[Interactive Content]
    
    D --> D1[Multiple Choice]
    D --> D2[True/False]
    D --> D3[Fill in Blanks]
    
    E --> E1[Written Assignments]
    E --> E2[Project Assignments]
    E --> E3[Group Assignments]
    
    F --> F1[Documents]
    F --> F2[Presentations]
    F --> F3[External Links]
```

## Error Handling Flow

```mermaid
graph TD
    A[API Request] --> B{Authentication Valid?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{Role Authorized?}
    D -->|No| E[Return 401 Unauthorized]
    D -->|Yes| F{Request Valid?}
    F -->|No| G[Return 400 Bad Request]
    F -->|Yes| H[Process Request]
    H --> I{Database Error?}
    I -->|Yes| J[Return 500 Server Error]
    I -->|No| K[Return Success Response]
    
    style C fill:#ffcccc
    style E fill:#ffcccc
    style G fill:#ffe6cc
    style J fill:#ffcccc
    style K fill:#ccffcc
```
