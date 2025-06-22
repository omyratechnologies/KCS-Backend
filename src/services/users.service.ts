/* eslint-disable unicorn/no-array-method-this-argument */
import crypto from "node:crypto";

import { FindOptions } from "ottoman";

import { IUser, User } from "@/models/user.model";
import { 
    ValidationError, 
    NotFoundError, 
    ConflictError, 
    DatabaseError 
} from "@/utils/errors";
import { 
    CreateUserData, 
    UpdateUserData, 
    UpdatePasswordData,
    GetUsersQuery,
    createUserSchema,
    updateUserSchema,
    updatePasswordSchema,
    getUsersQuerySchema
} from "@/utils/validation";

export class UserService {
    private static readonly SALT_ROUNDS = 12;
    private static readonly DEFAULT_LIMIT = 100;
    private static readonly MAX_LIMIT = 1000;

    /**
     * Validates input data using Zod schema
     */
    private static validateInput<T>(schema: any, data: unknown): T {
        const result = schema.safeParse(data);
        if (!result.success) {
            const errorMessages = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
        }
        return result.data;
    }

    /**
     * Checks if a user exists by email or user_id to prevent duplicates
     */
    private static async checkForDuplicates(
        email: string, 
        user_id: string, 
        excludeId?: string
    ): Promise<void> {
        try {
            // Check for duplicate email
            const emailQuery: any = { email: email.toLowerCase(), is_deleted: false };
            if (excludeId) {
                emailQuery.id = { $ne: excludeId };
            }

            const existingUserByEmail = await User.findOne(emailQuery);
            if (existingUserByEmail) {
                throw new ConflictError(`User with email '${email}' already exists`);
            }

            // Check for duplicate user_id
            const userIdQuery: any = { user_id, is_deleted: false };
            if (excludeId) {
                userIdQuery.id = { $ne: excludeId };
            }

            const existingUserByUserId = await User.findOne(userIdQuery);
            if (existingUserByUserId) {
                throw new ConflictError(`User with user_id '${user_id}' already exists`);
            }
        } catch (error) {
            if (error instanceof ConflictError) {
                throw error;
            }
            throw new DatabaseError("Failed to check for duplicate users");
        }
    }

    /**
     * Hashes password using crypto (maintaining consistency with existing codebase)
     */
    private static hashPassword(password: string): { hash: string; salt: string } {
        try {
            const salt = crypto.randomBytes(16).toString("hex");
            const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
            return { hash, salt };
        } catch (error) {
            throw new DatabaseError("Failed to hash password");
        }
    }

    /**
     * Validates if user exists and is active
     */
    private static async validateUserExists(id: string): Promise<IUser> {
        if (!id || typeof id !== 'string') {
            throw new ValidationError("Valid user ID is required");
        }

        try {
            const user = await User.findById(id);
            if (!user) {
                throw new NotFoundError(`User with ID '${id}' not found`);
            }

            if (user.is_deleted) {
                throw new NotFoundError(`User with ID '${id}' has been deleted`);
            }

            return user;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve user");
        }
    }

