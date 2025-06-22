import { type Context } from "hono";

import { UserService } from "@/services/users.service";
import { 
    ValidationError, 
    NotFoundError, 
    ConflictError, 
    UnauthorizedError,
    AppError 
} from "@/utils/errors";

export class UsersController {
    // Create
    public static readonly createUsers = async (c: Context) => {
        try {
            const _user_type = c.get("user_type");
            const _campus_id = c.get("campus_id");

            const userData = await c.req.json();

            // Authorization checks
            if (_user_type !== "Super Admin" && !_campus_id) {
                throw new UnauthorizedError("You can only add users to your assigned campus");
            }

            // Set campus_id if not provided and user is not Super Admin
            if (!userData.campus_id && _user_type !== "Super Admin") {
                userData.campus_id = _campus_id;
            }

            const user = await UserService.createUsers(userData);

            return c.json({
                success: true,
                message: "User created successfully",
                data: user
            }, 201);

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof ConflictError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "conflict_error"
                }, 409);
            }

            if (error instanceof UnauthorizedError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "unauthorized_error"
                }, 401);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };
    // Get All
    public static readonly getUsers = async (c: Context) => {
        try {
            const campus_id = c.get("campus_id");
            const user_type = c.get("user_type");
            
            // Build query from request parameters
            const query: any = {};
            
            // Super Admin can see all users, others only from their campus
            if (user_type !== "Super Admin" && campus_id) {
                query.campus_id = campus_id;
            }

            // Parse query parameters
            const url = new URL(c.req.url);
            const userTypeParam = url.searchParams.get("user_type");
            const isActiveParam = url.searchParams.get("is_active");
            const limitParam = url.searchParams.get("limit");
            const skipParam = url.searchParams.get("skip");

            if (userTypeParam) query.user_type = userTypeParam;
            if (isActiveParam !== null) query.is_active = isActiveParam === "true";
            if (limitParam) query.limit = parseInt(limitParam, 10);
            if (skipParam) query.skip = parseInt(skipParam, 10);

            const result = await UserService.getUsers(query);

            return c.json({
                success: true,
                message: "Users retrieved successfully",
                data: result
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Get One
    public static readonly getUser = async (c: Context) => {
        try {
            const { id } = c.req.param();

            if (!id) {
                throw new ValidationError("User ID is required");
            }

            const user = await UserService.getUser(id);

            return c.json({
                success: true,
                message: "User retrieved successfully",
                data: user
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Update
    public static readonly updateUsers = async (c: Context) => {
        try {
            const { id } = c.req.param();
            const updateData = await c.req.json();

            if (!id) {
                throw new ValidationError("User ID is required");
            }

            const result = await UserService.updateUsers(id, updateData);

            return c.json({
                success: true,
                ...result
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof ConflictError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "conflict_error"
                }, 409);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Delete (Soft Delete)
    public static readonly deleteUsers = async (c: Context) => {
        try {
            const { id } = c.req.param();

            if (!id) {
                throw new ValidationError("User ID is required");
            }

            const result = await UserService.softDeleteUser(id);

            return c.json({
                success: true,
                ...result
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Update Password
    public static readonly updatePassword = async (c: Context) => {
        try {
            const { id } = c.req.param();
            const passwordData = await c.req.json();

            if (!id) {
                throw new ValidationError("User ID is required");
            }

            const result = await UserService.updatePassword(id, passwordData);

            return c.json({
                success: true,
                ...result
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Get Parents for Student
    public static readonly getParentsForStudent = async (c: Context) => {
        try {
            const { student_id } = c.req.param();

            if (!student_id) {
                throw new ValidationError("Student ID is required");
            }

            const parents = await UserService.getParentForStudent(student_id);

            return c.json({
                success: true,
                message: "Parents retrieved successfully",
                data: parents
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Get Students for Parent
    public static readonly getStudentsForParent = async (c: Context) => {
        try {
            const { parent_id } = c.req.param();

            if (!parent_id) {
                throw new ValidationError("Parent ID is required");
            }

            const students = await UserService.getStudentForParent(parent_id);

            return c.json({
                success: true,
                message: "Students retrieved successfully",
                data: students
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };

    // Toggle User Status (Activate/Deactivate)
    public static readonly toggleUserStatus = async (c: Context) => {
        try {
            const { id } = c.req.param();
            const { is_active } = await c.req.json();

            if (!id) {
                throw new ValidationError("User ID is required");
            }

            if (typeof is_active !== "boolean") {
                throw new ValidationError("is_active must be a boolean value");
            }

            const result = await UserService.toggleUserStatus(id, is_active);

            return c.json({
                success: true,
                ...result
            });

        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "validation_error"
                }, 400);
            }

            if (error instanceof NotFoundError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "not_found_error"
                }, 404);
            }

            if (error instanceof AppError) {
                return c.json({
                    success: false,
                    message: error.message,
                    error_type: "app_error"
                }, error.statusCode as any);
            }

            return c.json({
                success: false,
                message: "Internal server error",
                error_type: "internal_error"
            }, 500);
        }
    };
}
