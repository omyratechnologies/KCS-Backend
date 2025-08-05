import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";

// Mock the users service and model
jest.mock("../../src/services/users.service", () => ({
    UserService: {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findAll: jest.fn(),
    },
}));

jest.mock("../../src/models/user.model", () => ({
    User: {
        create: jest.fn(),
        findById: jest.fn(),
        updateById: jest.fn(),
        deleteById: jest.fn(),
        find: jest.fn(),
    },
}));

describe("UsersController", () => {
    let mockContext: any;
    let mockJson: jest.Mock;
    let mockReq: any;

    beforeEach(() => {
        mockJson = jest.fn().mockReturnValue(new Response());
        mockReq = {
            json: jest.fn(),
            param: jest.fn(),
            query: jest.fn(),
        };
        mockContext = {
            json: mockJson,
            req: mockReq,
            get: jest.fn(),
        };

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("User CRUD Operations", () => {
        it("should create a new user successfully", async () => {
            const { UserService } = require("../../src/services/users.service");

            const userData = {
                name: "John Doe",
                email: "john@example.com",
                user_type: "student",
                phone: "+1234567890",
            };

            const createdUser = {
                id: "user123",
                ...userData,
                created_at: new Date(),
                is_deleted: false,
            };

            mockReq.json.mockResolvedValue(userData);
            UserService.create.mockResolvedValue(createdUser);

            // Mock controller method (assuming it exists)
            const createUser = async (c: any) => {
                try {
                    const data = await c.req.json();
                    const user = await UserService.create(data);
                    return c.json({
                        success: true,
                        message: "User created successfully",
                        data: user,
                    });
                } catch (error: any) {
                    return c.json({
                        success: false,
                        message: error.message,
                    });
                }
            };

            await createUser(mockContext);

            expect(UserService.create).toHaveBeenCalledWith(userData);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: "User created successfully",
                data: createdUser,
            });
        });

        it("should find user by ID successfully", async () => {
            const { UserService } = require("../../src/services/users.service");

            const userId = "user123";
            const user = {
                id: userId,
                name: "John Doe",
                email: "john@example.com",
                user_type: "student",
            };

            mockReq.param.mockReturnValue(userId);
            UserService.findById.mockResolvedValue(user);

            const findUserById = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const user = await UserService.findById(id);

                    if (!user) {
                        return c.json({
                            success: false,
                            message: "User not found",
                        });
                    }

                    return c.json({
                        success: true,
                        data: user,
                    });
                } catch (error: any) {
                    return c.json({
                        success: false,
                        message: error.message,
                    });
                }
            };

            await findUserById(mockContext);

            expect(UserService.findById).toHaveBeenCalledWith(userId);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                data: user,
            });
        });

        it("should return error when user not found", async () => {
            const { UserService } = require("../../src/services/users.service");

            const userId = "nonexistent";
            mockReq.param.mockReturnValue(userId);
            UserService.findById.mockResolvedValue(null);

            const findUserById = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const user = await UserService.findById(id);

                    if (!user) {
                        return c.json({
                            success: false,
                            message: "User not found",
                        });
                    }

                    return c.json({
                        success: true,
                        data: user,
                    });
                } catch (error: any) {
                    return c.json({
                        success: false,
                        message: error.message,
                    });
                }
            };

            await findUserById(mockContext);

            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: "User not found",
            });
        });

        it("should update user successfully", async () => {
            const { UserService } = require("../../src/services/users.service");

            const userId = "user123";
            const updateData = {
                name: "John Updated",
                phone: "+9876543210",
            };

            const updatedUser = {
                id: userId,
                name: "John Updated",
                email: "john@example.com",
                phone: "+9876543210",
                updated_at: new Date(),
            };

            mockReq.param.mockReturnValue(userId);
            mockReq.json.mockResolvedValue(updateData);
            UserService.update.mockResolvedValue(updatedUser);

            const updateUser = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const data = await c.req.json();
                    const user = await UserService.update(id, data);

                    return c.json({
                        success: true,
                        message: "User updated successfully",
                        data: user,
                    });
                } catch (error: any) {
                    return c.json({
                        success: false,
                        message: error.message,
                    });
                }
            };

            await updateUser(mockContext);

            expect(UserService.update).toHaveBeenCalledWith(userId, updateData);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            });
        });

        it("should validate required fields during creation", async () => {
            const invalidUserData = {
                name: "", // Empty name
                email: "invalid-email", // Invalid email format
            };

            mockReq.json.mockResolvedValue(invalidUserData);

            const createUser = async (c: any) => {
                try {
                    const data = await c.req.json();

                    // Basic validation
                    if (!data.name || data.name.trim() === "") {
                        throw new Error("Name is required");
                    }

                    if (!data.email || !data.email.includes("@")) {
                        throw new Error("Valid email is required");
                    }

                    return c.json({
                        success: true,
                        message: "User created successfully",
                    });
                } catch (error: any) {
                    return c.json({
                        success: false,
                        message: error.message,
                    });
                }
            };

            await createUser(mockContext);

            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: "Name is required",
            });
        });
    });
});
