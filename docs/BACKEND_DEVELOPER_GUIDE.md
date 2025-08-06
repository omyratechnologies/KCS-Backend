# KCS Backend Developer Guide

Welcome to the KCS (Knowledge Center System) Backend project! This comprehensive guide will help new
backend developers understand the project structure, architecture, and development workflow.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Directory Structure](#directory-structure)
5. [Getting Started](#getting-started)
6. [Development Workflow](#development-workflow)
7. [API Structure](#api-structure)
8. [Database Models](#database-models)
9. [Services Architecture](#services-architecture)
10. [Authentication & Authorization](#authentication--authorization)
11. [Environment Configuration](#environment-configuration)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Best Practices](#best-practices)
15. [Troubleshooting](#troubleshooting)

## Project Overview

The KCS Backend is a comprehensive educational management system API built with modern TypeScript
technologies. It provides a robust backend for managing:

- **Student Management**: Student records, enrollments, and academic tracking
- **Teacher Management**: Teacher profiles, assignments, and class management
- **Academic System**: Courses, classes, subjects, curriculum, and timetables
- **Assignment System**: Traditional and enhanced assignments with submissions
- **Assessment System**: Quizzes, exams, and grading
- **Communication**: Notifications, messages, and announcements
- **Administrative**: Campus management, fees, attendance, and reports
- **Storage**: Document storage and file management

## Technology Stack

### Core Technologies

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- **Framework**: [Hono](https://hono.dev/) - Lightweight web framework for the edge
- **Language**: TypeScript with strict type checking
- **Database**: Couchbase with [Ottoman ODM](https://ottomanjs.com/)
- **Cache**: Redis for session management and caching
- **Storage**: AWS S3/Cloudflare R2 for file storage

### Development Tools

- **API Documentation**: OpenAPI/Swagger with Scalar UI
- **Validation**: Zod for runtime type validation
- **Authentication**: JWT tokens
- **Email**: AWS SES and SendGrid
- **Testing**: Jest framework
- **Code Quality**: ESLint + Prettier

## Project Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │   Load Balancer │
│  (Mobile/Web)   │◄──►│   (Optional)    │◄──►│   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 ▼                                 │
                       │                    ┌─────────────────┐                           │
                       │                    │   Hono Server   │                           │
                       │                    │   (Express-like) │                           │
                       │                    └─────────────────┘                           │
                       │                             │                                     │
                       │              ┌──────────────┼──────────────┐                     │
                       │              ▼              ▼              ▼                     │
                       │    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
                       │    │ Controllers │ │ Middlewares │ │   Routes    │              │
                       │    └─────────────┘ └─────────────┘ └─────────────┘              │
                       │              │              │              │                     │
                       │              └──────────────┼──────────────┘                     │
                       │                             ▼                                     │
                       │                    ┌─────────────────┐                           │
                       │                    │    Services     │                           │
                       │                    │  (Business Logic)│                           │
                       │                    └─────────────────┘                           │
                       │                             │                                     │
                       │              ┌──────────────┼──────────────┐                     │
                       │              ▼              ▼              ▼                     │
                       │    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
                       │    │   Models    │ │    Cache    │ │   Storage   │              │
                       │    │ (Ottoman)   │ │   (Redis)   │ │ (S3/R2)     │              │
                       │    └─────────────┘ └─────────────┘ └─────────────┘              │
                       │              │                              │                     │
                       │              ▼                              ▼                     │
                       │    ┌─────────────────┐              ┌─────────────────┐         │
                       │    │   Couchbase     │              │   File Storage  │         │
                       │    │   Database      │              │   (AWS S3/R2)   │         │
                       │    └─────────────────┘              └─────────────────┘         │
                       └─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

- **Layered Architecture**: Clear separation between routes, controllers, services, and models
- **Dependency Injection**: Services are injected into controllers
- **Single Responsibility**: Each layer has a specific purpose
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Validation**: Input validation at route level using Zod schemas

## Directory Structure

```
KCS-Backend/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── app/
│   │   └── index.ts            # Hono app configuration
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── assignments.controller.ts
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── users.service.ts
│   │   ├── enhanced_assignment.service.ts
│   │   └── ...
│   ├── models/                # Database models (Ottoman)
│   │   ├── user.model.ts
│   │   ├── assignment.model.ts
│   │   └── ...
│   ├── routes/                # Route definitions
│   │   ├── index.ts           # Main router
│   │   ├── auth.route.ts
│   │   └── ...
│   ├── middlewares/           # Custom middlewares
│   │   ├── auth.middleware.ts
│   │   └── role.middleware.ts
│   ├── libs/                  # External integrations
│   │   ├── db/               # Database connection
│   │   ├── cache/            # Redis cache
│   │   ├── s3/               # File storage
│   │   ├── logger/           # Logging utilities
│   │   └── mailer/           # Email services
│   ├── schema/               # Zod validation schemas
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   │   ├── env.ts            # Environment configuration
│   │   └── ...
│   └── store/                # Global state management
├── scripts/                  # Database and setup scripts
├── tests/                    # Test files
├── docs/                     # API documentation
├── docker-compose.yaml       # Docker configuration
├── Dockerfile               # Container definition
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Couchbase** Server or Cloud account
- **Redis** instance
- **AWS** account (for S3 and SES)

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/omyratechnologies/KCS-Backend.git
    cd KCS-Backend
    ```

2. **Install dependencies**

    ```bash
    bun install
    # or npm install
    ```

3. **Environment setup**

    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

4. **Database setup**

    ```bash
    # Run database setup scripts
    bun run scripts/complete-db-setup.ts
    ```

5. **Start development server**
    ```bash
    bun run dev
    ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
OTTOMAN_BUCKET_NAME=your_bucket_name
OTTOMAN_CONNECTION_STRING=couchbase://localhost
OTTOMAN_USERNAME=your_username
OTTOMAN_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_ACCESS_SECRET_KEY=your_aws_secret_key
AWS_REGION=ap-south-1

# AWS SES Configuration
AWS_SES_EMAIL_FROM=noreply@yourdomain.com
AWS_SES_EMAIL_FROM_NAME=KCS System

# R2/S3 Configuration
R2_BUCKET=your_r2_bucket
R2_ENDPOINT=your_r2_endpoint
R2_REGION=auto
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_URL=https://your_bucket_url

# Redis Configuration
REDIS_URI=redis://localhost:6379
```

## Development Workflow

### 1. Creating a New Feature

When adding a new feature, follow this structure:

1. **Define the Model** (`src/models/`)

    ```typescript
    // src/models/example.model.ts
    import { Schema } from "ottoman";
    import { ottoman } from "@/libs/db";

    export interface IExampleData {
        id: string;
        name: string;
        // ... other fields
    }

    const ExampleSchema = new Schema({
        name: { type: String, required: true },
        // ... other fields
    });

    export const Example = ottoman.model<IExampleData>("Example", ExampleSchema);
    ```

2. **Create the Service** (`src/services/`)

    ```typescript
    // src/services/example.service.ts
    export class ExampleService {
        public async create(data: Partial<IExampleData>) {
            // Business logic here
        }

        public async findById(id: string) {
            // Business logic here
        }
    }
    ```

3. **Add the Controller** (`src/controllers/`)

    ```typescript
    // src/controllers/example.controller.ts
    import { Context } from "hono";
    import { ExampleService } from "@/services/example.service";

    export class ExampleController {
        private exampleService = new ExampleService();

        public create = async (c: Context) => {
            // Handle request/response
        };
    }
    ```

4. **Define Routes** (`src/routes/`)

    ```typescript
    // src/routes/example.route.ts
    import { Hono } from "hono";
    import { ExampleController } from "@/controllers/example.controller";

    const app = new Hono();
    const controller = new ExampleController();

    app.post("/", controller.create);
    export default app;
    ```

5. **Add to Main Router** (`src/routes/index.ts`)
    ```typescript
    import exampleRoute from "@/routes/example.route";
    app.route("/examples", exampleRoute);
    ```

### 2. Testing

```bash
# Run all tests
bun test

# Run specific test files
bun test:users
bun test:services

# Run with coverage
bun test:coverage

# Watch mode
bun test:watch
```

### 3. Code Quality

```bash
# Lint code
bun run lint

# Format code
bun run format

# Build project
bun run build
```

## API Structure

### RESTful Conventions

The API follows REST conventions:

- `GET /api/resource` - List resources
- `GET /api/resource/:id` - Get specific resource
- `POST /api/resource` - Create new resource
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

### Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "pagination": { /* if applicable */ }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error info */ }
  }
}
```

### API Documentation

The API documentation is auto-generated and available at:

- Swagger UI: `http://localhost:3000/swagger`
- Scalar UI: `http://localhost:3000/docs`

## Database Models

### Model Structure

The project uses Ottoman ODM for Couchbase. Models are defined in `src/models/`:

#### Key Models:

1. **User Management**
    - `user.model.ts` - Base user model
    - `teacher.model.ts` - Teacher-specific data
    - `student.model.ts` - Student-specific data
    - `parent.model.ts` - Parent/guardian data

2. **Academic Structure**
    - `campus.model.ts` - Campus/institution data
    - `class.model.ts` - Class/grade definitions
    - `course.model.ts` - Course information
    - `subject.model.ts` - Subject definitions

3. **Assignment System**
    - `assignment.model.ts` - Legacy assignments
    - `enhanced_assignment.model.ts` - New assignment system
    - `assignment_submission.model.ts` - Student submissions

4. **Assessment System**
    - `exam.model.ts` - Exam definitions
    - `class_quiz.model.ts` - Quiz system

### Model Conventions

```typescript
// Model naming convention
export interface I[ModelName]Data {
    id: string;
    campus_id: string; // Always include campus reference
    is_active: boolean; // Soft delete flag
    is_deleted: boolean; // Hard delete flag
    created_at: Date;
    updated_at: Date;
    // ... specific fields
}

// Schema definition
const ModelSchema = new Schema({
    // Required fields
    campus_id: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },

    // Timestamps
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },

    // Specific fields...
});

// Indexes for performance
ModelSchema.index.findByCampusId = { by: "campus_id" };
ModelSchema.index.findByActive = { by: "is_active" };

export const Model = ottoman.model<IModelData>("ModelName", ModelSchema);
```

## Services Architecture

Services contain the business logic and are organized by domain:

### Core Services

1. **UserService** - User management and authentication
2. **TeacherService** - Teacher-specific operations
3. **EnhancedAssignmentService** - Assignment management (featured in your code)
4. **NotificationService** - Communication management
5. **AttendanceService** - Attendance tracking

### Service Pattern

```typescript
export class ExampleService {
    // Private methods for internal logic
    private validateData(data: any): boolean {
        // Validation logic
    }

    // Public methods for external use
    public async create(data: IExampleData): Promise<IExampleData> {
        // 1. Validate input
        if (!this.validateData(data)) {
            throw new Error("Invalid data");
        }

        // 2. Business logic
        const processedData = this.processData(data);

        // 3. Database operations
        const result = await Example.create(processedData);

        // 4. Post-processing (notifications, cache, etc.)
        await this.notifyCreation(result);

        return result;
    }

    public async findById(id: string): Promise<IExampleData | null> {
        return await Example.findById(id);
    }

    // Error handling
    private handleError(error: any, operation: string): never {
        console.error(`Error in ${operation}:`, error);
        throw new Error(`Failed to ${operation}`);
    }
}
```

## Authentication & Authorization

### Authentication Flow

1. **Login**: User provides credentials → JWT token generated
2. **Token Validation**: Middleware validates JWT on protected routes
3. **User Context**: Authenticated user info attached to request context

### Middleware Usage

```typescript
// Apply authentication to routes
app.use(authMiddleware());

// Role-based access control
app.use(roleMiddleware(["teacher", "admin"]));
```

### Token Structure

```typescript
interface JWTPayload {
    user_id: string;
    campus_id: string;
    role: string;
    permissions: string[];
    iat: number;
    exp: number;
}
```

## Environment Configuration

Environment variables are managed through `src/utils/env.ts` using Zod validation:

```typescript
export const env = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.string(),
    // Database, JWT, AWS, Redis configs...
});

export const config = env.parse(process.env);
```

This ensures type safety and validates all required environment variables at startup.

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
├── services/       # Service layer tests
└── fixtures/       # Test data and mocks
```

### Writing Tests

```typescript
// Example test file
describe("ExampleService", () => {
    let service: ExampleService;

    beforeEach(() => {
        service = new ExampleService();
    });

    it("should create a new example", async () => {
        const data = { name: "Test Example" };
        const result = await service.create(data);

        expect(result).toBeDefined();
        expect(result.name).toBe(data.name);
    });
});
```

## Deployment

### Docker Deployment

```dockerfile
# Build and run with Docker
docker build -t kcs-backend .
docker run -p 3000:3000 --env-file .env kcs-backend
```

### Production Considerations

1. **Environment Variables**: Use secure secret management
2. **Database**: Ensure proper indexes and connection pooling
3. **Caching**: Configure Redis for production workloads
4. **Monitoring**: Implement proper logging and monitoring
5. **Security**: Enable CORS, rate limiting, and input validation

## Best Practices

### 1. Code Organization

- Keep functions small and focused
- Use meaningful variable and function names
- Follow TypeScript strict mode
- Implement proper error handling

### 2. Database Operations

- Always include campus_id in queries for multi-tenancy
- Use soft deletes (is_deleted flag) instead of hard deletes
- Implement proper indexing for performance
- Use transactions for related operations

### 3. API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement consistent response formats
- Add proper validation for all inputs

### 4. Security

- Validate all user inputs
- Use parameterized queries
- Implement rate limiting
- Log security-relevant events

### 5. Performance

- Use caching strategically
- Implement pagination for large datasets
- Optimize database queries
- Use async/await properly

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

    ```bash
    # Test database connection
    bun run scripts/test-db-connection.ts
    ```

2. **Redis Connection Issues**

    ```bash
    # Check Redis connection
    redis-cli ping
    ```

3. **Environment Variable Issues**
    - Ensure all required variables are set
    - Check for typos in variable names
    - Validate with the Zod schema

4. **Build Issues**
    ```bash
    # Clean and rebuild
    bun run clean
    bun install
    bun run build
    ```

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=true
```

### Database Scripts

Useful database management scripts in `scripts/`:

- `complete-db-setup.ts` - Full database initialization
- `create-collections.ts` - Create required collections
- `setup-super-admin.ts` - Create admin user
- `migrate-database.ts` - Run migrations

---

## Getting Help

- **API Documentation**: `/docs` or `/swagger` endpoints
- **Code Examples**: Check existing controllers and services
- **Database Schema**: Review model files in `src/models/`
- **Test Examples**: Look at test files for usage patterns

Welcome to the KCS Backend team! This guide should help you get started. Don't hesitate to ask
questions and refer to existing code for examples.
