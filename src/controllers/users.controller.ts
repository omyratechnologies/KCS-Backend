import { type Context } from "hono";

import { UserService } from "@/services/users.service";

export class UsersController {
    // Create
    public static readonly createUsers = async (c: Context) => {
        try {
            const _user_type = c.get("user_type");
            const _campus_id = c.get("campus_id");

            const {
                user_id,
                email,
                password,
                first_name,
                last_name,
                phone,
                address,
                meta_data,
                user_type,
            } = await c.req.json();

            let { campus_id } = await c.req.json();

            if (_user_type !== "Super Admin" && !_campus_id) {
                return c.json(
                    {
                        message:
                            "You can only add users to your assigned campus",
                    },
                    401
                );
            }

            if (_user_type !== "Super Admin" && !_campus_id) {
                return c.json(
                    {
                        message: "Campus ID is required",
                    },
                    400
                );
            }

            if (!campus_id && _user_type !== "Super Admin") {
                campus_id = _campus_id;
            }

            const users = await UserService.createUsers({
                user_id,
                email,
                password,
                first_name,
                last_name,
                phone,
                address,
                meta_data,
                user_type,
                campus_id,
            });

            return c.json(users);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
    // Get All
    public static readonly getUsers = async (c: Context) => {
        try {
            const campus_id = c.get("campus_id");
            const users = await UserService.getUsers(campus_id);

            return c.json(users);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Get One
    public static readonly getUser = async (c: Context) => {
        try {
            const { id } = c.req.param();

            const users = await UserService.getUser(id);

            return c.json(users);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Update
    public static readonly updateUsers = async (c: Context) => {
        try {
            const { id } = c.req.param();
            const data = await c.req.json();

            await UserService.updateUsers(id, data);

            return c.json({
                message: "Users updated successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Delete
    public static readonly deleteUsers = async (c: Context) => {
        try {
            const { id } = c.req.param();

            await UserService.deleteUsers(id);

            return c.json({
                message: "Users deleted successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
}
