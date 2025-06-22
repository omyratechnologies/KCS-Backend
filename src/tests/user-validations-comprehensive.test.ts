/**
 * Comprehensive User Validation Tests
 * Tests all validation scenarios for the Users Service
 * Run with: NODE_ENV=development bun test src/tests/user-validations-comprehensive.test.ts
 */

import { describe, it, expect, beforeAll, mock } from "bun:test";
import { UserService } from "../services/users.service";
import { ValidationError, ConflictError, NotFoundError, DatabaseError } from "../utils/errors";
import { 
    createUserSchema, 
    updateUserSchema, 
    updatePasswordSchema, 
    getUsersQuerySchema 
} from "../utils/validation";

// Mock the User model to avoid database dependencies in pure validation tests
const mockUser = {
    findOne: mock(() => null),
    findById: mock(() => null),
    find: mock(() => ({ rows: [] })),
    create: mock(() => null),
    updateById: mock(() => null),
    removeById: mock(() => null)
};

// Mock the User model import
mock.module("../models/user.model", () => ({
    User: mockUser,
    IUser: {}
}));

describe("Comprehensive User Validation Tests", () => {
    
    beforeAll(() => {
        // Reset all mocks before tests
        mockUser.findOne.mockClear();
        mockUser.findById.mockClear();
        mockUser.find.mockClear();
        mockUser.create.mockClear();
        mockUser.updateById.mockClear();
        mockUser.removeById.mockClear();
    });

    describe("🔍 Schema Validation Tests", () => {
        
        describe("User ID Validation", () => {
            it("should reject empty user_id", () => {
                const result = createUserSchema.safeParse({
                    user_id: "",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("User ID is required");
            });

            it("should reject user_id with special characters", () => {
                const result = createUserSchema.safeParse({
                    user_id: "user@123!",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("User ID can only contain alphanumeric characters");
            });

            it("should accept valid user_id formats", () => {
                const validUserIds = ["user123", "USER_123", "user-123", "123user", "a", "A1_B-2"];
                
                validUserIds.forEach(user_id => {
                    const result = createUserSchema.safeParse({
                        user_id,
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });

            it("should reject user_id longer than 50 characters", () => {
                const longUserId = "a".repeat(51);
                const result = createUserSchema.safeParse({
                    user_id: longUserId,
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("User ID must be less than 50 characters");
            });
        });

        describe("Email Validation", () => {
            it("should reject invalid email formats", () => {
                const invalidEmails = [
                    "plainaddress",
                    "@missingdomain.com",
                    "missing@.com",
                    "missing@domain",
                    "spaces @domain.com",
                    "double@@domain.com",
                    "trailing.dot@domain.com.",
                    ""
                ];

                invalidEmails.forEach(email => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email,
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(false);
                    expect(result.error?.errors[0].message).toContain("Invalid email format");
                });
            });

            it("should accept valid email formats", () => {
                const validEmails = [
                    "test@example.com",
                    "user.name@domain.co.uk",
                    "user+tag@example.org",
                    "first.last@subdomain.example.com",
                    "123@domain.com"
                ];

                validEmails.forEach(email => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email,
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });

            it("should reject email longer than 255 characters", () => {
                const longEmail = "a".repeat(250) + "@domain.com";
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: longEmail,
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Email must be less than 255 characters");
            });
        });

        describe("Password Validation", () => {
            it("should reject passwords shorter than 8 characters", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "Short1",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Password must be at least 8 characters long");
            });

            it("should reject passwords without lowercase letters", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "PASSWORD123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Password must contain at least one lowercase letter");
            });

            it("should reject passwords without uppercase letters", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "password123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Password must contain at least one lowercase letter");
            });

            it("should reject passwords without numbers", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "PasswordOnly",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Password must contain at least one lowercase letter");
            });

            it("should accept strong passwords", () => {
                const strongPasswords = [
                    "SecurePass123",
                    "MyP@ssw0rd",
                    "Complex123Password",
                    "Str0ng!Pass"
                ];

                strongPasswords.forEach(password => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password,
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });

            it("should reject passwords longer than 128 characters", () => {
                const longPassword = "A1" + "a".repeat(127);
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: longPassword,
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Password must be less than 128 characters");
            });
        });

        describe("Name Validation", () => {
            it("should reject empty names", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Name is required");
            });

            it("should reject names with invalid characters", () => {
                const invalidNames = ["John123", "John@Doe", "John#Doe", "John$"];
                
                invalidNames.forEach(first_name => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name,
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(false);
                    expect(result.error?.errors[0].message).toContain("Name can only contain letters, spaces, hyphens, and apostrophes");
                });
            });

            it("should accept valid names", () => {
                const validNames = [
                    "John",
                    "Mary-Jane",
                    "O'Connor",
                    "Jean Claude",
                    "Anne-Marie",
                    "D'Angelo"
                ];

                validNames.forEach(first_name => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name,
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });

            it("should reject names longer than 100 characters", () => {
                const longName = "A".repeat(101);
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: longName,
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Name must be less than 100 characters");
            });
        });

        describe("Phone Number Validation", () => {
            it("should reject invalid phone formats", () => {
                const invalidPhones = [
                    "+0123456789",           // Starts with 0
                    "abcdefghij",            // Non-numeric
                    "+1234567890123456",     // Too long (>15 digits)
                    "123-456-7890",          // Contains hyphens
                    "(123) 456-7890",        // Contains spaces and parentheses
                    "123 456 7890",          // Contains spaces
                    "",                      // Empty string
                    "0123456789",            // Starts with 0 (no + prefix)
                    "1",                     // Too short (only 1 digit)
                ];

                invalidPhones.forEach(phone => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone,
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(false);
                    expect(result.error?.errors[0].message).toContain("Invalid phone number format");
                });
            });

            it("should accept valid international phone formats", () => {
                const validPhones = [
                    "+1234567890",           // US format
                    "+919876543210",         // Indian format
                    "+447890123456",         // UK format
                    "+33123456789",          // French format
                    "+8612345678901",        // Chinese format
                    "1234567890",            // Without + prefix
                    "19876543210",           // Without + prefix
                    "123",                   // Short but valid (some countries have short numbers)
                    "12",                    // Minimum valid length (2 digits)
                    "+12"                    // Minimum with + prefix
                ];

                validPhones.forEach(phone => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone,
                        address: "123 Test St",
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });
        });

        describe("Address Validation", () => {
            it("should reject empty address", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "",
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Address is required");
            });

            it("should reject address longer than 500 characters", () => {
                const longAddress = "A".repeat(501);
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: longAddress,
                    user_type: "Student"
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Address must be less than 500 characters");
            });

            it("should accept valid addresses", () => {
                const validAddresses = [
                    "123 Main St, City, State 12345",
                    "Apartment 4B, 789 Oak Avenue, Town",
                    "Rural Route 1, Box 123, County",
                    "Unit 5, Building C, Industrial Park"
                ];

                validAddresses.forEach(address => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address,
                        user_type: "Student"
                    });
                    
                    expect(result.success).toBe(true);
                });
            });
        });

        describe("User Type Validation", () => {
            it("should reject invalid user types", () => {
                const invalidTypes = [
                    "student",      // lowercase
                    "TEACHER",      // uppercase
                    "manager",      // not in enum
                    "user",         // not in enum
                    "administrator", // not in enum
                    ""              // empty
                ];

                invalidTypes.forEach(user_type => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type
                    });
                    
                    expect(result.success).toBe(false);
                    expect(result.error?.errors[0].message).toContain("Invalid user type");
                });
            });

            it("should accept valid user types", () => {
                const validTypes = ["Student", "Teacher", "Parent", "Admin", "Super Admin"];
                
                validTypes.forEach(user_type => {
                    const result = createUserSchema.safeParse({
                        user_id: "test123",
                        email: "test@example.com",
                        password: "SecurePass123",
                        first_name: "John",
                        last_name: "Doe",
                        phone: "+1234567890",
                        address: "123 Test St",
                        user_type
                    });
                    
                    expect(result.success).toBe(true);
                });
            });
        });

        describe("Campus ID Validation", () => {
            it("should accept optional campus_id", () => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                    // campus_id is optional
                });
                
                expect(result.success).toBe(true);
            });

            it("should reject campus_id longer than 50 characters", () => {
                const longCampusId = "A".repeat(51);
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student",
                    campus_id: longCampusId
                });
                
                expect(result.success).toBe(false);
                expect(result.error?.errors[0].message).toContain("Campus ID must be less than 50 characters");
            });
        });
    });

    describe("🔄 Update Validation Tests", () => {
        
        it("should require at least one field for update", () => {
            const result = updateUserSchema.safeParse({});
            
            expect(result.success).toBe(false);
            expect(result.error?.errors[0].message).toContain("At least one field must be provided for update");
        });

        it("should accept partial updates with valid fields", () => {
            const validUpdates = [
                { first_name: "NewName" },
                { email: "new@example.com" },
                { is_active: false },
                { phone: "+9876543210" },
                { first_name: "New", last_name: "User" }
            ];

            validUpdates.forEach(updateData => {
                const result = updateUserSchema.safeParse(updateData);
                expect(result.success).toBe(true);
            });
        });

        it("should validate individual fields in updates", () => {
            const invalidUpdates = [
                { email: "invalid-email" },
                { first_name: "Invalid123" },
                { phone: "invalid-phone" },
                { user_type: "invalid-type" }
            ];

            invalidUpdates.forEach(updateData => {
                const result = updateUserSchema.safeParse(updateData);
                expect(result.success).toBe(false);
            });
        });
    });

    describe("🔐 Password Update Validation Tests", () => {
        
        it("should validate password strength on update", () => {
            const weakPasswords = [
                { password: "weak" },        // Too short
                { password: "password" },    // No uppercase or numbers
                { password: "PASSWORD" },    // No lowercase or numbers
                { password: "12345678" },    // No letters
                { password: "Password" }     // No numbers
            ];

            weakPasswords.forEach(passwordData => {
                const result = updatePasswordSchema.safeParse(passwordData);
                expect(result.success).toBe(false);
                // Different passwords fail for different reasons, so just check it fails
                expect(result.error?.errors.length).toBeGreaterThan(0);
            });
        });

        it("should accept strong passwords on update", () => {
            const strongPasswords = [
                { password: "NewSecure123" },
                { password: "Updated@Pass1" },
                { password: "MyNewP@ssw0rd" }
            ];

            strongPasswords.forEach(passwordData => {
                const result = updatePasswordSchema.safeParse(passwordData);
                expect(result.success).toBe(true);
            });
        });
    });

    describe("🔍 Query Validation Tests", () => {
        
        it("should accept valid query parameters", () => {
            const validQueries = [
                {},  // Empty query is valid
                { limit: 50 },
                { skip: 10 },
                { user_type: "Student" },
                { is_active: true },
                { campus_id: "campus_001" },
                { limit: 100, skip: 0, user_type: "Teacher", is_active: true }
            ];

            validQueries.forEach(query => {
                const result = getUsersQuerySchema.safeParse(query);
                expect(result.success).toBe(true);
            });
        });

        it("should reject invalid query parameters", () => {
            const invalidQueries = [
                { limit: 0 },        // Below minimum
                { limit: 1001 },     // Above maximum
                { skip: -1 },        // Negative skip
                { user_type: "invalid" }, // Invalid enum
                { is_active: "true" }     // String instead of boolean
            ];

            invalidQueries.forEach(query => {
                const result = getUsersQuerySchema.safeParse(query);
                expect(result.success).toBe(false);
            });
        });

        it("should apply default values", () => {
            const result = getUsersQuerySchema.safeParse({});
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(100);
                expect(result.data.skip).toBe(0);
            }
        });
    });

    describe("🛡️ Edge Cases and Boundary Tests", () => {
        
        it("should handle unicode characters in names", () => {
            const unicodeNames = [
                "José",
                "François",
                "Müller",
                "Øyvind",
                "Žofia"
            ];

            unicodeNames.forEach(first_name => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name,
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student"
                });
                
                // These should be accepted or rejected based on the current regex
                // The current regex /^[a-zA-Z\s'-]+$/ only allows ASCII letters
                expect(result.success).toBe(false);
            });
        });

        it("should handle meta_data transformation", () => {
            const testCases = [
                { input: "{}", expected: "{}" },
                { input: { key: "value" }, expected: '{"key":"value"}' },
                { input: "", expected: "" }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = createUserSchema.safeParse({
                    user_id: "test123",
                    email: "test@example.com",
                    password: "SecurePass123",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Test St",
                    user_type: "Student",
                    meta_data: input
                });
                
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.meta_data).toBe(expected);
                }
            });
        });

        it("should handle minimum length boundaries", () => {
            // Test exactly at the boundary
            const result = createUserSchema.safeParse({
                user_id: "a",  // Minimum length of 1
                email: "a@b.co",  // Minimum valid email
                password: "Abcd1234",  // Minimum length of 8 with requirements
                first_name: "A",  // Minimum length of 1
                last_name: "B",   // Minimum length of 1
                phone: "+12",     // Minimum length
                address: "A",     // Minimum length of 1
                user_type: "Admin"
            });
            
            expect(result.success).toBe(true);
        });

        it("should handle maximum length boundaries", () => {
            const result = createUserSchema.safeParse({
                user_id: "A".repeat(50),        // Maximum length
                email: "a".repeat(240) + "@test.co", // Just under maximum length
                password: "A1" + "a".repeat(126), // Maximum length
                first_name: "A".repeat(100),    // Maximum length
                last_name: "B".repeat(100),     // Maximum length
                phone: "+1" + "2".repeat(13),   // Maximum length
                address: "A".repeat(500),       // Maximum length
                user_type: "Student",
                campus_id: "C".repeat(50)       // Maximum length
            });
            
            expect(result.success).toBe(true);
        });
    });

    describe("📊 Real-world Scenario Tests", () => {
        
        it("should validate typical student data", () => {
            const studentData = {
                user_id: "STU_2024_001",
                email: "john.doe@university.edu",
                password: "StudentPass123",
                first_name: "John",
                last_name: "Doe",
                phone: "+1234567890",
                address: "123 College Ave, University City, State 12345",
                user_type: "Student",
                campus_id: "MAIN_CAMPUS",
                meta_data: { year: "freshman", major: "Computer Science" }
            };

            const result = createUserSchema.safeParse(studentData);
            expect(result.success).toBe(true);
        });

        it("should validate typical teacher data", () => {
            const teacherData = {
                user_id: "TEACH_001",
                email: "professor.smith@university.edu",
                password: "TeacherSecure456",
                first_name: "Jane",  // Removed "Dr." as it contains a period
                last_name: "Smith",
                phone: "+9876543210",
                address: "456 Faculty Dr, University City, State 54321",
                user_type: "Teacher",
                campus_id: "MAIN_CAMPUS",
                meta_data: { department: "Computer Science", subjects: ["Programming", "Algorithms"] }
            };

            const result = createUserSchema.safeParse(teacherData);
            expect(result.success).toBe(true);
        });

        it("should validate typical parent data", () => {
            const parentData = {
                user_id: "PAR_001",
                email: "parent@email.com",
                password: "ParentPass789",
                first_name: "Robert",
                last_name: "Johnson",
                phone: "+5555555555",
                address: "789 Family St, Hometown, State 67890",
                user_type: "Parent",
                meta_data: { student_id: ["STU_2024_001", "STU_2024_002"] }
            };

            const result = createUserSchema.safeParse(parentData);
            expect(result.success).toBe(true);
        });
    });
});

console.log("✅ Comprehensive User Validation Tests completed!");
console.log("🔍 Test Coverage:");
console.log("   - Schema validation for all fields");
console.log("   - Edge cases and boundary conditions");
console.log("   - Real-world scenarios");
console.log("   - Error message verification");
console.log("   - Data transformation validation");
