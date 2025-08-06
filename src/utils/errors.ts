/**
 * Custom error classes for better error handling across the application
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;

        // This clips the constructor invocation from the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource already exists") {
        super(message, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized access") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden access") {
        super(message, 403);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = "Database operation failed") {
        super(message, 500);
    }
}
