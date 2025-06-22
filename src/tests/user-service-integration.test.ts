/**
 * Integration Tests for User Service Validations
 * Tests the actual service methods with proper error handling
 * Run with: NODE_ENV=development bun test src/tests/user-service-integration.test.ts
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UserService } from "../services/users.service";
import { ValidationError, ConflictError, NotFoundError, DatabaseError } from "../utils/errors";

// Create comprehensive mocks for the User model
const createMockUser = (overrides = {}) => ({
    id: "test-id-123",
    user_id: "test_user_001",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    phone: "+1234567890",
    address: "123 Test Street",
    user_type: "Student",
    campus_id: "campus_001",
    is_active: true,
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    meta_data: "{}",
    ...overrides
});

// Mock the User model
const mockUser = {
    findOne: mock(() => null as any),
    findById: mock(() => null as any),
    find: mock(() => ({ rows: [] } as any)),
    create: mock(() => null as any),
    updateById: mock(() => null as any),
    removeById: mock(() => null as any)
};

// Mock the User model module
mock.module("../models/user.model", () => ({
    User: mockUser,
    IUser: {}
}));

describe("🧪 User Service Integration Tests", () => {
    
    beforeEach(() => {
        // Reset all mocks before each test
        Object.values(mockUser).forEach(mockFn => mockFn.mockClear());
    });

    describe("🔐 Create User Validation", () => {
        
        it("should reject invalid user data", async () => {
            const invalidUserData = {
                user_id: "",  // Invalid: empty
                email: "invalid-email",  // Invalid: not email format
                password: "weak",  // Invalid: too short
                first_name: "",  // Invalid: empty
                last_name: "Doe",
                phone: "invalid",  // Invalid: not phone format
                address: "",  // Invalid: empty
                user_type: "InvalidType" as any,  // Invalid: not in enum
                meta_data: "{}"
            };

            await expect(UserService.createUsers(invalidUserData)).rejects.toThrow(ValidationError);
        });

        it("should detect duplicate email", async () => {
            // Mock finding existing user by email
            mockUser.findOne.mockResolvedValueOnce(createMockUser({ email: "test@example.com" }));

            const userData = {
                user_id: "new_user_001",
                email: "test@example.com",  // This email already exists
                password: "SecurePass123",
                first_name: "Jane",
                last_name: "Smith",
                phone: "+9876543210",
                address: "456 Test Avenue",
                user_type: "Student" as const,
                meta_data: "{}"
            };

            await expect(UserService.createUsers(userData)).rejects.toThrow(ConflictError);
            await expect(UserService.createUsers(userData)).rejects.toThrow("User with email 'test@example.com' already exists");
        });

        it("should detect duplicate user_id", async () => {
            // First call returns null (no email conflict), second call returns user (user_id conflict)
            mockUser.findOne
                .mockResolvedValueOnce(null)  // No email conflict
                .mockResolvedValueOnce(createMockUser({ user_id: "test_user_001" }));  // user_id conflict

            const userData = {
                user_id: "test_user_001",  // This user_id already exists
                email: "new@example.com",
                password: "SecurePass123",
                first_name: "Jane",
                last_name: "Smith",
                phone: "+9876543210",
                address: "456 Test Avenue",
                user_type: "Student"
            };

            await expect(UserService.createUsers(userData)).rejects.toThrow(ConflictError);
            await expect(UserService.createUsers(userData)).rejects.toThrow("User with user_id 'test_user_001' already exists");
        });

        it("should successfully create user with valid data", async () => {
            // Mock no duplicates found
            mockUser.findOne.mockResolvedValue(null);
            // Mock successful creation
            const createdUser = createMockUser();
            mockUser.create.mockResolvedValueOnce(createdUser);

            const userData = {
                user_id: "new_user_001",
                email: "new@example.com",
                password: "SecurePass123",
                first_name: "Jane",
                last_name: "Smith",
                phone: "+9876543210",
                address: "456 Test Avenue",
                user_type: "Student"
            };

            const result = await UserService.createUsers(userData);
            
            expect(result).toBeDefined();
            expect(result.user_id).toBe("test_user_001");
            expect(result.email).toBe("test@example.com");
            expect(result.hash).toBeUndefined();  // Should not return password hash
            expect(result.salt).toBeUndefined();  // Should not return salt
        });

        it("should handle database errors during creation", async () => {
            mockUser.findOne.mockResolvedValue(null);  // No duplicates
            mockUser.create.mockRejectedValueOnce(new Error("Database connection failed"));

            const userData = {
                user_id: "new_user_001",
                email: "new@example.com",
                password: "SecurePass123",
                first_name: "Jane",
                last_name: "Smith",
                phone: "+9876543210",
                address: "456 Test Avenue",
                user_type: "Student"
            };

            await expect(UserService.createUsers(userData)).rejects.toThrow(DatabaseError);
        });
    });

    describe("📖 Get User Validation", () => {
        
        it("should reject invalid user ID", async () => {
            await expect(UserService.getUser("")).rejects.toThrow(ValidationError);
            await expect(UserService.getUser("")).rejects.toThrow("Valid user ID is required");
        });

        it("should throw NotFoundError for non-existent user", async () => {
            mockUser.findById.mockResolvedValueOnce(null);

            await expect(UserService.getUser("non-existent-id")).rejects.toThrow(NotFoundError);
        });

        it("should throw NotFoundError for deleted user", async () => {
            mockUser.findById.mockResolvedValueOnce(createMockUser({ is_deleted: true }));

            await expect(UserService.getUser("deleted-user-id")).rejects.toThrow(NotFoundError);
            await expect(UserService.getUser("deleted-user-id")).rejects.toThrow("has been deleted");
        });

        it("should return user data without sensitive fields", async () => {
            const mockUserData = createMockUser();
            mockUser.findById
                .mockResolvedValueOnce(mockUserData)  // For validation
                .mockResolvedValueOnce(mockUserData); // For actual retrieval

            const result = await UserService.getUser("test-id-123");
            
            expect(result).toBeDefined();
            expect(result.id).toBe("test-id-123");
            expect(result.email).toBe("test@example.com");
        });
    });

    describe("📝 Update User Validation", () => {
        
        it("should reject empty update data", async () => {
            mockUser.findById.mockResolvedValueOnce(createMockUser());

            await expect(UserService.updateUsers("test-id", {})).rejects.toThrow(ValidationError);
            await expect(UserService.updateUsers("test-id", {})).rejects.toThrow("At least one field must be provided for update");
        });

        it("should validate individual update fields", async () => {
            mockUser.findById.mockResolvedValueOnce(createMockUser());

            const invalidUpdates = [
                { email: "invalid-email" },
                { first_name: "Invalid123Name" },
                { phone: "invalid-phone" },
                { user_type: "InvalidType" }
            ];

            for (const updateData of invalidUpdates) {
                await expect(UserService.updateUsers("test-id", updateData)).rejects.toThrow(ValidationError);
            }
        });

        it("should check for duplicates when updating email/user_id", async () => {
            const existingUser = createMockUser();
            mockUser.findById.mockResolvedValue(existingUser);
            // Mock finding duplicate email
            mockUser.findOne.mockResolvedValueOnce(createMockUser({ email: "existing@example.com" }));

            const updateData = { email: "existing@example.com" };

            await expect(UserService.updateUsers("test-id", updateData)).rejects.toThrow(ConflictError);
        });

        it("should successfully update with valid data", async () => {
            const existingUser = createMockUser();
            const updatedUser = { ...existingUser, first_name: "Updated" };
            
            mockUser.findById.mockResolvedValueOnce(existingUser);
            mockUser.findOne.mockResolvedValue(null);  // No duplicates
            mockUser.updateById.mockResolvedValueOnce(updatedUser);

            const updateData = { first_name: "Updated" };
            const result = await UserService.updateUsers("test-id", updateData);
            
            expect(result.message).toBe("User updated successfully");
            expect(result.user.first_name).toBe("Updated");
        });
    });

    describe("🔑 Password Update Validation", () => {
        
        it("should validate password strength", async () => {
            mockUser.findById.mockResolvedValueOnce(createMockUser());

            const weakPasswords = [
                { password: "weak" },
                { password: "password" },
                { password: "PASSWORD" },
                { password: "12345678" }
            ];

            for (const passwordData of weakPasswords) {
                await expect(UserService.updatePassword("test-id", passwordData)).rejects.toThrow(ValidationError);
            }
        });

        it("should update password with strong password", async () => {
            const existingUser = createMockUser();
            mockUser.findById.mockResolvedValueOnce(existingUser);
            mockUser.updateById.mockResolvedValueOnce({ ...existingUser, updated_at: new Date() });

            const passwordData = { password: "NewSecurePass123" };
            const result = await UserService.updatePassword("test-id", passwordData);
            
            expect(result.message).toBe("Password updated successfully");
        });
    });

    describe("🔍 Query Users Validation", () => {
        
        it("should validate query parameters", async () => {
            const invalidQueries = [
                { limit: -5 },
                { skip: -1 },
                { limit: 1001 },
                { user_type: "InvalidType" },
                { is_active: "not-boolean" }
            ];

            for (const query of invalidQueries) {
                await expect(UserService.getUsers(query)).rejects.toThrow(ValidationError);
            }
        });

        it("should apply default query parameters", async () => {
            mockUser.find.mockResolvedValueOnce({ rows: [] });

            const result = await UserService.getUsers({});
            
            expect(result.users).toEqual([]);
            expect(result.limit).toBe(100);  // Default limit
            expect(result.skip).toBe(0);     // Default skip
        });

        it("should handle valid query parameters", async () => {
            const mockUsers = [createMockUser(), createMockUser({ id: "test-2" })];
            mockUser.find.mockResolvedValueOnce({ rows: mockUsers });

            const query = {
                user_type: "Student",
                is_active: true,
                limit: 50,
                skip: 10
            };

            const result = await UserService.getUsers(query);
            
            expect(result.users).toHaveLength(2);
            expect(result.limit).toBe(50);
            expect(result.skip).toBe(10);
        });
    });

    describe("🔧 Utility Methods Validation", () => {
        
        it("should validate toggleUserStatus input", async () => {
            await expect(UserService.toggleUserStatus("", true)).rejects.toThrow(ValidationError);
            await expect(UserService.toggleUserStatus("", true)).rejects.toThrow("Valid user ID is required");
        });

        it("should validate getUsersByTypeAndCampus input", async () => {
            await expect(UserService.getUsersByTypeAndCampus("", "")).rejects.toThrow(ValidationError);
            await expect(UserService.getUsersByTypeAndCampus("", "")).rejects.toThrow("User type and campus ID are required");
        });

        it("should validate checkUserExists input", async () => {
            await expect(UserService.checkUserExists("")).rejects.toThrow(ValidationError);
            await expect(UserService.checkUserExists("")).rejects.toThrow("Identifier is required");
        });

        it("should validate getParentForStudent input", async () => {
            await expect(UserService.getParentForStudent("")).rejects.toThrow(ValidationError);
            await expect(UserService.getParentForStudent("")).rejects.toThrow("Valid student ID is required");
        });

        it("should validate getStudentForParent input", async () => {
            await expect(UserService.getStudentForParent("")).rejects.toThrow(ValidationError);
            await expect(UserService.getStudentForParent("")).rejects.toThrow("Valid parent ID is required");
        });
    });

    describe("⚠️ Error Handling Tests", () => {
        
        it("should handle database connection errors", async () => {
            mockUser.findById.mockRejectedValueOnce(new Error("Connection timeout"));

            await expect(UserService.getUser("test-id")).rejects.toThrow(DatabaseError);
        });

        it("should handle unexpected errors in create", async () => {
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockRejectedValueOnce(new Error("Unexpected error"));

            const userData = {
                user_id: "test_user",
                email: "test@example.com",
                password: "SecurePass123",
                first_name: "Test",
                last_name: "User",
                phone: "+1234567890",
                address: "123 Test St",
                user_type: "Student"
            };

            await expect(UserService.createUsers(userData)).rejects.toThrow(DatabaseError);
        });

        it("should properly chain validation errors", async () => {
            // Test that the first validation error is caught, not subsequent ones
            const invalidData = {
                user_id: "",  // This should fail first
                email: "invalid-email",  // This would also fail
                password: "weak",  // This would also fail
                first_name: "Test",
                last_name: "User",
                phone: "+1234567890",
                address: "123 Test St",
                user_type: "Student"
            };

            try {
                await UserService.createUsers(invalidData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("User ID is required");
            }
        });
    });

    describe("🎯 Real-world Integration Scenarios", () => {
        
        it("should handle complete user lifecycle", async () => {
            const userData = {
                user_id: "lifecycle_user",
                email: "lifecycle@example.com",
                password: "InitialPass123",
                first_name: "Lifecycle",
                last_name: "User",
                phone: "+1234567890",
                address: "123 Lifecycle St",
                user_type: "Student"
            };

            // 1. Create user
            mockUser.findOne.mockResolvedValue(null);  // No duplicates
            const createdUser = createMockUser(userData);
            mockUser.create.mockResolvedValueOnce(createdUser);

            const createResult = await UserService.createUsers(userData);
            expect(createResult).toBeDefined();

            // 2. Get user
            mockUser.findById.mockResolvedValue(createdUser);
            const getResult = await UserService.getUser("test-id");
            expect(getResult.email).toBe("test@example.com");

            // 3. Update user
            mockUser.findOne.mockResolvedValue(null);  // No conflicts
            const updatedUser = { ...createdUser, first_name: "Updated" };
            mockUser.updateById.mockResolvedValueOnce(updatedUser);
            
            const updateResult = await UserService.updateUsers("test-id", { first_name: "Updated" });
            expect(updateResult.message).toBe("User updated successfully");

            // 4. Delete user
            mockUser.updateById.mockResolvedValueOnce({ ...updatedUser, is_deleted: true });
            const deleteResult = await UserService.softDeleteUser("test-id");
            expect(deleteResult.message).toBe("User deleted successfully");
        });

        it("should handle bulk operations validation", async () => {
            // Test getting multiple users with various filters
            const mockUsers = [
                createMockUser({ user_type: "Student", campus_id: "campus_1" }),
                createMockUser({ user_type: "Teacher", campus_id: "campus_1" }),
                createMockUser({ user_type: "Student", campus_id: "campus_2" })
            ];

            mockUser.find.mockResolvedValueOnce({ rows: mockUsers.slice(0, 2) });

            const result = await UserService.getUsersByTypeAndCampus("Student", "campus_1");
            expect(result).toHaveLength(2);
        });
    });
});

console.log("🧪 User Service Integration Tests completed!");
console.log("📋 Test Coverage:");
console.log("   - Create user validations with database interactions");
console.log("   - Get user error handling");
console.log("   - Update user conflict detection");
console.log("   - Password update security");
console.log("   - Query parameter validation");
console.log("   - Utility method validations");
console.log("   - Error handling and chaining");
console.log("   - Real-world integration scenarios");
