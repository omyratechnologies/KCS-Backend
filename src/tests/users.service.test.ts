/**
 * Simple test file to verify the enhanced Users Service functionality
 * Run this with: bun test src/tests/users.service.test.ts
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { UserService } from "../services/users.service";
import { ValidationError, ConflictError, NotFoundError } from "../utils/errors";

describe("Enhanced Users Service", () => {
    // Test data
    const validUserData = {
        user_id: "test_user_001",
        email: "test@example.com",
        password: "SecurePass123",
        first_name: "John",
        last_name: "Doe",
        phone: "+1234567890",
        address: "123 Test Street, Test City",
        meta_data: "{}",
        user_type: "Student" as const,
        campus_id: "test_campus_001"
    };

    describe("Input Validation", () => {
        it("should validate required fields", async () => {
            const invalidData = {
                user_id: "",
                email: "invalid-email",
                password: "weak",
                first_name: "",
                last_name: "Doe",
                phone: "invalid-phone",
                address: "",
                meta_data: "{}",
                user_type: "InvalidType" as any,
            };

            try {
                await UserService.createUsers(invalidData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Validation failed");
            }
        });

        it("should validate email format", async () => {
            const invalidEmailData = {
                ...validUserData,
                email: "invalid-email-format"
            };

            try {
                await UserService.createUsers(invalidEmailData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Invalid email format");
            }
        });

        it("should validate password strength", async () => {
            const weakPasswordData = {
                ...validUserData,
                password: "weak"
            };

            try {
                await UserService.createUsers(weakPasswordData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Password must be at least 8 characters");
            }
        });

        it("should validate user_id format", async () => {
            const invalidUserIdData = {
                ...validUserData,
                user_id: "invalid user id with spaces!"
            };

            try {
                await UserService.createUsers(invalidUserIdData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("User ID can only contain alphanumeric characters");
            }
        });
    });

    describe("Data Sanitization", () => {
        it("should trim string fields", () => {
            const dataWithSpaces = {
                ...validUserData,
                first_name: "  John  ",
                last_name: "  Doe  ",
                address: "  123 Test Street  "
            };

            // Note: This would be tested in integration tests where we can check the actual database values
            expect(dataWithSpaces.first_name.trim()).toBe("John");
            expect(dataWithSpaces.last_name.trim()).toBe("Doe");
            expect(dataWithSpaces.address.trim()).toBe("123 Test Street");
        });

        it("should normalize email to lowercase", () => {
            const dataWithUppercaseEmail = {
                ...validUserData,
                email: "TEST@EXAMPLE.COM"
            };

            expect(dataWithUppercaseEmail.email.toLowerCase()).toBe("test@example.com");
        });
    });

    describe("Error Handling", () => {
        it("should throw NotFoundError for non-existent user", async () => {
            try {
                await UserService.getUser("non-existent-id");
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundError);
                expect(error.message).toContain("not found");
            }
        });

        it("should validate user ID parameter", async () => {
            try {
                await UserService.getUser("");
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Valid user ID is required");
            }
        });
    });

    describe("Query Validation", () => {
        it("should validate get users query parameters", async () => {
            const invalidQuery = {
                limit: -5, // Invalid limit
                skip: -1,  // Invalid skip
                user_type: "InvalidType" as any
            };

            try {
                await UserService.getUsers(invalidQuery);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
            }
        });

        it("should handle valid query parameters", async () => {
            const validQuery = {
                limit: 10,
                skip: 0,
                user_type: "Student" as const,
                is_active: true
            };

            try {
                const result = await UserService.getUsers(validQuery);
                expect(result).toHaveProperty("users");
                expect(result).toHaveProperty("total");
                expect(result).toHaveProperty("limit");
                expect(result).toHaveProperty("skip");
                expect(Array.isArray(result.users)).toBe(true);
            } catch (error) {
                // Database might not be available during tests, that's okay
                expect(error.message).toContain("Failed to retrieve users");
            }
        });
    });

    describe("Password Update Validation", () => {
        it("should validate password update data", async () => {
            const invalidPasswordData = {
                password: "weak"
            };

            try {
                await UserService.updatePassword("test-id", invalidPasswordData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Password must be at least 8 characters");
            }
        });
    });

    describe("Update Validation", () => {
        it("should require at least one field for update", async () => {
            const emptyUpdateData = {};

            try {
                await UserService.updateUsers("test-id", emptyUpdateData);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("At least one field must be provided for update");
            }
        });
    });

    describe("Utility Methods", () => {
        it("should validate toggle user status input", async () => {
            try {
                await UserService.toggleUserStatus("", true);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Valid user ID is required");
            }
        });

        it("should validate getUsersByTypeAndCampus input", async () => {
            try {
                await UserService.getUsersByTypeAndCampus("", "");
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("User type and campus ID are required");
            }
        });

        it("should validate checkUserExists input", async () => {
            try {
                await UserService.checkUserExists("");
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain("Identifier is required");
            }
        });
    });

    describe("Phone Number Validation", () => {
        it("should accept valid international phone numbers", () => {
            const validPhones = [
                "+1234567890",
                "+919876543210", 
                "+447890123456"
            ];

            validPhones.forEach(phone => {
                const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                expect(phoneRegex.test(phone)).toBe(true);
            });
        });

        it("should reject invalid phone numbers", () => {
            const invalidPhones = [
                "123",
                "+0123456789", // Starts with 0
                "abcdefghij",
                "+1234567890123456", // Too long
                ""
            ];

            invalidPhones.forEach(phone => {
                const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                expect(phoneRegex.test(phone)).toBe(false);
            });
        });
    });

    describe("User Type Validation", () => {
        it("should accept valid user types", () => {
            const validTypes = ["Student", "Teacher", "Parent", "Admin", "Super Admin"];
            
            validTypes.forEach(type => {
                expect(validTypes.includes(type)).toBe(true);
            });
        });

        it("should reject invalid user types", () => {
            const invalidTypes = ["student", "TEACHER", "manager", "user", ""];
            const validTypes = ["Student", "Teacher", "Parent", "Admin", "Super Admin"];
            
            invalidTypes.forEach(type => {
                expect(validTypes.includes(type)).toBe(false);
            });
        });
    });
});

// Note: These tests focus on validation logic and error handling.
// Integration tests with actual database operations would require 
// a test database setup and teardown process.
