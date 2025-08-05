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
        createUsers: jest.fn(),
        getUser: jest.fn(),
        updateUsers: jest.fn(),
        getUsers: jest.fn(),
        updatePassword: jest.fn(),
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
            const { UserService } = await import("../../src/services/users.service");

            const userData = {
                user_id: "user123",
                name: "John Doe",
                email: "john@example.com",
                user_type: "student",
                phone: "+1234567890",
                password: "password123",
                first_name: "John",
                last_name: "Doe",
                address: "123 Main St",
                meta_data: "{}",
            };

            const createdUser = {
                id: userData.user_id,
                name: userData.name,
                email: userData.email,
                user_type: userData.user_type,
                created_at: new Date(),
            };

            UserService.createUsers.mockResolvedValue(createdUser);

            const createUser = async (c: any) => {
                try {
                    const data = await c.req.json();
                    const user = await UserService.createUsers(data);
                    return c.json({
                        success: true,
                        message: "User created successfully",
                        data: user,
                    });
                } catch (error) {
                    return c.json(
                        {
                            success: false,
                            message: "Failed to create user",
                            error: error instanceof Error ? error.message : "Unknown error",
                        },
                        400
                    );
                }
            };

            const response = await createUser(mockReq);

            expect(UserService.createUsers).toHaveBeenCalledWith(userData);
            expect(response).toEqual({
                success: true,
                message: "User created successfully",
                data: createdUser,
            });
        });

        it("should find user by ID successfully", async () => {
            const { UserService } = await import("../../src/services/users.service");

            const userId = "user123";
            const user = {
                id: userId,
                name: "John Doe",
                email: "john@example.com",
                user_type: "student",
            };

            UserService.getUser.mockResolvedValue(user);

            const findUserById = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const user = await UserService.getUser(id);

                    if (!user) {
                        return c.json({
                            success: false,
                            message: "User not found",
                        }, 404);
                    }

                    return c.json({
                        success: true,
                        data: user,
                    });
                } catch (error) {
                    return c.json({
                        success: false,
                        message: "Failed to fetch user",
                        error: error instanceof Error ? error.message : "Unknown error",
                    }, 500);
                }
            };

            mockReq.param.mockReturnValue(userId);
            const response = await findUserById(mockReq);

            expect(UserService.getUser).toHaveBeenCalledWith(userId);
            expect(response).toEqual({
                success: true,
                data: user,
            });
        });

        it("should return error when user not found", async () => {
            const { UserService } = await import("../../src/services/users.service");

            const userId = "nonexistent";
            mockReq.param.mockReturnValue(userId);
            UserService.getUser.mockRejectedValue(new Error("User not found"));

            const findUserById = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const user = await UserService.getUser(id);

                    if (!user) {
                        return c.json({
                            success: false,
                            message: "User not found",
                        }, 404);
                    }

                    return c.json({
                        success: true,
                        data: user,
                    });
                } catch (error) {
                    return c.json({
                        success: false,
                        message: "User not found",
                        error: error instanceof Error ? error.message : "Unknown error",
                    }, 404);
                }
            };

            const response = await findUserById(mockReq);

            expect(response).toEqual({
                success: false,
                message: "User not found",
                error: "User not found",
            });
        });

        it("should update user successfully", async () => {
            const { UserService } = await import("../../src/services/users.service");

            const userId = "user123";
            const updateData = {
                first_name: "John Updated",
                phone: "+9876543210",
            };

            const updatedUser = {
                id: userId,
                first_name: "John Updated",
                email: "john@example.com",
                phone: "+9876543210",
                updated_at: new Date(),
            };

            mockReq.param.mockReturnValue(userId);
            mockReq.json.mockResolvedValue(updateData);
            UserService.updateUsers.mockResolvedValue(updatedUser);

            const updateUser = async (c: any) => {
                try {
                    const id = c.req.param("id");
                    const data = await c.req.json();
                    const user = await UserService.updateUsers(id, data);

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

            expect(UserService.updateUsers).toHaveBeenCalledWith(userId, updateData);
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
