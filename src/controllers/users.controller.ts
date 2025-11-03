import { type Context } from "hono";

import { UserService } from "@/services/users.service";

export class UsersController {
    // Create
    public static readonly createUsers = async (c: Context) => {
        try {
            const _user_type = c.get("user_type");
            const _campus_id = c.get("campus_id");

            const { user_id, email, password, first_name, last_name, phone, address, meta_data, user_type, academic_year, class_id } =
                await c.req.json();

            let { campus_id } = await c.req.json();

            if (_user_type !== "Super Admin" && !_campus_id) {
                return c.json(
                    {
                        message: "You can only add users to your assigned campus",
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
                academic_year,
                class_id,
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
    // getParentForStudent
    public static readonly getParentForStudent = async (c: Context) => {
        try {
            const { id } = c.req.param();

            const parent = await UserService.getParentForStudent(id);

            return c.json(parent);
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

    //getStudentsForParent
    public static readonly getStudentsForParent = async (c: Context) => {
        try {
            const { id } = c.req.param();

            const students = await UserService.getStudentForParent(id);

            return c.json(students);
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

    // Get students with pagination and filters
    public static readonly getStudents = async (c: Context) => {
        try {
            const campus_id = c.get("campus_id");
            const query = c.req.query();

            // Validate academic_year and class_id - both must be provided together or neither
            const hasAcademicYear = !!query.academic_year;
            const hasClassId = !!query.class_id;
            
            if (hasAcademicYear !== hasClassId) {
                return c.json(
                    {
                        success: false,
                        message: "Both academic_year and class_id must be provided together, or neither should be included",
                    },
                    400
                );
            }

            const filters = {
                page: query.page ? Number.parseInt(query.page) : 1,
                limit: query.limit ? Number.parseInt(query.limit) : 20,
                user_type: "Student",
                search: query.search as string,
                user_id: query.user_id as string,
                email: query.email as string,
                name: query.name as string,
                phone: query.phone as string,
                is_active: query.is_active ? query.is_active === "true" : undefined,
                is_deleted: query.is_deleted ? query.is_deleted === "true" : false,
                from: query.from ? new Date(query.from) : undefined,
                to: query.to ? new Date(query.to) : undefined,
                sort_by: query.sort_by as string,
                sort_order: (query.sort_order as "asc" | "desc") || "desc",
                academic_year: query.academic_year as string,
                class_id: query.class_id as string,
            };

            const result = await UserService.getUsersWithFilters(campus_id, filters);
            
            return c.json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
}