    // Create
    public static readonly createUsers = async (userData: CreateUserData) => {
        // Validate input data
        const validatedData = this.validateInput<CreateUserData>(createUserSchema, userData);

        try {
            // Check for duplicates
            await this.checkForDuplicates(validatedData.email, validatedData.user_id);

            // Hash password
            const { hash, salt } = this.hashPassword(validatedData.password);

            // Prepare user data
            const newUser = {
                user_id: validatedData.user_id,
                email: validatedData.email.toLowerCase(),
                hash,
                salt,
                first_name: validatedData.first_name.trim(),
                last_name: validatedData.last_name.trim(),
                phone: validatedData.phone,
                address: validatedData.address.trim(),
                meta_data: validatedData.meta_data || "{}",
                is_active: true,
                is_deleted: false,
                user_type: validatedData.user_type,
                campus_id: validatedData.campus_id || "",
                created_at: new Date(),
                updated_at: new Date(),
            };

            const createdUser = await User.create(newUser);
            if (!createdUser) {
                throw new DatabaseError("Failed to create user");
            }

            // Remove sensitive data before returning
            const { hash: _, salt: __, ...userResponse } = createdUser;
            return userResponse;

        } catch (error) {
            if (error instanceof ValidationError || error instanceof ConflictError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to create user: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Get All
    public static readonly getUsers = async (query: Partial<GetUsersQuery> = {}) => {
        // Validate query parameters
        const validatedQuery = this.validateInput<GetUsersQuery>(getUsersQuerySchema, query);

        try {
            // Build filter
            const filter: any = { is_deleted: false };
            
            if (validatedQuery.campus_id) {
                filter.campus_id = validatedQuery.campus_id;
            }
            
            if (validatedQuery.user_type) {
                filter.user_type = validatedQuery.user_type;
            }

            if (validatedQuery.is_active !== undefined) {
                filter.is_active = validatedQuery.is_active;
            }

            // Set up options with validation
            const options: FindOptions = {
                sort: {
                    created_at: "DESC",
                },
                limit: Math.min(validatedQuery.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT),
                skip: validatedQuery.skip || 0,
                select: [
                    "id",
                    "user_id",
                    "email",
                    "first_name",
                    "last_name",
                    "phone",
                    "address",
                    "last_login",
                    "meta_data",
                    "is_active",
                    "is_deleted",
                    "user_type",
                    "campus_id",
                    "created_at",
                    "updated_at",
                ],
            };

            const data: { rows: IUser[] } = await User.find(filter, options);

            if (!data || !data.rows) {
                throw new DatabaseError("Failed to retrieve users from database");
            }

            return {
                users: data.rows,
                total: data.rows.length,
                limit: options.limit,
                skip: options.skip,
                filters_applied: filter
            };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve users: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Get One
    public static readonly getUser = async (id: string): Promise<IUser> => {
        const user = await this.validateUserExists(id);

        try {
            // Return user without sensitive data
            const userWithoutSensitiveData = await User.findById(id, {
                select: [
                    "id",
                    "user_id",
                    "email",
                    "first_name",
                    "last_name",
                    "phone",
                    "address",
                    "last_login",
                    "meta_data",
                    "is_active",
                    "is_deleted",
                    "user_type",
                    "campus_id",
                    "created_at",
                    "updated_at",
                ],
            });

            if (!userWithoutSensitiveData) {
                throw new NotFoundError(`User with ID '${id}' not found`);
            }

            return userWithoutSensitiveData;

        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve user: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Update
    public static readonly updateUsers = async (
        id: string,
        userData: Partial<UpdateUserData>
    ): Promise<{ message: string; user: Partial<IUser> }> => {
        // Validate user exists first
        const existingUser = await this.validateUserExists(id);

        // Validate update data
        const validatedData = this.validateInput<UpdateUserData>(updateUserSchema, userData);

        try {
            // Check for duplicates if email or user_id is being updated
            if (validatedData.email || validatedData.user_id) {
                await this.checkForDuplicates(
                    validatedData.email || existingUser.email,
                    validatedData.user_id || existingUser.user_id,
                    id
                );
            }

            // Prepare update data
            const updateData: any = {
                ...validatedData,
                updated_at: new Date(),
            };

            // Normalize email if provided
            if (updateData.email) {
                updateData.email = updateData.email.toLowerCase();
            }

            // Trim string fields if provided
            if (updateData.first_name) {
                updateData.first_name = updateData.first_name.trim();
            }
            if (updateData.last_name) {
                updateData.last_name = updateData.last_name.trim();
            }
            if (updateData.address) {
                updateData.address = updateData.address.trim();
            }

            const updatedUser = await User.updateById(id, updateData);

            if (!updatedUser) {
                throw new DatabaseError("Failed to update user");
            }

            // Return success message and updated user (without sensitive data)
            const { hash, salt, ...userResponse } = updatedUser;
            return {
                message: "User updated successfully",
                user: userResponse
            };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof ConflictError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to update user: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Soft Delete (recommended over hard delete)
    public static readonly softDeleteUser = async (id: string): Promise<{ message: string }> => {
        // Validate user exists
        await this.validateUserExists(id);

        try {
            const updatedUser = await User.updateById(id, {
                is_deleted: true,
                is_active: false,
                updated_at: new Date(),
            });

            if (!updatedUser) {
                throw new DatabaseError("Failed to delete user");
            }

            return { message: "User deleted successfully" };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to delete user: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Hard Delete (maintain backward compatibility)
    public static readonly deleteUsers = async (id: string): Promise<{ message: string }> => {
        // Validate user exists
        await this.validateUserExists(id);

        try {
            await User.removeById(id);
            return { message: "User permanently deleted successfully" };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to permanently delete user: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Update Password
    public static readonly updatePassword = async (
        id: string,
        passwordData: UpdatePasswordData
    ): Promise<{ message: string }> => {
        // Validate user exists
        await this.validateUserExists(id);

        // Validate password data
        const validatedData = this.validateInput<UpdatePasswordData>(updatePasswordSchema, passwordData);

        try {
            // Hash new password
            const { hash, salt } = this.hashPassword(validatedData.password);

            const updatedUser = await User.updateById(id, {
                hash,
                salt,
                updated_at: new Date(),
            });

            if (!updatedUser) {
                throw new DatabaseError("Failed to update password");
            }

            return { message: "Password updated successfully" };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to update password: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Get Parent for Student
    public static readonly getParentForStudent = async (
        student_id: string
    ): Promise<IUser[]> => {
        if (!student_id || typeof student_id !== 'string') {
            throw new ValidationError("Valid student ID is required");
        }

        try {
            const data: { rows: IUser[] } = await User.find({
                user_type: "Parent",
                "meta_data.student_id": [student_id],
                is_active: true,
                is_deleted: false,
            });

            if (!data || !data.rows) {
                throw new DatabaseError("Failed to retrieve parents from database");
            }

            return data.rows;

        } catch (error) {
            if (error instanceof ValidationError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve parents for student: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Get Student for Parent
    public static readonly getStudentForParent = async (
        parent_id: string
    ): Promise<IUser[]> => {
        if (!parent_id || typeof parent_id !== 'string') {
            throw new ValidationError("Valid parent ID is required");
        }

        try {
            // First, get the parent to extract student IDs from their meta_data
            const parentData: { rows: IUser[] } = await User.find({
                id: parent_id,
                user_type: "Parent",
                is_active: true,
                is_deleted: false,
            });

            if (!parentData || !parentData.rows || parentData.rows.length === 0) {
                throw new NotFoundError("Parent not found or is not active");
            }

            const parent = parentData.rows[0];
            
            // Extract student IDs from parent's meta_data
            const studentIds = (parent.meta_data as any)?.student_id;
            
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                return []; // Return empty array instead of throwing error for better UX
            }

            // Validate student IDs are strings
            const validStudentIds = studentIds.filter(id => typeof id === 'string' && id.length > 0);
            
            if (validStudentIds.length === 0) {
                return [];
            }

            // Query students by the IDs found in parent's meta_data
            const data: { rows: IUser[] } = await User.find({
                id: { $in: validStudentIds },
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            });

            if (!data || !data.rows) {
                throw new DatabaseError("Failed to retrieve students from database");
            }

            return data.rows;

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve students for parent: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Utility method to activate/deactivate user
    public static readonly toggleUserStatus = async (
        id: string, 
        isActive: boolean
    ): Promise<{ message: string; user: Partial<IUser> }> => {
        // Validate user exists
        await this.validateUserExists(id);

        try {
            const updatedUser = await User.updateById(id, {
                is_active: isActive,
                updated_at: new Date(),
            });

            if (!updatedUser) {
                throw new DatabaseError("Failed to update user status");
            }

            const { hash, salt, ...userResponse } = updatedUser;
            return {
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                user: userResponse
            };

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to update user status: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Utility method to get users by type and campus
    public static readonly getUsersByTypeAndCampus = async (
        user_type: string,
        campus_id: string,
        options: { includeInactive?: boolean; limit?: number; skip?: number } = {}
    ): Promise<IUser[]> => {
        if (!user_type || !campus_id) {
            throw new ValidationError("User type and campus ID are required");
        }

        try {
            const filter: any = {
                user_type,
                campus_id,
                is_deleted: false,
            };

            if (!options.includeInactive) {
                filter.is_active = true;
            }

            const findOptions: FindOptions = {
                sort: { created_at: "DESC" },
                limit: Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT),
                skip: options.skip || 0,
                select: [
                    "id", "user_id", "email", "first_name", "last_name",
                    "phone", "address", "meta_data", "is_active", "user_type",
                    "campus_id", "created_at", "updated_at"
                ],
            };

            const data: { rows: IUser[] } = await User.find(filter, findOptions);

            if (!data || !data.rows) {
                throw new DatabaseError("Failed to retrieve users from database");
            }

            return data.rows;

        } catch (error) {
            if (error instanceof ValidationError || error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError("Failed to retrieve users by type and campus: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Utility method to check if user exists by email or user_id
    public static readonly checkUserExists = async (
        identifier: string,
        type: 'email' | 'user_id' = 'email'
    ): Promise<boolean> => {
        if (!identifier) {
            throw new ValidationError("Identifier is required");
        }

        try {
            const query: any = { is_deleted: false };
            query[type] = type === 'email' ? identifier.toLowerCase() : identifier;

            const user = await User.findOne(query);
            return !!user;

        } catch (error) {
            throw new DatabaseError("Failed to check user existence: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };
}
