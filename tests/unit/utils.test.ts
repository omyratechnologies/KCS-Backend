import { describe, expect, it } from "@jest/globals";

// Test utility functions and helpers
describe("Utility Functions", () => {
    describe("Email Validation", () => {
        const validateEmail = (email: string): boolean => {
            // More comprehensive email validation
            const emailRegex =
                /^[\w!#$%&'*+/=?^`{|}~-]+(?:\.[\w!#$%&'*+/=?^`{|}~-]+)*@(?:[\da-z](?:[\da-z-]*[\da-z])?\.)+[\da-z](?:[\da-z-]*[\da-z])?$/i;

            // Additional checks for common invalid patterns
            if (email.includes("..") || email.includes(" ") || email.startsWith("@") || email.endsWith("@")) {
                return false;
            }

            return emailRegex.test(email);
        };

        it("should validate correct email formats", () => {
            const validEmails = [
                "user@example.com",
                "test.user@domain.co.uk",
                "user+tag@example.org",
                "user123@test-domain.com",
            ];

            for (const email of validEmails) {
                expect(validateEmail(email)).toBe(true);
            }
        });

        it("should reject invalid email formats", () => {
            const invalidEmails = [
                "invalid-email",
                "@example.com",
                "user@",
                "user space@example.com",
                "user..double@example.com",
            ];

            for (const email of invalidEmails) {
                expect(validateEmail(email)).toBe(false);
            }
        });
    });

    describe("Password Validation", () => {
        const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
            const errors: string[] = [];

            if (password.length < 8) {
                errors.push("Password must be at least 8 characters long");
            }

            if (!/[A-Z]/.test(password)) {
                errors.push("Password must contain at least one uppercase letter");
            }

            if (!/[a-z]/.test(password)) {
                errors.push("Password must contain at least one lowercase letter");
            }

            if (!/\d/.test(password)) {
                errors.push("Password must contain at least one number");
            }

            return {
                valid: errors.length === 0,
                errors,
            };
        };

        it("should accept strong passwords", () => {
            const strongPasswords = ["Password123", "MyStr0ngP@ss", "SecurePass1", "C0mpl3xP@ssw0rd"];

            for (const password of strongPasswords) {
                const result = validatePassword(password);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            }
        });

        it("should reject weak passwords", () => {
            const weakPasswords = [
                "weak", // Too short
                "alllowercase1", // No uppercase
                "ALLUPPERCASE1", // No lowercase
                "NoNumbers", // No numbers
                "Short1", // Too short
            ];

            for (const password of weakPasswords) {
                const result = validatePassword(password);
                expect(result.valid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            }
        });
    });

    describe("Date Utilities", () => {
        const formatDate = (date: Date): string => {
            return date.toISOString().split("T")[0];
        };

        const addDays = (date: Date, days: number): Date => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        };

        it("should format dates correctly", () => {
            const testDate = new Date("2025-08-05T10:30:00Z");
            expect(formatDate(testDate)).toBe("2025-08-05");
        });

        it("should add days to date correctly", () => {
            const baseDate = new Date("2025-08-05");
            const futureDate = addDays(baseDate, 7);

            expect(formatDate(futureDate)).toBe("2025-08-12");
        });

        it("should handle month/year transitions", () => {
            const endOfMonth = new Date("2025-08-31");
            const nextMonth = addDays(endOfMonth, 1);

            expect(formatDate(nextMonth)).toBe("2025-09-01");
        });
    });

    describe("String Utilities", () => {
        const slugify = (text: string): string => {
            return text
                .toLowerCase()
                .trim()
                .replaceAll(/[^\s\w-]/g, "")
                .replaceAll(/[\s_-]+/g, "-")
                .replaceAll(/^-+|-+$/g, "");
        };

        const capitalize = (text: string): string => {
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        };

        it("should create valid slugs", () => {
            expect(slugify("Hello World")).toBe("hello-world");
            expect(slugify("Special Characters!@#")).toBe("special-characters");
            expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
            expect(slugify("Underscores_and-dashes")).toBe("underscores-and-dashes");
        });

        it("should capitalize text correctly", () => {
            expect(capitalize("hello")).toBe("Hello");
            expect(capitalize("WORLD")).toBe("World");
            expect(capitalize("mIxEd CaSe")).toBe("Mixed case");
        });
    });

    describe("Array Utilities", () => {
        const chunk = <T>(array: T[], size: number): T[][] => {
            const chunks: T[][] = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        };

        const unique = <T>(array: T[]): T[] => {
            return [...new Set(array)];
        };

        it("should chunk arrays correctly", () => {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const chunked = chunk(numbers, 3);

            expect(chunked).toHaveLength(3);
            expect(chunked[0]).toEqual([1, 2, 3]);
            expect(chunked[1]).toEqual([4, 5, 6]);
            expect(chunked[2]).toEqual([7, 8, 9]);
        });

        it("should handle uneven chunks", () => {
            const numbers = [1, 2, 3, 4, 5];
            const chunked = chunk(numbers, 2);

            expect(chunked).toHaveLength(3);
            expect(chunked[2]).toEqual([5]);
        });

        it("should remove duplicates", () => {
            const withDuplicates = [1, 2, 2, 3, 3, 3, 4];
            const uniqueArray = unique(withDuplicates);

            expect(uniqueArray).toEqual([1, 2, 3, 4]);
        });
    });
});
